from fastapi import FastAPI, Query
from fast_flights import FlightData, Passengers, get_flights

app = FastAPI()

CABIN_MAP = {
    "economy": "economy",
    "premium_economy": "premium-economy",
    "premium-economy": "premium-economy",
    "business": "business",
    "first": "first",
}

def parse_price(raw) -> float:
    if isinstance(raw, (int, float)):
        return float(raw)
    if not isinstance(raw, str):
        return 0.0
    cleaned = "".join(ch for ch in raw if ch.isdigit() or ch == ".")
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0

def stops_to_int(raw) -> int:
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str):
        lower = raw.lower()
        if "nonstop" in lower or lower == "0":
            return 0
        digits = "".join(ch for ch in raw if ch.isdigit())
        return int(digits) if digits else 0
    return 0

def get_flights_data(origin: str, destination: str, date: str, passengers: int, cabin: str):
    try:
        result = get_flights(
            flight_data=[FlightData(date=date, from_airport=origin.upper(), to_airport=destination.upper())],
            trip="one-way",
            seat=CABIN_MAP.get(cabin.lower(), "economy"),
            passengers=Passengers(adults=max(passengers, 1)),
        )
        
        flights = []
        for f in getattr(result, "flights", []) or []:
            flights.append({
                "airline": getattr(f, "name", "") or "",
                "departure_time": getattr(f, "departure", "") or "",
                "arrival_time": getattr(f, "arrival", "") or "",
                "duration": getattr(f, "duration", "") or "",
                "stops": stops_to_int(getattr(f, "stops", 0)),
                "price": parse_price(getattr(f, "price", "")),
                "is_best": bool(getattr(f, "is_best", False)),
            })
            
        return {
            "success": True,
            "flights": flights,
            "current_price": getattr(result, "current_price", None)
        }
    except Exception as e:
        return {
            "success": False,
            "kind": "fetch",
            "error": f"{type(e).__name__}: {str(e)}"
        }

@app.get("/")
@app.get("/api/flights")
def read_flights(
    origin: str,
    destination: str,
    date: str,
    passengers: int = 1,
    cabin: str = "economy"
):
    return get_flights_data(origin, destination, date, passengers, cabin)
