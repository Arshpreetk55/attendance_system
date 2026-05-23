'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Loading from '@/components/ui/Loading'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
} from 'react-icons/hi'

type AuthMode = 'signin' | 'signup'

export default function TeacherLoginPage() {
  const { signIn, appUser, loading } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (!loading && appUser?.role === 'teacher') {
      router.push('/teacher/dashboard')
    }
  }, [appUser, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const user = await signIn(form.email, form.password)
        if (user.role !== 'teacher' && user.role !== 'admin') {
          toast.error('This portal is for teachers only.')
          return
        }
        toast.success(`Welcome back, ${user.displayName}!`)
        router.push('/teacher/dashboard')
      } else {
        const user = await signIn(form.email, form.password)
        if (user.role !== 'teacher') {
          toast.error('No teacher account found for this email. Contact your admin.')
          return
        }
        toast.success(`Account verified! Let's set up your timetable.`)
        const { updateUser } = await import('@/lib/db')
        await updateUser(user.uid, { showProfileSetup: true } as any)
        router.push('/teacher/setup')
      }
    } catch (err: any) {
      const msg = err?.code === 'auth/user-not-found' ? 'No account found. Ask your admin to create one.'
        : err?.code === 'auth/wrong-password' ? 'Incorrect password.'
        : err?.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)' }}>
        <div className="relative z-10 text-white max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8 text-4xl">🎓</div>
          <h2 className="font-display text-4xl font-bold mb-4">Teacher Portal</h2>
          <p className="text-blue-100 text-base leading-relaxed">
            Manage attendance, timetables, students and generate comprehensive reports all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {['✓  Auto-generated timetables', '✓  One-click attendance marking',
              '✓  CSV / Excel / PDF exports', '✓  Low attendance alerts', '✓  Calendar view',
            ].map(f => <p key={f} className="text-sm text-blue-100">{f}</p>)}
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6">
         <button
  type="button"
  onClick={() => router.push('/')}
  className="absolute top-6 left-6 px-4 py-2 rounded-lg text-sm border hover:bg-gray-100 transition"
  style={{
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
  }}
>
  ←
</button>
        <div className="w-full max-w-md animate-slide-up">

  {/* Mobile Logo */}
  <div className="lg:hidden flex items-center gap-2 mb-8">
    <div
  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold"
      style={{ background: 'var(--color-primary)' }}
    >
      A
    </div>

    <span
      className="font-display font-bold text-xl"
      style={{ color: 'var(--color-text)' }}
    >
      AttendX
    </span>
  </div>

  {/* NEW HEADING */}
  <h1
    className="font-display text-2xl font-bold mb-2"
    style={{ color: 'var(--color-text)' }}
  >
    {mode === 'signin' ? 'Teacher Sign In' : 'Teacher Sign Up'}
  </h1>

  <p
    className="text-sm mb-6"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {mode === 'signin'
      ? 'Access your teacher dashboard and manage attendance.'
      : 'Verify your teacher account and set up your timetable.'}
  </p>

  {/* Toggle Buttons */}
  <div
    className="flex p-1 rounded-xl mb-6"
    style={{ background: 'var(--color-surface-2)' }}
  >
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize"
                style={{
                  background: mode === m ? 'var(--color-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--color-text-muted)',
                }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
              ℹ️ Use the <strong>email and password</strong> provided by your admin to register.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <HiOutlineMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input className="input pl-10" type="email"
                  placeholder={mode === 'signup' ? 'Email given by admin' : 'teacher@school.edu'}
                  required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input className="input pl-10 pr-10" type={showPwd ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Temporary password from admin' : '••••••••'}
                  required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPwd ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary py-3 mt-1" disabled={submitting}>
              {submitting
                ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Verifying...'}
                </span>
                : mode === 'signin' ? 'Sign In to Dashboard' : 'Verify & Set Up Timetable'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
            Student?{' '}
            <Link href="/student/login" className="font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}>Student Portal →</Link>
          </p>
          <p className="text-center text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Admin?{' '}
            <Link href="/admin/login" className="font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}>Admin Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
