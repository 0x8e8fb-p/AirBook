// ============================================
// FareCracker — Airport Autocomplete API Route
// ============================================

import { NextResponse } from 'next/server';
import { searchAirports } from '@/lib/airports';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? Math.min(parseInt(limitStr, 10), 15) : 8;

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  const results = searchAirports(query, limit);

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, max-age=86400', // 24h cache for airport data
    },
  });
}
