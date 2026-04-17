'use server';

import prisma from '@/lib/prisma';
import { invalidateOfferCache } from './offerEngine';

interface ScrapedOffer {
  source: string;
  category: string;
  bankCode?: string;
  name: string;
  description?: string;
  type: 'percentage' | 'flat';
  value: number;
  maxCap?: number;
  minBooking?: number;
  promoCode?: string;
  platform?: string;
  airline?: string;
  url?: string;
  validUntil: Date;
  priority?: number;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-IN,en;q=0.9',
};

// ── Utility: extract offers from GrabOn-style HTML ──
function parseGrabOnOffers(html: string, sourceTag: string): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  // Match coupon card patterns: title, discount value, validity
  const cardPattern = /<div[^>]*class="[^"]*coupon[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
  const cards = html.match(cardPattern) || [];

  for (const card of cards.slice(0, 20)) {
    // Extract discount text
    const discountMatch = card.match(/(?:flat\s*₹?\s*(\d+)\s*off|(\d+)%\s*off|up\s*to\s*₹?\s*(\d+))/i);
    if (!discountMatch) continue;

    const titleMatch = card.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
    const name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Flight Offer';

    // Extract validity
    const validMatch = card.match(/valid\s*(?:till|until|upto)\s*:?\s*(\d{1,2}\s*\w+\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
    let validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1); // default 1 month
    if (validMatch) {
      const parsed = new Date(validMatch[1]);
      if (!isNaN(parsed.getTime())) validUntil = parsed;
    }

    // Extract promo code
    const codeMatch = card.match(/code\s*:?\s*([A-Z0-9]+)/i);

    // Determine type and value
    let type: 'percentage' | 'flat' = 'flat';
    let value = 0;
    let maxCap: number | undefined;

    if (discountMatch[2]) {
      type = 'percentage';
      value = parseInt(discountMatch[2]) / 100;
      if (discountMatch[3]) maxCap = parseInt(discountMatch[3]);
    } else if (discountMatch[1]) {
      type = 'flat';
      value = parseInt(discountMatch[1]);
    }

    if (value <= 0) continue;

    // Detect bank from title
    const bankMap: Record<string, string> = {
      'hdfc': 'HDFC', 'sbi': 'SBI', 'icici': 'ICICI', 'axis': 'AXIS',
      'kotak': 'KOTAK', 'yes bank': 'YES', 'rbl': 'RBL', 'amex': 'AMEX',
      'standard chartered': 'SC', 'indusind': 'INDUS', 'idfc': 'IDFC',
      'au bank': 'AU', 'hsbc': 'HSBC', 'bob': 'BOB', 'federal': 'FEDERAL',
    };
    let bankCode: string | undefined;
    const nameLower = name.toLowerCase();
    for (const [key, code] of Object.entries(bankMap)) {
      if (nameLower.includes(key)) { bankCode = code; break; }
    }

    offers.push({
      source: sourceTag,
      category: bankCode ? 'bank_cc' : 'ota_coupon',
      bankCode,
      name,
      type,
      value,
      maxCap,
      promoCode: codeMatch?.[1],
      validUntil,
    });
  }

  return offers;
}

// ── Scrape a single source ──
async function scrapeSource(url: string, sourceTag: string): Promise<ScrapedOffer[]> {
  try {
    const resp = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const html = await resp.text();
    return parseGrabOnOffers(html, sourceTag);
  } catch (err) {
    console.warn(`[OfferScraper] Failed to scrape ${sourceTag}:`, err);
    return [];
  }
}

// ── Main sync function ──
export async function syncOffers(): Promise<{ added: number; deactivated: number; errors: string[] }> {
  const errors: string[] = [];
  const allScraped: ScrapedOffer[] = [];

  // Scrape from multiple sources in parallel
  const sources = [
    { url: 'https://www.grabon.in/flight-coupons/', tag: 'grabon_flights' },
    { url: 'https://www.grabon.in/hdfc-bank-offers/', tag: 'grabon_hdfc' },
    { url: 'https://www.grabon.in/icici-bank-offers/', tag: 'grabon_icici' },
    { url: 'https://www.grabon.in/sbi-bank-offers/', tag: 'grabon_sbi' },
    { url: 'https://www.grabon.in/axis-bank-offers/', tag: 'grabon_axis' },
  ];

  const results = await Promise.allSettled(
    sources.map(s => scrapeSource(s.url, s.tag))
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      allScraped.push(...r.value);
    } else {
      errors.push(`${sources[i].tag}: ${r.reason}`);
    }
  }

  // Deactivate expired offers
  const deactivated = await prisma.flightOffer.updateMany({
    where: {
      active: true,
      validUntil: { lt: new Date() },
    },
    data: { active: false },
  });

  // Insert scraped offers (skip duplicates by name)
  let added = 0;
  for (const offer of allScraped) {
    const exists = await prisma.flightOffer.findFirst({
      where: { name: offer.name, source: offer.source, active: true },
    });
    if (!exists) {
      await prisma.flightOffer.create({
        data: {
          source: offer.source,
          category: offer.category,
          bankCode: offer.bankCode || null,
          name: offer.name,
          description: offer.description || null,
          type: offer.type,
          value: offer.value,
          maxCap: offer.maxCap || null,
          minBooking: offer.minBooking || 0,
          promoCode: offer.promoCode || null,
          platform: offer.platform || null,
          airline: offer.airline || null,
          url: offer.url || null,
          validUntil: offer.validUntil,
          active: true,
          priority: offer.priority || 0,
          updatedAt: new Date(),
        },
      });
      added++;
    }
  }

  // Invalidate cache so new offers are picked up
  invalidateOfferCache();

  return { added, deactivated: deactivated.count, errors };
}
