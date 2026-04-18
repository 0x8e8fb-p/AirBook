export interface BankCard {
  id: string;
  name: string;
}

export const AVAILABLE_BANK_CARDS: BankCard[] = [
  { id: "HDFC", name: "HDFC Bank" },
  { id: "SBI", name: "SBI Card" },
  { id: "ICICI", name: "ICICI Bank" },
  { id: "AXIS", name: "Axis Bank" },
  { id: "KOTAK", name: "Kotak Mahindra Bank" },
  { id: "YES", name: "Yes Bank" },
  { id: "RBL", name: "RBL Bank" },
  { id: "SC", name: "Standard Chartered" },
  { id: "AMEX", name: "American Express" },
  { id: "INDUS", name: "IndusInd Bank" },
  { id: "IDFC", name: "IDFC First Bank" },
  { id: "AU", name: "AU Small Finance Bank" },
  { id: "HSBC", name: "HSBC Bank" },
  { id: "BOB", name: "Bank of Baroda" },
  { id: "FEDERAL", name: "Federal Bank" },
  { id: "CRED", name: "CRED Pay" },
  { id: "PAYTM", name: "Paytm Wallet" },
  { id: "PHONEPE", name: "PhonePe" },
  { id: "MOBIKWIK", name: "MobiKwik" },
];

export const AVAILABLE_BANK_CARD_IDS = new Set(AVAILABLE_BANK_CARDS.map((b) => b.id));
