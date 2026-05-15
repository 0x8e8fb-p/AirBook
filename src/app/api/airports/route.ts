import { NextResponse } from "next/server";
import { travelpayoutsApi, TravelpayoutsConfigError, TravelpayoutsError } from "@/lib/api/travelpayoutsClient";
import { searchAirports as searchLocalAirports } from "@/lib/airports";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 8, 15) : 8;

  if (query.length < 1) {
    return NextResponse.json([], { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  try {
    const { airports } = await travelpayoutsApi.searchAirports({ q: query, limit });
    if (airports.length > 0) {
      return NextResponse.json(airports, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }
  } catch (err) {
    if (!(err instanceof TravelpayoutsConfigError) && !(err instanceof TravelpayoutsError)) {
      console.error("Travelpayouts airport search error:", err);
    }
  }

  const local = searchLocalAirports(query, limit);
  return NextResponse.json(local, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
