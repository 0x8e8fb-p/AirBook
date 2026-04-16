"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { User as UserIcon, Wallet, Bell, LogOut, Loader2, CheckCircle2, Trash2, KeyRound, Camera, Edit2, Save } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { useUserStore } from "@/stores/user-store";
import { syncWallet } from "@/app/actions/userActions";
import { getAlerts, deleteAlert, createAlert } from "@/app/actions/alertActions";
import { formatPrice } from "@/lib/constants";
import { sendPasswordResetEmail, deleteAccount, updateProfileImage, updateProfile } from "@/app/actions/authActions";

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

function ProfileContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as "account" | "wallet" | "alerts" | null;
  const [activeTab, setActiveTab] = useState<"account" | "wallet" | "alerts">(tabParam || "account");
  
  const { ownedCards, toggleCard } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [newAlertOrigin, setNewAlertOrigin] = useState("");
  const [newAlertDest, setNewAlertDest] = useState("");
  const [newAlertPrice, setNewAlertPrice] = useState("");

  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    mobile: "",
    dob: ""
  });
  
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        username: (user as any).username || "",
        mobile: (user as any).mobile || "",
        dob: (user as any).dob ? new Date((user as any).dob).toISOString().split('T')[0] : ""
      });
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingProfile(true);
    setProfileError("");

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("username", editForm.username);
    formData.append("mobile", editForm.mobile);
    formData.append("dob", editForm.dob);

    const res = await updateProfile(user.id, formData);
    if (res.success) {
      setIsEditingProfile(false);
      window.location.reload(); // Refresh to update session
    } else {
      setProfileError(res.error || "Failed to update profile");
    }
    setIsSavingProfile(false);
  };

  const handlePasswordReset = async () => {
    if (!session?.user?.email) return;
    setResetLoading(true);
    setResetError("");
    setResetSent(false);

    try {
      const res = await sendPasswordResetEmail(session.user.email);
      if (res.success) {
        setResetSent(true);
      } else {
        setResetError(res.error || "Failed to send reset link.");
      }
    } catch (e) {
      setResetError("An error occurred.");
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (tabParam && ["account", "wallet", "alerts"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "alerts") {
      setLoadingAlerts(true);
      getAlerts().then(res => {
        if (res.success) setAlerts(res.alerts || []);
        setLoadingAlerts(false);
      });
    }
  }, [status, activeTab]);

  const handleDeleteAlert = async (id: string) => {
    await deleteAlert(id);
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertOrigin || !newAlertDest || !newAlertPrice) return;
    
    setIsCreatingAlert(true);
    const res = await createAlert(newAlertOrigin.toUpperCase(), newAlertDest.toUpperCase(), parseInt(newAlertPrice));
    
    if (res.success) {
      setNewAlertOrigin("");
      setNewAlertDest("");
      setNewAlertPrice("");
      const alertsRes = await getAlerts();
      if (alertsRes.success) setAlerts(alertsRes.alerts || []);
    } else {
      alert(res.error || "Failed to create alert");
    }
    setIsCreatingAlert(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cta)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
          You need to be signed in to manage your profile, credit cards, and price drop alerts.
        </p>
      </div>
    );
  }

  const handleTabChange = (tab: "account" | "wallet" | "alerts") => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  const handleSaveWallet = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    await syncWallet(ownedCards);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = (user as any)?.id;
    if (!file || !userId) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Use an invisible canvas to compress the image
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 150;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          const res = await updateProfileImage(userId, compressedBase64);
          
          if (res.success) {
            // Update session locally to reflect immediately
            window.location.reload();
          }
          setIsUploading(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const userId = (user as any)?.id;
    const userUsername = (user as any)?.username;
    
    if (!userId) return;
    
    const input = prompt(`To confirm deletion, please type your username (${userUsername || user.email}):`);
    if (input && (input.toLowerCase() === userUsername?.toLowerCase() || input.toLowerCase() === user.email?.toLowerCase())) {
      setIsDeleting(true);
      const res = await deleteAccount(userId);
      if (res.success) {
        await signOut({ callbackUrl: "/" });
      } else {
        alert(res.error || "Failed to delete account");
        setIsDeleting(false);
      }
    } else if (input !== null) {
      alert("Username did not match. Account deletion cancelled.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-subtle)] pb-20 flex flex-col">
      <header className="bg-transparent border-b border-[var(--border-default)]">
        <div className="container-app py-8 lg:py-12">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-transparent shadow-sm overflow-hidden bg-[var(--accent-primary-dim)] flex items-center justify-center relative z-10">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
                ) : user?.image ? (
                  <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-muted)]" />
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 z-20 bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-full p-1.5 shadow-sm hover:bg-[var(--accent-primary-dim)] transition-colors"
                title="Update Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
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
            <div className="sticky top-20 flex flex-col gap-1">
              <button
                onClick={() => handleTabChange("account")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "account" ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] border border-transparent"
                }`}
              >
                <UserIcon className="w-4 h-4" /> Account Details
              </button>
              <button
                onClick={() => handleTabChange("wallet")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "wallet" ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] border border-transparent"
                }`}
              >
                <Wallet className="w-4 h-4" /> My Wallet
              </button>
              <button
                onClick={() => handleTabChange("alerts")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left ${
                  activeTab === "alerts" ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] border border-transparent"
                }`}
              >
                <Bell className="w-4 h-4" /> Price Alerts
              </button>
              
              <div className="h-px bg-[var(--border-default)] my-2 w-full" />
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 border border-transparent transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            
            {activeTab === "account" && (
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 shadow-sm relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Account Details</h2>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>

                {profileError && (
                  <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm">
                    {profileError}
                  </div>
                )}

                <div className="space-y-6 max-w-md">
                  {isEditingProfile ? (
                    <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Username</label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Mobile Number</label>
                        <input
                          type="tel"
                          value={editForm.mobile}
                          onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent-cta)] transition-colors [color-scheme:dark]"
                        />
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--text-primary)] text-[var(--bg-base)] rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileError("");
                            // Revert form state
                            if (user) {
                              setEditForm({
                                name: user.name || "",
                                username: (user as any).username || "",
                                mobile: (user as any).mobile || "",
                                dob: (user as any).dob ? new Date((user as any).dob).toISOString().split('T')[0] : ""
                              });
                            }
                          }}
                          disabled={isSavingProfile}
                          className="flex-1 px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-medium hover:bg-[var(--accent-primary-dim)] transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Full Name</label>
                        <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium">
                          {user?.name || "Not set"}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Username</label>
                          <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium">
                            {(user as any)?.username || "Not set"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">DOB</label>
                          <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium">
                            {(user as any)?.dob ? new Date((user as any).dob).toLocaleDateString() : "Not set"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Mobile Number</label>
                        <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium">
                          {(user as any)?.mobile || "Not set"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Address</label>
                        <div className="px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium flex items-center justify-between">
                          {user?.email}
                          <span className="text-[10px] bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Verified</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pt-6 border-t border-[var(--border-default)]">
                    <h3 className="text-sm font-semibold mb-4">Security</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-[var(--text-secondary)]" />
                          Password
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Change your account password securely</div>
                      </div>
                      <button 
                        onClick={handlePasswordReset}
                        disabled={resetLoading || resetSent}
                        className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--accent-primary-dim)] transition-colors disabled:opacity-50"
                      >
                        {resetLoading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
                        ) : resetSent ? (
                          <span className="flex items-center gap-2 text-[var(--accent-green)]"><CheckCircle2 className="w-4 h-4" /> Link Sent to Email</span>
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </div>
                    {resetError && <p className="text-xs text-[var(--accent-red)] mt-2">{resetError}</p>}
                    {resetSent && !process.env.NEXT_PUBLIC_RESEND_API_KEY && (
                      <p className="text-xs text-[var(--accent-cta)] mt-2 p-2 bg-[var(--accent-cta)]/10 rounded">
                        <strong>Developer Note:</strong> Check your terminal logs for the password reset link since no Resend API key is configured.
                      </p>
                    )}
                  </div>
                  <div className="pt-6 border-t border-[var(--border-default)]">
                    <h3 className="text-sm font-semibold mb-4 text-[var(--accent-red)]">Danger Zone</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2 text-[var(--accent-red)]">
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Permanently delete your account and all associated data</div>
                      </div>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-[var(--accent-red)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--accent-red)]/90 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</span>
                        ) : (
                          "Delete Account"
                        )}
                      </button>
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
              <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border-default)]">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--accent-cta)]" />
                    Price Drop Alerts
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">We'll email you when the lowest price for these routes drops below your target.</p>
                </div>
                
                <div className="p-6">
                  <div className="mb-8 border-b border-[var(--border-default)] pb-8">
                    <h3 className="text-sm font-semibold mb-4">Create New Alert</h3>
                    <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        placeholder="Origin (e.g. DEL)" 
                        value={newAlertOrigin}
                        onChange={(e) => setNewAlertOrigin(e.target.value)}
                        maxLength={3}
                        required
                        className="flex-1 px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--accent-cta)] uppercase"
                      />
                      <input 
                        type="text" 
                        placeholder="Dest (e.g. BOM)" 
                        value={newAlertDest}
                        onChange={(e) => setNewAlertDest(e.target.value)}
                        maxLength={3}
                        required
                        className="flex-1 px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--accent-cta)] uppercase"
                      />
                      <input 
                        type="number" 
                        placeholder="Target Price (₹)" 
                        value={newAlertPrice}
                        onChange={(e) => setNewAlertPrice(e.target.value)}
                        min={100}
                        required
                        className="flex-1 px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--accent-cta)]"
                      />
                      <button 
                        type="submit"
                        disabled={isCreatingAlert}
                        className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-base)] rounded-[var(--radius-md)] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
                      >
                        {isCreatingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Alert"}
                      </button>
                    </form>
                  </div>

                  {loadingAlerts ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent-cta)]" /></div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-[var(--accent-primary-dim)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-[var(--accent-cta)] opacity-50" />
                      </div>
                      <h3 className="font-semibold mb-2">No active alerts</h3>
                      <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">You can create price alerts from the flight search results page.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {alerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-subtle)]">
                          <div>
                            <div className="font-semibold text-sm mb-1">{alert.origin} → {alert.destination}</div>
                            <div className="text-xs text-[var(--text-muted)]">
                              Target: <span className="font-mono-price font-medium text-[var(--text-primary)]">{formatPrice(alert.targetPrice)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-2 py-1 rounded font-bold uppercase tracking-wider">
                              Active
                            </span>
                            <button 
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors rounded-md hover:bg-[var(--bg-base)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cta)]" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}