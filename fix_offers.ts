import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const offers = await prisma.flightOffer.findMany({
    where: { bankCode: 'AXIS', category: 'bank_dc' }
  });
  
  for (const offer of offers) {
    if (offer.name.includes('1000')) {
      await prisma.flightOffer.update({
        where: { id: offer.id },
        data: {
          platform: 'makemytrip',
          promoCode: 'MMTAXISDC',
          url: 'https://www.makemytrip.com/promos/axis-bank-offers.html',
          description: 'Flat ₹1000 off on MakeMyTrip using Axis Bank Debit Cards. Minimum booking amount ₹5000.'
        }
      });
      console.log('Updated Axis DC offer:', offer.id);
    }
  }

  // Update ANY offers that have platform="any" to null so it says "Any Platform" or we can just leave it
}
main().catch(console.error).finally(() => prisma.$disconnect());
