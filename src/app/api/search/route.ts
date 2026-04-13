// ============================================
// AirBook — Flight Search API Route
// ============================================

import { NextResponse } from 'next/server';
import { orchestrateSearch } from '@/lib/api/search-orchestrator';
import { searchParamsSchema } from '@/lib/validators';
import type { SearchParams } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 20; // seconds

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = searchParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const params: SearchParams = parsed.data;

    // Execute parallel search
    const results = await orchestrateSearch(params);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'private, max-age=900', // 15 min cache
      },
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during flight search' },
      { status: 500 }
    );
  }
}
