import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const dateStr = searchParams.get('date');

  if (!origin || !destination || !dateStr) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // We want all price history for this specific route and departure date, ordered by recorded time
    const history = await prisma.priceHistory.findMany({
      where: {
        route: {
          origin,
          destination,
        },
        departureDate: {
          gte: new Date(new Date(dateStr).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(dateStr).setHours(23, 59, 59, 999))
        }
      },
      orderBy: {
        recordedAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("[Price History API] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}