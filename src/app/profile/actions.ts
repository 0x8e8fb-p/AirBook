'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const updates = {
    id: user.id,
    full_name: formData.get('full_name') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    passport_number: formData.get('passport_number') as string,
    passport_expiry: formData.get('passport_expiry') as string,
    nationality: formData.get('nationality') as string,
    frequent_flyer_number: formData.get('frequent_flyer_number') as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('profiles').upsert(updates)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/profile')
}
