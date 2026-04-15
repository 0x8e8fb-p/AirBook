'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logBooking(flightId: string, amount: number = 0) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return { success: false, error: 'User not authenticated' }

  const { error } = await supabase.from('booking_logs').insert({
    user_id: session.user.id,
    flight_id: flightId,
    amount: amount,
    status: 'confirmed'
  })

  if (error) {
    console.error('Log booking error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}
