'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Loading from '@/components/ui/Loading'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { HiOutlineAcademicCap } from 'react-icons/hi'

interface TradeOption {
  name: string
}

export default function StudentLoginPage() {
  const { signIn, appUser, loading } = useAuth()
  const router = useRouter()

  const [trades, setTrades] = useState<TradeOption[]>([])
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([])
  const [availableSections, setAvailableSections] = useState<string[]>([])

  const [loadingTrades, setLoadingTrades] = useState(true)
  const [loadingSemesters, setLoadingSemesters] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)

  const [form, setForm] = useState({
    trade: '',
    semester: '',
    section: '',
    rollNumber: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in as student
  useEffect(() => {
    if (!loading && appUser?.role === 'student') router.push('/student/dashboard')
  }, [appUser, loading, router])

  // Step 1: Load trades directly from Firestore on mount
  useEffect(() => {
    async function fetchTrades() {
      setLoadingTrades(true)
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'student'))
        )
        const tradeSet = new Set<string>()
        snap.docs.forEach(doc => {
          const t = doc.data().trade
          if (t) tradeSet.add(t)
        })
        const tradeArray = Array.from(tradeSet).sort()
        setTrades(tradeArray.map(name => ({ name })))
        if (tradeArray.length === 0) {
          toast.error('No student records found in database')
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load branches from database')
        setTrades([])
      } finally {
        setLoadingTrades(false)
      }
    }
    fetchTrades()
  }, [])

  // Step 2: Trade selected → fetch semesters for that trade from database
  async function handleTradeChange(tradeName: string) {
    setForm({ trade: tradeName, semester: '', section: '', rollNumber: '' })
    setAvailableSemesters([])
    setAvailableSections([])
    if (!tradeName) return

    setLoadingSemesters(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('trade', '==', tradeName)
        )
      )
      const semSet = new Set<number>()
      snap.docs.forEach(doc => {
        const s = doc.data().semester
        if (typeof s === 'number') semSet.add(s)
      })
      const semArray = Array.from(semSet).sort((a, b) => a - b)
      setAvailableSemesters(semArray)
      if (semArray.length === 0) {
        toast.error('No semesters found for this branch')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load semesters')
      setAvailableSemesters([])
    } finally {
      setLoadingSemesters(false)
    }
  }

  // Step 3: Semester selected → fetch sections for that trade + semester
  async function handleSemesterChange(semester: string) {
    setForm(p => ({ ...p, semester, section: '', rollNumber: '' }))
    setAvailableSections([])
    if (!semester || !form.trade) return

    setLoadingSections(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('trade', '==', form.trade),
          where('semester', '==', parseInt(semester))
        )
      )
      const secSet = new Set<string>()
      snap.docs.forEach(doc => {
        const s = doc.data().section
        if (s) secSet.add(s)
      })
      setAvailableSections(Array.from(secSet).sort())
    } catch (err) {
      toast.error('Failed to load sections')
    } finally {
      setLoadingSections(false)
    }
  }

  // ✅ FIX: Build email using the same formula as seed-students.mjs
  //    tradeSlug = trade with all spaces removed, lowercased
  //    email = rollNumber@tradeSlug-sSemester-section.attendx.edu
  //    password = rollNumber#2026
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.trade || !form.semester || !form.section || !form.rollNumber.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmitting(true)
    try {
      const rollNumber  = form.rollNumber.trim()
      const tradeSlug   = form.trade.replace(/\s+/g, '').toLowerCase()
      const sectionSlug = form.section.toLowerCase()
      const sem         = form.semester

      const email    = `${rollNumber}@${tradeSlug}-s${sem}-${sectionSlug}.attendx.edu`
      const password = `${rollNumber}#2026`

      const user = await signIn(email, password)

      if (!user || user.role !== 'student') {
        toast.error('No student account found.')
        return
      }
      toast.success('Welcome back!')
      router.push('/student/dashboard')
    } catch {
      toast.error('Invalid details. Please check your roll number and selections.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>

      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-primary) 100%)' }}
      >
        <div className="relative z-10 text-white max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
            <HiOutlineAcademicCap size={28} className="text-white" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
            Student Portal
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Track your attendance, view subject-wise progress, and stay on top of your academic performance.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Real-time Tracking', icon: '📊' },
              { label: 'Subject Analytics', icon: '📚' },
              { label: 'Alerts & Warnings', icon: '🔔' },
              { label: 'Weekly Reports', icon: '📅' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                <span>{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold"
              style={{ background: 'var(--color-primary)' }}
            >A</div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--color-text)' }}>AttendX</span>
          </div>

          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Student Sign In
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Select your class details to access your attendance
          </p>

          {loadingTrades ? (
            <Loading text="Loading available classes..." />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Trade */}
              <div>
                <label className="label">Trade / Branch</label>
                <select
                  className="input"
                  value={form.trade}
                  onChange={e => handleTradeChange(e.target.value)}
                  required
                >
                  <option value="">Select Trade / Branch</option>
                  {trades.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                {trades.length === 0 && !loadingTrades && (
                  <p className="text-xs mt-1 text-yellow-600">
                    No students found in database yet.
                  </p>
                )}
              </div>

              {/* Semester */}
              <div>
                <label className="label">Semester</label>
                <select
                  className="input"
                  value={form.semester}
                  onChange={e => handleSemesterChange(e.target.value)}
                  disabled={!form.trade || loadingSemesters}
                  required
                >
                  <option value="">
                    {loadingSemesters
                      ? 'Loading...'
                      : !form.trade
                      ? 'Select trade first'
                      : availableSemesters.length === 0
                      ? 'No semesters found'
                      : 'Select Semester'}
                  </option>
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="label">Section</label>
                <select
                  className="input"
                  value={form.section}
                  onChange={e => setForm(p => ({ ...p, section: e.target.value, rollNumber: '' }))}
                  disabled={!form.semester || loadingSections}
                  required
                >
                  <option value="">
                    {loadingSections
                      ? 'Loading...'
                      : !form.semester
                      ? 'Select semester first'
                      : availableSections.length === 0
                      ? 'No sections found'
                      : 'Select Section'}
                  </option>
                  {availableSections.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              {/* Roll Number */}
              <div>
                <label className="label">Roll Number</label>
                <input
                  className="input"
                  placeholder={form.section ? 'Enter your roll number' : 'Select section first'}
                  value={form.rollNumber}
                  onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))}
                  disabled={!form.section}
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Enter your roll number to access your student account
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary py-3 mt-2"
                disabled={submitting || !form.trade || !form.semester || !form.section || !form.rollNumber.trim()}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </span>
                ) : 'Access My Attendance'}
              </button>
            </form>
          )}

          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
            Are you a teacher?{' '}
            <Link href="/teacher/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
              Teacher Portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
