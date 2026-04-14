'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getAlerts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch alerts error:', error.message)
    return []
  }

  return data
}

export async function createAlert(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/auth/login')
  }

  const origin = formData.get('origin') as string
  const destination = formData.get('destination') as string
  const targetPrice = formData.get('targetPrice') as string

  const { error } = await supabase.from('price_alerts').insert({
    user_id: user.id,
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    target_price: parseFloat(targetPrice),
    is_active: true
  })

  if (error) {
    console.error('Create alert error:', error.message)
  }

  revalidatePath('/alerts')
}

export async function deleteAlert(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete alert error:', error.message)
  }

  revalidatePath('/alerts')
}

export async function toggleAlert(id: string, currentActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('price_alerts')
    .update({ is_active: !currentActive })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Toggle alert error:', error.message)
  }

  revalidatePath('/alerts')
}
