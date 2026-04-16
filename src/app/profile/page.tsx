"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Wallet, Bell, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { useUserStore } from "@/stores/user-store";
import { syncWallet } from "@/app/actions/userActions";

const BANKS = [
  { id: 'HDFC', name: 'HDFC Bank' },
  { id: 'SBI', name: 'SBI Card' },
  { id: 'ICICI', name: 'ICICI Bank' },
  { id: 'AXIS', name: 'Axis Bank' },
  { id: 'KOTAK', name: 'Kotak Mahindra Bank' },
  { id: 'YES', name: 'Yes Bank' },
  { id: 'RBL', name: 'RBL Bank' },
  { id: 'SC', name: 'Standard Chartered' },
  { id: 'AMEX', name: 'American Express' },
  { id: 'INDUS', name: 'IndusInd Bank' },
  { id: 'IDFC', name: 'IDFC First Bank' },
  { id: 'AU', name: 'AU Small Finance Bank' },
  { id: 'HSBC', name: 'HSBC Bank' },
  { id: 'BOB', name: 'Bank of Baroda' },
  { id: 'FEDERAL', name: 'Federal Bank' },
  { id: 'CRED', name: 'CRED Pay' },
  { id: 'PAYTM', name: 'Paytm Wallet' },
  { id: 'PHONEPE', name: 'PhonePe' },
  { id: 'MOBIKWIK', name: 'MobiKwik' },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"account" | "wallet" | "alerts">("account");
  
  const { ownedCards, toggleCard } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSaveWallet = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    await syncWallet(ownedCards);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cta)]" />
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-subtle)] pb-20 flex flex-col">
      <header className="bg-[var(--bg-base)] border-b border-[var(--border-default)]">
        <div className="container-app py-8 lg:py-12">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[var(--bg-base)] shadow-sm overflow-hidden bg-[var(--accent-primary-dim)] flex items-center justify-center">
              {user?.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-muted)]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.name}</h1>
              <p className="text-[var(--text-secondary)] mt-1">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          
          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-2 shadow-sm flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "account" ? "bg-[var(--accent-primary-dim)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <UserIcon className="w-4 h-4" /> Account Details
              </button>
              <button
                onClick={() => setActiveTab("wallet")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "wallet" ? "bg-[var(--accent-primary-dim)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Wallet className="w-4 h-4" /> My Wallet
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "alerts" ? "bg-[var(--accent-primary-dim)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Bell className="w-4 h-4" /> Price Alerts
              </button>
              
              <div className="h-px bg-[var(--border-default)] my-2" />
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            
            {activeTab === "account" && (
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Account Details</h2>
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Full Name</label>
                    <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium">
                      {user?.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Address</label>
                    <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium flex items-center justify-between">
                      {user?.email}
                      <span className="text-[10px] bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border-default)]">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[var(--accent-cta)]" />
                    My Card Wallet
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">Select the credit/debit cards you own. AirBook will automatically calculate your personalized lowest flight prices across all Indian OTAs.</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {BANKS.map(bank => (
                      <label key={bank.id} className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
                        ownedCards.includes(bank.id) 
                          ? 'bg-[var(--accent-primary-dim)] border-[var(--accent-cta)] shadow-sm' 
                          : 'bg-[var(--bg-base)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                      }`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-[var(--radius-sm)] border-[var(--border-strong)] text-[var(--accent-cta)] focus:ring-[var(--accent-cta)] focus:ring-offset-0 bg-[var(--bg-base)]"
                          checked={ownedCards.includes(bank.id)}
                          onChange={() => toggleCard(bank.id)}
                        />
                        <span className="text-sm font-semibold select-none">{bank.name}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--border-default)]">
                    <button
                      onClick={handleSaveWallet}
                      disabled={isSaving}
                      className="px-6 py-3 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-bold rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center min-w-[140px]"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Wallet"}
                    </button>
                    {savedSuccess && (
                      <span className="text-[var(--accent-green)] text-sm font-medium flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" /> Wallet synced to cloud
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 shadow-sm text-center py-16">
                <div className="w-16 h-16 bg-[var(--accent-primary-dim)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-[var(--accent-cta)]" />
                </div>
                <h2 className="text-xl font-bold mb-2">Price Drop Alerts</h2>
                <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                  Coming soon! You'll be able to set target prices for specific routes and receive WhatsApp/Email notifications when the price drops.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}