#!/usr/bin/env python3
"""Bridge: TheWingScan → Google Flights via the `fast-flights` library.

Reads search params as JSON on stdin, writes results as JSON on stdout.
Called by `src/lib/api/google-flights-provider.ts` via child_process.

Install once:
    pip install -r scripts/requirements.txt
    # or, if you use a venv:
    python3 -m venv .venv && source .venv/bin/activate && pip install -r scripts/requirements.txt

Stdin shape (JSON):
    {
      "origin":      "BLR",          // IATA
      "destination": "DEL",          // IATA
      "date":        "2026-07-15",   // YYYY-MM-DD
      "passengers":  1,              // optional, default 1
      "cabin":       "economy"       // economy | premium_economy | business | first
    }

Stdout shape (JSON):
    Success: { "success": true,  "flights": [...] }
    Failure: { "success": false, "error":   "...", "kind": "import|fetch|parse" }

Exit code is always 0 — the caller is expected to inspect `success`.
"""
import json
import sys
from typing import Any


# fast-flights >= 2.2 expects string seat keys (see
# fast_flights/flights_impl.py: from_interface). The earlier integer
# mapping triggered `KeyError: 1`.
CABIN_MAP: dict[str, str] = {
    "economy":         "economy",
    "premium_economy": "premium-economy",
    "premium-economy": "premium-economy",
    "business":        "business",
    "first":           "first",
}


def main() -> None:
    try:
        raw = sys.stdin.read()
        params = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as e:
        emit_failure("parse", f"invalid stdin JSON: {e}")
        return

    origin      = (params.get("origin") or "").upper()
    destination = (params.get("destination") or "").upper()
    date        = params.get("date") or ""
    passengers  = int(params.get("passengers") or 1)
    cabin       = (params.get("cabin") or "economy").lower()

    if not origin or not destination or not date:
        emit_failure("parse", "missing required field: origin / destination / date")
        return

    try:
        # Import lazily so we can report a clean failure when the
        # package isn't installed yet.
        from fast_flights import FlightData, Passengers, get_flights  # type: ignore
    except ImportError as e:
        emit_failure(
            "import",
            f"fast-flights not installed (pip install -r scripts/requirements.txt): {e}",
        )
        return

    try:
        # fast-flights 2.2: get_flights() takes everything keyword-only;
        # no separate create_filter step.
        result = get_flights(
            flight_data=[FlightData(date=date, from_airport=origin, to_airport=destination)],
            trip="one-way",
            seat=CABIN_MAP.get(cabin, "economy"),
            passengers=Passengers(adults=max(passengers, 1)),
        )
    except Exception as e:  # noqa: BLE001 - fast-flights raises a wide range
        emit_failure("fetch", f"google flights request failed: {type(e).__name__}: {e}")
        return

    flights: list[dict[str, Any]] = []
    for f in getattr(result, "flights", []) or []:
        flights.append({
            "airline":        getattr(f, "name",       "") or "",
            "departure_time": getattr(f, "departure",  "") or "",
            "arrival_time":   getattr(f, "arrival",    "") or "",
            "duration":       getattr(f, "duration",   "") or "",
            "stops":          stops_to_int(getattr(f, "stops", 0)),
            "price":          parse_price(getattr(f, "price", "")),
            "is_best":        bool(getattr(f, "is_best", False)),
        })

    json.dump(
        {
            "success":       True,
            "flights":       flights,
            "current_price": getattr(result, "current_price", None),
        },
        sys.stdout,
    )


def stops_to_int(raw: Any) -> int:
    """fast-flights returns stops as int OR string ("Nonstop", "1 stop",
    "Unknown"). Normalise to int."""
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str):
        lower = raw.lower()
        if "nonstop" in lower or lower == "0":
            return 0
        digits = "".join(ch for ch in raw if ch.isdigit())
        return int(digits) if digits else 0
    return 0


def parse_price(raw: Any) -> float:
    """fast-flights returns price as a localised string ("₹4,521" / "$120").
    We strip non-digits and parse as float. Returns 0 on failure."""
    if isinstance(raw, (int, float)):
        return float(raw)
    if not isinstance(raw, str):
        return 0.0
    cleaned = "".join(ch for ch in raw if ch.isdigit() or ch == ".")
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0


def emit_failure(kind: str, message: str) -> None:
    json.dump({"success": False, "kind": kind, "error": message}, sys.stdout)


if __name__ == "__main__":
    main()
