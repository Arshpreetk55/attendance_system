'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  getStudentAttendance,
  getAttendanceSummaryForStudent,
  getStudentsBySection,
} from '@/lib/db'
import type { AttendanceRecord, AttendanceSummary, StudentUser } from '@/types'
import Loading from '@/components/ui/Loading'
import StatCard from '@/components/ui/StatCard'
import CircularChart from '@/components/charts/CircularChart'
import WeeklyChart from '@/components/charts/WeeklyChart'
import SubjectChart from '@/components/charts/SubjectChart'
import AttendanceHistoryTable from '@/components/student/AttendanceHistoryTable'
import LowAttendanceWarning from '@/components/student/LowAttendanceWarning'
import Navbar from '@/components/shared/Navbar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { getWeekDays } from '@/lib/utils'
import { format } from 'date-fns'
import {
  HiOutlineClipboardCheck, HiOutlineX, HiOutlineCheckCircle,
  HiOutlineChartBar, HiOutlineTrendingUp,
} from 'react-icons/hi'


export default function StudentDashboard() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const student = appUser as StudentUser | null

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])
  const [topStudents, setTopStudents] = useState<{ name: string; roll: string; pct: number }[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !appUser) router.push('/student/login')
    if (!loading && appUser?.role !== 'student') router.push('/')
  }, [loading, appUser, router])

  useEffect(() => {
    if (!student) return
    const fetch = async () => {
      const [recs, sums] = await Promise.all([
        getStudentAttendance(student.uid, student.trade, student.semester, student.section),
        getAttendanceSummaryForStudent(student.uid, student.trade, student.semester, student.section),
      ])
      setRecords(recs)
      setSummaries(sums)

      // Build top students list from section
      const classmates = await getStudentsBySection(student.trade, student.semester, student.section)
      const top = await Promise.all(
        classmates.slice(0, 5).map(async cm => {
          const cmSums = await getAttendanceSummaryForStudent(cm.uid, cm.trade, cm.semester, cm.section)
          const total = cmSums.reduce((a, s) => a + s.totalClasses, 0)
          const present = cmSums.reduce((a, s) => a + s.present, 0)
          const pct = total > 0 ? Math.round((present / total) * 100) : 0
          return { name: cm.displayName, roll: cm.rollNumber, pct }
        })
      )
      setTopStudents(top.sort((a, b) => b.pct - a.pct))
      setDataLoading(false)
    }
    fetch()
  }, [student])

  if (loading || !student) return <Loading fullScreen />

  // ── Helper: get a friendly first name ──────────────────────────────────────
  // If displayName is just a number (roll number), show "Student" instead
  const getFriendlyName = () => {
    const name = student.displayName
    if (!name) return `Roll ${student.rollNumber}`
    // Check if displayName is purely numeric (means it was set to roll number)
    if (/^\d+$/.test(name.trim())) return `Roll ${student.rollNumber}`
    // Otherwise use first word of actual name
    return name.split(' ')[0]
  }

  // Compute stats
  const totalClasses = summaries.reduce((a, s) => a + s.totalClasses, 0)
  const totalPresent = summaries.reduce((a, s) => a + s.present, 0)
  const totalAbsent = summaries.reduce((a, s) => a + s.absent, 0)
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0
  const isLowAttendance = overallPct < 75 && totalClasses > 0

  // Weekly data
  const weekDays = getWeekDays()
  const weeklyData = weekDays.slice(0, 6).map(d => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const dayRecs = records.filter(r => r.date === dateStr)
    const present = dayRecs.filter(r => r.students.find(s => s.studentId === student.uid)?.status === 'present').length
    return {
      day: format(d, 'EEE'),
      present,
      total: dayRecs.length,
      percentage: dayRecs.length > 0 ? Math.round((present / dayRecs.length) * 100) : 0,
    }
  })

  const navLinks = [
    { href: '/student/dashboard', label: 'Dashboard' },
    { href: '/student/attendance', label: 'Attendance' },
    { href: '/student/timetable', label: 'Timetable' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar portalName="Student" links={navLinks} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">
              Welcome back, {getFriendlyName()}! 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {student.trade} · Semester {student.semester} · Section {student.section} · Roll: {student.rollNumber}
            </p>
          </div>
          <ThemeToggle showColorTheme />
        </div>

        {/* ── Low attendance warning ─────────────────────────────────── */}
        {isLowAttendance && (
          <LowAttendanceWarning
            percentage={overallPct}
            subjectBreakdown={summaries.map(s => ({ subject: s.subjectName, percentage: s.percentage }))}
          />
        )}

        {dataLoading ? (
          <Loading text="Loading attendance data..." className="py-20" />
        ) : (
          <>
            {/* ── Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Present" value={totalPresent} icon={<HiOutlineCheckCircle />} color="green" />
              <StatCard title="Total Absent" value={totalAbsent} icon={<HiOutlineX />} color="red" />
              <StatCard title="Total Classes" value={totalClasses} icon={<HiOutlineClipboardCheck />} color="blue" />
              <StatCard
                title="Attendance %"
                value={`${overallPct}%`}
                icon={<HiOutlineTrendingUp />}
                color={overallPct >= 85 ? 'green' : overallPct >= 75 ? 'yellow' : 'red'}
              />
            </div>

            {/* ── Middle row: circular chart + weekly chart ───────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6 flex flex-col items-center justify-center gap-4">
                <h2 className="section-title self-start">Overall Attendance</h2>
                <CircularChart percentage={overallPct} size={180} />
                <div className="w-full grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <p className="text-xl font-display font-bold text-green-600">{totalPresent}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Present</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <p className="text-xl font-display font-bold text-red-500">{totalAbsent}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Absent</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 lg:col-span-2">
                <h2 className="section-title mb-4">This Week&apos;s Attendance</h2>
                <WeeklyChart data={weeklyData} height={220} />
              </div>
            </div>

            {/* ── Subject-wise attendance ─────────────────────────────── */}
            {summaries.length > 0 && (
              <div className="card p-6">
                <h2 className="section-title mb-4 flex items-center gap-2">
                  <HiOutlineChartBar size={20} /> Subject-wise Attendance
                </h2>
                <SubjectChart summaries={summaries} />
              </div>
            )}

            {/* ── No attendance yet message ───────────────────────────── */}
            {summaries.length === 0 && !dataLoading && (
              <div className="card p-10 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="font-semibold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                  No attendance marked yet
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Your teacher hasn&apos;t marked any attendance for your section ({student.section}) yet.
                  Check back after your classes.
                </p>
              </div>
            )}

            {/* ── Bottom row: history + top students ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="section-title mb-3">Attendance History</h2>
                <AttendanceHistoryTable records={records} studentId={student.uid} />
              </div>

              <div className="card p-5">
                <h2 className="section-title mb-4">🏆 Top Students</h2>
                <div className="flex flex-col gap-3">
                  {topStudents.map((s, i) => (
                    <div key={s.roll} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-blue-400'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{s.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.roll}</p>
                      </div>
                      <span className={`text-sm font-bold ${s.pct >= 85 ? 'text-green-600' : s.pct >= 75 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {s.pct}%
                      </span>
                    </div>
                  ))}
                  {topStudents.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
