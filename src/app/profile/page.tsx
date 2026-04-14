import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from './actions'
import { User, Plane, MapPin, Search } from 'lucide-react'
import { signout } from '../auth/actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch the extended profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="container-app max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Travel Profile</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage details for faster bookings.</p>
          </div>
          <form action={signout}>
            <button className="text-sm font-medium px-4 py-2 text-[var(--text-secondary)] hover:text-red-500 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] transition-colors">
              Sign Out
            </button>
          </form>
        </header>

        <form action={updateProfile} className="space-y-8">
          {/* PERSONAL INFO */}
          <section className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-muted)] bg-[var(--bg-subtle)] space-y-6">
            <h2 className="text-lg font-semibold tracking-tight border-b border-[var(--border-muted)] pb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--text-muted)]" /> Personal Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5 group">
                <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input name="full_name" defaultValue={profile?.full_name || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none" />
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5 group">
                <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Date of Birth</label>
                <div className="relative">
                  <input name="date_of_birth" type="date" defaultValue={profile?.date_of_birth || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none" />
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                </div>
              </div>
            </div>
          </section>

          {/* TRAVEL DOCUMENTS */}
          <section className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-muted)] bg-[var(--bg-subtle)] space-y-6">
            <h2 className="text-lg font-semibold tracking-tight border-b border-[var(--border-muted)] pb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--text-muted)]" /> Travel Documents
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5 group">
                <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Passport Number</label>
                <div className="relative">
                  <input name="passport_number" defaultValue={profile?.passport_number || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none placeholder:text-[var(--text-muted)]" placeholder="Optional" />
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5 group">
                <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Expiry Date</label>
                <div className="relative">
                  <input name="passport_expiry" type="date" defaultValue={profile?.passport_expiry || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none placeholder:text-[var(--text-muted)]" />
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5 group">
                <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Nationality</label>
                <div className="relative">
                  <input name="nationality" defaultValue={profile?.nationality || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none placeholder:text-[var(--text-muted)]" placeholder="e.g. Indian" />
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                </div>
              </div>
            </div>
          </section>

          {/* LOYALTY */}
          <section className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-muted)] bg-[var(--bg-subtle)] space-y-6">
            <h2 className="text-lg font-semibold tracking-tight border-b border-[var(--border-muted)] pb-4 flex items-center gap-2">
              <Plane className="w-4 h-4 text-[var(--text-muted)]" /> Loyalty Programs
            </h2>
            <div className="space-y-1.5 group max-w-sm">
              <label className="text-xs font-medium text-[var(--text-secondary)] px-1 uppercase tracking-wider">Frequent Flyer Number</label>
              <div className="relative">
                <input name="frequent_flyer_number" defaultValue={profile?.frequent_flyer_number || ''} className="ghost-input w-full pb-2 text-[15px] bg-transparent focus:outline-none placeholder:text-[var(--text-muted)]" placeholder="Optional" />
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
             <button
                type="submit"
                className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save Preferences
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
