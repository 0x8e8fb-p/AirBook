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

    // [New] Persistence: Log search history if user is authenticated
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('search_history').insert({
          user_id: user.id,
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
          cabin_class: params.cabinClass
        });
      }
    } catch (dbError) {
      // Fail silently for DB logging to not block search results
      console.error('[Search API] Logging error:', dbError);
    }

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
