import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAndTrackFlights } from '@/app/actions/flightActions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

const POPULAR_ROUTES = [
  { origin: 'DEL', destination: 'BOM' },
  { origin: 'BLR', destination: 'DEL' },
  { origin: 'BOM', destination: 'GOI' },
  { origin: 'DEL', destination: 'VTZ' }
];

export async function GET(request: Request) {
  // Simple auth to prevent abuse
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (key !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];
  const today = new Date();

  // Track 7, 14, and 30 days out
  const targetDays = [7, 14, 30];

  try {
    for (const route of POPULAR_ROUTES) {
      for (const daysOut of targetDays) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysOut);
        const dateStr = targetDate.toISOString().split('T')[0];

        try {
          console.log(`[Cron] Tracking ${route.origin}-${route.destination} for ${dateStr}`);
          // getAndTrackFlights handles the DB logging internally
          const flights = await getAndTrackFlights(route.origin, route.destination, dateStr);
          const lowestPrice = flights.length > 0 ? Math.min(...flights.map(f => f.pricing.effectivePrice)) : null;

          if (lowestPrice) {
            // Check for any active alerts for this route that match the lowest price
            const activeAlerts = await prisma.priceAlert.findMany({
              where: {
                origin: route.origin,
                destination: route.destination,
                active: true,
                targetPrice: { gte: lowestPrice },
                OR: [
                  { lastNotified: null },
                  { lastNotified: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Only notify once per 24h
                ]
              },
              include: { user: true }
            });

            for (const alert of activeAlerts) {
              if (alert.user.email) {
                console.log(`[Cron] Sending price drop alert to ${alert.user.email} for ${route.origin}-${route.destination}`);
                try {
                  if (process.env.RESEND_API_KEY) {
                    await resend.emails.send({
                      from: 'AirBook Alerts <alerts@updates.airbook.com>',
                      to: alert.user.email,
                      subject: `🚨 Price Drop: ${route.origin} to ${route.destination} is now ₹${lowestPrice}`,
                      html: `<p>Good news! The flight from ${route.origin} to ${route.destination} has dropped to ₹${lowestPrice}, which is below your target of ₹${alert.targetPrice}.</p><p>Book now on AirBook!</p>`
                    });
                  }
                  
                  await prisma.priceAlert.update({
                    where: { id: alert.id },
                    data: { lastNotified: new Date() }
                  });
                } catch (e) {
                  console.error(`[Cron] Failed to send email to ${alert.user.email}:`, e);
                }
              }
            }
          }

          results.push({
            route: `${route.origin}-${route.destination}`,
            date: dateStr,
            flightsFound: flights.length,
            lowestPrice
          });
        } catch (err) {
          console.error(`[Cron] Error tracking ${route.origin}-${route.destination} for ${dateStr}:`, err);
          results.push({
            route: `${route.origin}-${route.destination}`,
            date: dateStr,
            error: String(err)
          });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[Cron] Critical Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}