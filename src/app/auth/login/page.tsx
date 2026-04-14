'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plane, ArrowRight, AlertCircle } from 'lucide-react'
import { login } from '../actions'

import { use } from 'react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = use(searchParams)
  return (
    <div className="min-h-screen flex flex-col pt-14 bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <Plane className="w-5 h-5 group-hover:text-[var(--text-secondary)] transition-colors" />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Enter your credentials to access your account
            </p>
          </div>

          <form action={login} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="ghost-input w-full pb-2 text-[15px] bg-transparent placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                <label htmlFor="email" className="sr-only">Email address</label>
              </div>

              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  className="ghost-input w-full pb-2 text-[15px] bg-transparent placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-muted)] group-focus-within:bg-[var(--text-primary)] transition-colors" />
                <label htmlFor="password" className="sr-only">Password</label>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[var(--text-primary)] hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
