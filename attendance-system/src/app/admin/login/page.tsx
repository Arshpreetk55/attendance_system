'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Loading from '@/components/ui/Loading'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineArrowLeft,
} from 'react-icons/hi'

export default function AdminLoginPage() {
  const { signIn, appUser, loading } = useAuth()
  const router = useRouter()

  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    if (!loading && appUser?.role === 'admin') {
      router.push('/admin/dashboard')
    }
  }, [appUser, loading, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await signIn(form.email, form.password)

      if (user.role !== 'admin') {
        toast.error('Access denied. Admins only.')
        return
      }

      toast.success(`Welcome, ${user.displayName}!`)
      router.push('/admin/dashboard')
    } catch (err: any) {
      const msg =
        err?.code === 'auth/user-not-found'
          ? 'No account found.'
          : err?.code === 'auth/wrong-password'
          ? 'Incorrect password.'
          : err?.code === 'auth/invalid-credential'
          ? 'Invalid credentials.'
          : 'Something went wrong.'

      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 z-20 w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
        >
          <HiOutlineArrowLeft size={20} />
        </button>

        <div className="relative z-10 text-white max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 text-4xl">
            🛡️
          </div>

          <h2 className="text-4xl font-bold mb-4">Admin Portal</h2>

          <p className="text-blue-100 text-base leading-relaxed">
            Manage teachers, monitor the system and control all access from one
            place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              '✓  Add & remove teachers',
              '✓  Set temporary passwords',
              '✓  View all teacher accounts',
              '✓  Full system control',
            ].map((f) => (
              <p key={f} className="text-sm text-blue-100">
                {f}
              </p>
            ))}
          </div>
        </div>

        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
      </div>

      {/* Right form */}
      <div className="flex-1 relative flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile Back Button */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full border flex items-center justify-center"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              <HiOutlineArrowLeft size={18} />
            </button>
            <div />
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold bg-blue-600">
              A
            </div>
            <span
              className="font-display font-bold text-xl"
              style={{ color: 'var(--color-text)' }}
            >
              AttendX
            </span>
          </div>

          <h1
            className="font-display text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text)' }}
          >
            Admin Sign In
          </h1>

          <p
            className="text-sm mb-8"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Restricted access — admins only.
          </p>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>

              <div className="relative">
                <HiOutlineMail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />

                <input
                  className="input pl-10"
                  type="email"
                  placeholder="admin@school.edu"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>

              <div className="relative">
                <HiOutlineLockClosed
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />

                <input
                  className="input pl-10 pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      password: e.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPwd ? (
                    <HiOutlineEyeOff size={16} />
                  ) : (
                    <HiOutlineEye size={16} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary py-3 mt-1"
              disabled={submitting}
              style={{ background: '#2563eb' }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Teacher?{' '}
            <Link
              href="/teacher/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Teacher Portal →
            </Link>
          </p>

          <p
            className="text-center text-sm mt-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Student?{' '}
            <Link
              href="/student/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Student Portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
