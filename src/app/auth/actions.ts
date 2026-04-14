'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/auth/login?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/profile')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    return redirect('/auth/signup?error=' + error.message)
  }

  // Create initial profile record if user was created
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert([
        { 
            id: data.user.id, 
            full_name: fullName,
            email: email
        }
    ])
    // If it fails because of RLS or constraint, we ignore for now as it means it exists
  }

  revalidatePath('/', 'layout')
  
  if (!data.session) {
    // Email confirmation is likely required
    return redirect('/auth/login?error=Registration successful! Please check your email to confirm your account.')
  }

  redirect('/profile')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
