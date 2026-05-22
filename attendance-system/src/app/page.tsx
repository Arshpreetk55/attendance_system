'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function HomePage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && appUser) {
      if (appUser.role === 'admin') router.push('/admin/dashboard')
      else if (appUser.role === 'teacher') router.push('/teacher/dashboard')
      else if (appUser.role === 'student') router.push('/student/dashboard')
    }
  }, [appUser, loading, router])

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Hero Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg"
            style={{ background: 'var(--color-primary)' }}>
            A
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--color-text)' }}>
            AttendX
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student/login" className="btn-secondary text-sm">Student Portal</Link>
          <Link href="/teacher/login" className="btn-primary text-sm">Teacher Login</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--color-primary)' }}></span>
            Smart Attendance Management
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: 'var(--color-text)' }}>
            Attendance Made
            <span className="block" style={{ color: 'var(--color-primary)' }}>Effortless & Smart</span>
          </h1>

          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            AttendX streamlines attendance tracking with automated timetables, real-time analytics, and instant alerts for students and teachers.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/student/login" className="btn-primary px-8 py-3 text-base">
              Student Portal →
            </Link>
            <Link href="/teacher/login" className="btn-secondary px-8 py-3 text-base">
              Teacher Portal →
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-12">
            {['Auto Timetable', 'Real-time Charts', 'Low Attendance Alerts', 'Export Reports', 'Dark Mode', 'Role-Based Access'].map(f => (
              <span key={f} className="px-4 py-1.5 rounded-full text-sm border font-medium"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Student Portal', desc: 'View attendance, charts, history and low-attendance warnings.', href: '/student/login', color: '#2563eb' },
            { title: 'Teacher Portal', desc: 'Mark attendance, manage students, view timetable and export reports.', href: '/teacher/login', color: '#0369a1' },
            { title: 'Admin Panel', desc: 'Manage trades, subjects, teachers, and system configuration.', href: '/admin/login', color: '#1e3a8a' },
          ].map(portal => (
            <Link key={portal.title} href={portal.href}
              className="card p-6 hover:shadow-card-hover transition-all duration-300 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: portal.color + '20' }}>
                <div className="w-5 h-5 rounded-lg" style={{ background: portal.color }}></div>
              </div>
              <h3 className="font-display font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors" style={{ color: 'var(--color-text)' }}>
                {portal.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {portal.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
