'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/db'
import type { StudentUser, AttendanceRecord, AttendanceSummary } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import AttendanceHistoryTable from '@/components/student/AttendanceHistoryTable'
import SubjectChart from '@/components/charts/SubjectChart'
import CircularChart from '@/components/charts/CircularChart'

const navLinks = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/timetable', label: 'Timetable' },
]

export default function StudentAttendancePage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const student = appUser as StudentUser | null

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !appUser) router.push('/student/login')
    if (!loading && appUser?.role !== 'student') router.push('/')
  }, [loading, appUser, router])

  useEffect(() => {
  if (!student) return

  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE),
    where('trade', '==', student.trade),
    where('semester', '==', student.semester),
    where('section', '==', student.section),
  )

  const unsubscribe = onSnapshot(q, async (snap) => {
    const recs = snap.docs
      .map(d => ({ ...d.data(), id: d.id, markedAt: d.data().markedAt?.toDate() } as AttendanceRecord))
      .filter(r => r.students.some(s => s.studentId === student.uid))
      .sort((a, b) => b.date.localeCompare(a.date))

    setRecords(recs)

    // Recalculate summaries from fresh records
    const summaryMap = new Map<string, AttendanceSummary>()
    recs.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (!entry) return
      if (!summaryMap.has(record.subjectId)) {
        summaryMap.set(record.subjectId, {
          studentId: student.uid, subjectId: record.subjectId,
          subjectName: record.subjectName, totalClasses: 0,
          present: 0, absent: 0, late: 0, percentage: 0,
        })
      }
      const sum = summaryMap.get(record.subjectId)!
      sum.totalClasses++
      if (entry.status === 'present') sum.present++
      else if (entry.status === 'absent') sum.absent++
      else if (entry.status === 'late') sum.late++
      sum.percentage = Math.round((sum.present / sum.totalClasses) * 100)
    })
    setSummaries(Array.from(summaryMap.values()))
    setDataLoading(false)
  })

  return () => unsubscribe()
}, [student])

  if (loading || !student) return <Loading fullScreen />

  const totalClasses = summaries.reduce((a, s) => a + s.totalClasses, 0)
  const totalPresent = summaries.reduce((a, s) => a + s.present, 0)
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar portalName="Student" links={navLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="page-title">My Attendance</h1>

        {dataLoading ? <Loading text="Loading..." className="py-16" /> : (
          <>
          {/* Overall card ← ADD IT HERE inside the return */}
          <div className="card p-4 flex items-center gap-4">
            <CircularChart percentage={overallPct} size={72} />
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{overallPct}%</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Overall Attendance</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{totalPresent}/{totalClasses} classes</p>
            </div>
          </div>

            {/* Subject cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.map(s => (
                <div key={s.subjectId} className="card p-5 flex items-center gap-4">
                  <CircularChart percentage={s.percentage} size={80} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{s.subjectName}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {s.present}/{s.totalClasses} classes attended
                    </p>
                    {s.percentage < 75 && (
                      <span className="text-xs text-red-600 font-medium mt-1 block">⚠ Low attendance</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Subject bar chart */}
            {summaries.length > 0 && (
              <div className="card p-6">
                <h2 className="section-title mb-4">Subject-wise Breakdown</h2>
                <SubjectChart summaries={summaries} />
              </div>
            )}

            {/* Full history */}
            <div>
              <h2 className="section-title mb-3">Complete History</h2>
              <AttendanceHistoryTable records={records} studentId={student.uid} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
