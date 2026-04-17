import { NextResponse } from 'next/server';
import { syncOffers } from '@/lib/flight/offerScraper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncOffers();
    return NextResponse.json({
      success: true,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Offer sync failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
