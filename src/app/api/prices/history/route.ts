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
    // Exclude anomalous basePrice 0 logs
    const history = await prisma.priceHistory.findMany({
      where: {
        route: {
          origin,
          destination,
        },
        departureDate: {
          gte: new Date(new Date(dateStr).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(dateStr).setHours(23, 59, 59, 999))
        },
        basePrice: {
          gt: 0 // Ignore anomalous bugs from previous scraper versions
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