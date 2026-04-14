'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/auth/login')
  }

  const updates = {
    id: user.id,
    full_name: (formData.get('full_name') as string)?.trim(),
    date_of_birth: formData.get('date_of_birth') as string || null,
    passport_number: (formData.get('passport_number') as string)?.trim() || null,
    passport_expiry: formData.get('passport_expiry') as string || null,
    nationality: (formData.get('nationality') as string)?.trim() || null,
    frequent_flyer_number: (formData.get('frequent_flyer_number') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('profiles').upsert(updates)

  if (error) {
    console.error('Update profile error:', error.message)
    return redirect('/profile?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/profile')
  redirect('/profile?message=Profile updated successfully')
}
