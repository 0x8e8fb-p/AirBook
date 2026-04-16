import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const cabin = searchParams.get('cabin') || 'economy';

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    // Log search regardless of whether user is logged in
    await prisma.searchHistory.create({
      data: {
        userId: session?.user ? (session.user as any).id : null,
        origin,
        destination,
        departureDate: new Date(date),
        adults,
        cabinClass: cabin
      }
    }).catch(err => console.error("Failed to log search history", err));

    // Since we now do actual searching via Server Actions (flightActions.ts),
    // this API route is mainly for backward compatibility or simple history logging.
    // For a real integration, we'd trigger the background search here or return a job ID.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Search logged successfully. Note: Actual scraping is handled by Server Actions.' 
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
