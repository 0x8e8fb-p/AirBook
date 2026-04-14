'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return redirect('/auth/login?error=Supabase environment variables are missing.')
  }

  if (!email || !password) {
    return redirect('/auth/login?error=Email and password are required.')
  }

  const supabase = await createClient()
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
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()
  const fullName = (formData.get('full_name') as string)?.trim()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return redirect('/auth/signup?error=Supabase environment variables are missing.')
  }

  if (!email || !password) {
    return redirect('/auth/signup?error=Email and password are required.')
  }

  const supabase = await createClient()
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
    const { error: profileError } = await supabase.from('profiles').upsert([
        { 
            id: data.user.id, 
            full_name: fullName,
            email: email,
            updated_at: new Date().toISOString()
        }
    ], { onConflict: 'id' })
    
    if (profileError) {
      console.error('Profile creation error:', profileError.message)
    }
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
