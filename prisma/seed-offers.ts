import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const endOfMonth = new Date('2026-04-30T23:59:59Z');
const endOfQ2 = new Date('2026-06-30T23:59:59Z');
const endOfYear = new Date('2026-12-31T23:59:59Z');

const offers = [
  // ── BANK CREDIT CARDS (with specific partner platforms) ──
  { source:'manual', category:'bank_cc', bankCode:'HDFC', name:'15% off up to ₹1,500 on HDFC Credit Cards', type:'percentage', value:0.15, maxCap:1500, minBooking:5000, validUntil:endOfMonth, priority:10, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'HDFC', name:'Flat ₹2,000 off on HDFC EMI', type:'flat', value:2000, minBooking:10000, promoCode:'HDFCEMI', validUntil:endOfMonth, priority:8, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'SBI', name:'10% off up to ₹1,200 on SBI Credit Cards', type:'percentage', value:0.10, maxCap:1200, minBooking:3000, validUntil:endOfMonth, priority:9, platform:'yatra' },
  { source:'manual', category:'bank_cc', bankCode:'SBI', name:'12% off up to ₹1,500 on SBI Cards (Wednesdays)', type:'percentage', value:0.12, maxCap:1500, minBooking:4000, validUntil:endOfQ2, platform:'yatra' },
  { source:'manual', category:'bank_cc', bankCode:'ICICI', name:'15% off up to ₹1,500 on ICICI Credit Cards', type:'percentage', value:0.15, maxCap:1500, minBooking:5000, validUntil:endOfMonth, priority:10, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'ICICI', name:'Flat ₹500 off on ICICI Netbanking', type:'flat', value:500, minBooking:3000, validUntil:endOfQ2, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'ICICI', name:'5% unlimited cashback on Amazon Pay ICICI', type:'percentage', value:0.05, maxCap:99999, minBooking:0, validUntil:endOfYear, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'AXIS', name:'12% off up to ₹1,200 on Axis Credit Cards', type:'percentage', value:0.12, maxCap:1200, minBooking:4000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'AXIS', name:'4% cashback on Flipkart Axis Card', type:'percentage', value:0.04, maxCap:99999, minBooking:0, validUntil:endOfYear, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'KOTAK', name:'10% off up to ₹1,000 on Kotak Credit Cards', type:'percentage', value:0.10, maxCap:1000, minBooking:3500, validUntil:endOfMonth, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'KOTAK', name:'Flat ₹811 off on Kotak 811 Credit Card', type:'flat', value:811, minBooking:4000, validUntil:endOfQ2, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'YES', name:'15% off up to ₹1,500 on Yes Bank Credit Cards', type:'percentage', value:0.15, maxCap:1500, minBooking:4500, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'RBL', name:'Flat ₹1,200 off on RBL Credit Cards', type:'flat', value:1200, minBooking:5000, validUntil:endOfQ2, platform:'easemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'SC', name:'20% off up to ₹2,000 on Standard Chartered Cards', type:'percentage', value:0.20, maxCap:2000, minBooking:6000, validUntil:endOfMonth, priority:10, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'AMEX', name:'Flat ₹1,500 off on American Express Cards', type:'flat', value:1500, minBooking:8000, validUntil:endOfQ2, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'AMEX', name:'15% off up to ₹2,500 on Amex Platinum', type:'percentage', value:0.15, maxCap:2500, minBooking:10000, validUntil:endOfQ2, priority:10, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'INDUS', name:'12% off up to ₹1,200 on IndusInd Credit Cards', type:'percentage', value:0.12, maxCap:1200, minBooking:4000, validUntil:endOfMonth, platform:'goibibo' },
  { source:'manual', category:'bank_cc', bankCode:'IDFC', name:'10% off up to ₹1,000 on IDFC First Credit Cards', type:'percentage', value:0.10, maxCap:1000, minBooking:3000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'AU', name:'15% off up to ₹1,500 on AU Small Finance Bank Cards', type:'percentage', value:0.15, maxCap:1500, minBooking:5000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'HSBC', name:'Flat ₹1,000 off on HSBC Credit Cards', type:'flat', value:1000, minBooking:5000, validUntil:endOfQ2, platform:'cleartrip' },
  { source:'manual', category:'bank_cc', bankCode:'BOB', name:'10% off up to ₹1,200 on Bank of Baroda Credit Cards', type:'percentage', value:0.10, maxCap:1200, minBooking:4000, validUntil:endOfMonth, platform:'ixigo' },
  { source:'manual', category:'bank_cc', bankCode:'FEDERAL', name:'15% off up to ₹1,500 on Federal Bank Credit Cards', type:'percentage', value:0.15, maxCap:1500, minBooking:5000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'CANARA', name:'8% off up to ₹800 on Canara Bank Credit Cards', type:'percentage', value:0.08, maxCap:800, minBooking:3000, validUntil:endOfQ2, platform:'ixigo' },
  { source:'manual', category:'bank_cc', bankCode:'PNB', name:'10% off up to ₹1,000 on PNB Credit Cards', type:'percentage', value:0.10, maxCap:1000, minBooking:3500, validUntil:endOfQ2, platform:'ixigo' },
  { source:'manual', category:'bank_cc', bankCode:'UNION', name:'8% off up to ₹750 on Union Bank Credit Cards', type:'percentage', value:0.08, maxCap:750, minBooking:3000, validUntil:endOfQ2, platform:'easemytrip' },
  { source:'manual', category:'bank_cc', bankCode:'CITI', name:'12% off up to ₹1,500 on Citi Credit Cards', type:'percentage', value:0.12, maxCap:1500, minBooking:5000, validUntil:endOfMonth, platform:'cleartrip' },

  // ── BANK DEBIT CARDS (with specific partner platforms) ──
  { source:'manual', category:'bank_dc', bankCode:'HDFC', name:'10% off up to ₹1,000 on HDFC Debit Cards', type:'percentage', value:0.10, maxCap:1000, minBooking:4000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_dc', bankCode:'AXIS', name:'Flat ₹1,000 off on Axis Bank Debit Cards', type:'flat', value:1000, minBooking:4000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_dc', bankCode:'ICICI', name:'8% off up to ₹800 on ICICI Debit Cards', type:'percentage', value:0.08, maxCap:800, minBooking:3000, validUntil:endOfQ2, platform:'makemytrip' },
  { source:'manual', category:'bank_dc', bankCode:'SBI', name:'5% off up to ₹500 on SBI Debit Cards', type:'percentage', value:0.05, maxCap:500, minBooking:3000, validUntil:endOfQ2, platform:'yatra' },
  { source:'manual', category:'bank_dc', bankCode:'KOTAK', name:'7% off up to ₹700 on Kotak Debit Cards', type:'percentage', value:0.07, maxCap:700, minBooking:3000, validUntil:endOfQ2, platform:'cleartrip' },

  // ── BANK EMI ──
  { source:'manual', category:'bank_emi', bankCode:'HDFC', name:'Flat ₹2,000 off on HDFC 6-month EMI', type:'flat', value:2000, minBooking:10000, promoCode:'HDFC6EMI', validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_emi', bankCode:'ICICI', name:'10% off up to ₹1,500 on ICICI EMI', type:'percentage', value:0.10, maxCap:1500, minBooking:8000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_emi', bankCode:'AXIS', name:'Flat ₹1,500 off on Axis 3-month EMI', type:'flat', value:1500, minBooking:8000, validUntil:endOfMonth, platform:'makemytrip' },
  { source:'manual', category:'bank_emi', bankCode:'SBI', name:'8% off up to ₹1,200 on SBI EMI', type:'percentage', value:0.08, maxCap:1200, minBooking:6000, validUntil:endOfQ2, platform:'yatra' },
  { source:'manual', category:'bank_emi', bankCode:'KOTAK', name:'Flat ₹1,000 off on Kotak EMI', type:'flat', value:1000, minBooking:6000, validUntil:endOfQ2, platform:'cleartrip' },

  // ── UPI & WALLETS ──
  { source:'manual', category:'upi_wallet', bankCode:'CRED', name:'Flat ₹500 off via CRED Pay', type:'flat', value:500, minBooking:2500, validUntil:endOfQ2 },
  { source:'manual', category:'upi_wallet', bankCode:'PAYTM', name:'10% cashback up to ₹500 on Paytm', type:'percentage', value:0.10, maxCap:500, minBooking:2000, validUntil:endOfMonth },
  { source:'manual', category:'upi_wallet', bankCode:'PHONEPE', name:'Flat ₹300 off on PhonePe UPI', type:'flat', value:300, minBooking:2000, validUntil:endOfMonth },
  { source:'manual', category:'upi_wallet', bankCode:'MOBIKWIK', name:'15% SuperCash up to ₹1,000 on MobiKwik', type:'percentage', value:0.15, maxCap:1000, minBooking:3000, validUntil:endOfQ2 },
  { source:'manual', category:'upi_wallet', bankCode:'GPAY', name:'5% cashback up to ₹250 on Google Pay', type:'percentage', value:0.05, maxCap:250, minBooking:1500, validUntil:endOfMonth },
  { source:'manual', category:'upi_wallet', bankCode:'FREECHARGE', name:'10% cashback up to ₹400 on Freecharge', type:'percentage', value:0.10, maxCap:400, minBooking:2000, validUntil:endOfQ2 },
  { source:'manual', category:'upi_wallet', bankCode:'AMAZONPAY', name:'Flat ₹200 off on Amazon Pay', type:'flat', value:200, minBooking:1500, validUntil:endOfMonth },

  // ── AIRLINE PROMOS ──
  { source:'manual', category:'airline_promo', airline:'6E', name:'Flat ₹400 off on IndiGo flights', type:'flat', value:400, minBooking:3500, promoCode:'6E400', validUntil:endOfMonth, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'QP', name:'10% off up to ₹800 on Akasa Air', type:'percentage', value:0.10, maxCap:800, minBooking:3000, promoCode:'QP10', validUntil:endOfMonth, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'AI', name:'Flat ₹500 off on Air India flights', type:'flat', value:500, minBooking:4000, promoCode:'AIFLY', validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'SG', name:'Flat ₹350 off on SpiceJet flights', type:'flat', value:350, minBooking:3000, promoCode:'SPICY', validUntil:endOfMonth, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'UK', name:'10% off up to ₹1,000 on Vistara', type:'percentage', value:0.10, maxCap:1000, minBooking:4000, promoCode:'UKFLY', validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'IX', name:'Flat ₹300 off on Air India Express', type:'flat', value:300, minBooking:2500, promoCode:'AIEFLY', validUntil:endOfMonth, platform:'airline_direct' },
  { source:'manual', category:'airline_promo', airline:'6E', name:'IndiGo Sale — fares from ₹999', type:'flat', value:200, minBooking:999, promoCode:'6ESALE', validUntil:endOfMonth, platform:'airline_direct', priority:5 },

  // ── OTA COUPONS ──
  { source:'manual', category:'ota_coupon', name:'Flat ₹600 off on MakeMyTrip', type:'flat', value:600, minBooking:4000, promoCode:'MMTFLY', platform:'makemytrip', validUntil:endOfMonth },
  { source:'manual', category:'ota_coupon', name:'10% off up to ₹1,000 on Cleartrip', type:'percentage', value:0.10, maxCap:1000, minBooking:3500, promoCode:'CTFLY', platform:'cleartrip', validUntil:endOfMonth },
  { source:'manual', category:'ota_coupon', name:'Flat ₹500 off on Ixigo flights', type:'flat', value:500, minBooking:3000, promoCode:'IXFLY', platform:'ixigo', validUntil:endOfMonth },
  { source:'manual', category:'ota_coupon', name:'Flat ₹400 off on Yatra domestic flights', type:'flat', value:400, minBooking:3000, promoCode:'YFLY', platform:'yatra', validUntil:endOfQ2 },
  { source:'manual', category:'ota_coupon', name:'8% off up to ₹800 on Goibibo', type:'percentage', value:0.08, maxCap:800, minBooking:3000, promoCode:'GOFLY', platform:'goibibo', validUntil:endOfMonth },
  { source:'manual', category:'ota_coupon', name:'Flat ₹750 off on EaseMyTrip', type:'flat', value:750, minBooking:5000, promoCode:'EMTFLY', platform:'easemytrip', validUntil:endOfQ2 },
  { source:'manual', category:'ota_coupon', name:'12% off up to ₹1,200 on HappyEasyGo', type:'percentage', value:0.12, maxCap:1200, minBooking:4000, promoCode:'HGFLY', platform:'happyeasygo', validUntil:endOfQ2 },

  // ── CASHBACK PORTALS ──
  { source:'manual', category:'cashback_portal', name:'5% cashback on flights via CashKaro', type:'percentage', value:0.05, maxCap:800, minBooking:0, platform:'cashkaro', url:'https://cashkaro.com/flights', validUntil:endOfYear },
  { source:'manual', category:'cashback_portal', name:'4% cashback on flights via GoPaisa', type:'percentage', value:0.04, maxCap:600, minBooking:0, platform:'gopaisaindia', url:'https://gopaisaindia.com/flights', validUntil:endOfYear },
  { source:'manual', category:'cashback_portal', name:'3% cashback via TopCashback India', type:'percentage', value:0.03, maxCap:500, minBooking:0, platform:'topcashback', url:'https://topcashback.in', validUntil:endOfYear },
  { source:'manual', category:'cashback_portal', name:'Up to 6% cashback via Magicpin', type:'percentage', value:0.06, maxCap:1000, minBooking:0, platform:'magicpin', url:'https://magicpin.in', validUntil:endOfQ2 },

  // ── INTERNATIONAL ──
  { source:'manual', category:'international', airline:'EK', name:'10% off for India residents on Emirates', type:'percentage', value:0.10, maxCap:5000, minBooking:15000, validUntil:endOfQ2, platform:'airline_direct', url:'https://emirates.com/in/offers' },
  { source:'manual', category:'international', airline:'SQ', name:'Early bird 15% off on Singapore Airlines', type:'percentage', value:0.15, maxCap:8000, minBooking:20000, validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'international', airline:'QR', name:'12% off Qatar Airways from India', type:'percentage', value:0.12, maxCap:6000, minBooking:15000, validUntil:endOfMonth, platform:'airline_direct' },
  { source:'manual', category:'international', airline:'EY', name:'Companion fare 50% off on Etihad', type:'percentage', value:0.50, maxCap:15000, minBooking:20000, validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'international', airline:'TG', name:'Flat ₹3,000 off on Thai Airways', type:'flat', value:3000, minBooking:15000, promoCode:'THAIFLY', validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'international', airline:'LH', name:'10% off Lufthansa India fares', type:'percentage', value:0.10, maxCap:5000, minBooking:20000, validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'international', airline:'BA', name:'8% off British Airways from India', type:'percentage', value:0.08, maxCap:4000, minBooking:15000, validUntil:endOfQ2, platform:'airline_direct' },
  { source:'manual', category:'international', name:'15% off on Skyscanner via partner link', type:'percentage', value:0.15, maxCap:3000, minBooking:5000, validUntil:endOfYear, platform:'makemytrip', url:'https://skyscanner.co.in' },

  // ── SEASONAL ──
  { source:'manual', category:'seasonal', name:'Summer Sale — Flat ₹999 off on all domestic', type:'flat', value:999, minBooking:4000, promoCode:'SUMMER26', validUntil:endOfQ2, priority:15 },
  { source:'manual', category:'seasonal', name:'Weekend Flash Sale — 20% off (Sat bookings)', type:'percentage', value:0.20, maxCap:2000, minBooking:3000, validUntil:endOfMonth, priority:12 },
];

async function main() {
  // Deactivate all existing seeded offers
  await prisma.flightOffer.updateMany({ where: { source: 'manual' }, data: { active: false } });

  let created = 0;
  for (const o of offers) {
    await prisma.flightOffer.create({
      data: {
        source: o.source,
        category: o.category,
        bankCode: o.bankCode || null,
        name: o.name,
        type: o.type,
        value: o.value,
        maxCap: o.maxCap || null,
        minBooking: o.minBooking || 0,
        promoCode: o.promoCode || null,
        platform: o.platform || null,
        airline: o.airline || null,
        url: o.url || null,
        validFrom: new Date(),
        validUntil: o.validUntil,
        active: true,
        priority: o.priority || 0,
        updatedAt: new Date(),
      }
    });
    created++;
  }
  console.log(`Seeded ${created} offers`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
