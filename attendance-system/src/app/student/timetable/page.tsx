'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/db'
import type { StudentUser, Timetable, Period } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import { DAYS_OF_WEEK } from '@/lib/utils'

const navLinks = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/timetable', label: 'Timetable' },
]

const PERIOD_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
  'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300',
  'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
  'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300',
  'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-300',
]

interface DayPeriods {
  day: string
  periods: (Period & { teacherName?: string })[]
}

export default function StudentTimetablePage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const student = appUser as StudentUser | null

  const [timetable, setTimetable] = useState<DayPeriods[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    if (!loading && !appUser) router.push('/student/login')
    if (!loading && appUser?.role !== 'student') router.push('/')
  }, [loading, appUser, router])

  useEffect(() => {
    if (!student) return
    const build = async () => {
      // Fetch all teacher timetables
      const timetableSnap = await getDocs(collection(db, COLLECTIONS.TIMETABLES))
      const allTimetables: (Timetable & { teacherId: string })[] = timetableSnap.docs.map(d => ({
        ...d.data() as Timetable,
        teacherId: d.id,
      }))

      // Get teacher names
      const teacherIds = allTimetables.map(t => t.teacherId)
      let teacherNames: Record<string, string> = {}
      if (teacherIds.length) {
        const userSnap = await getDocs(collection(db, COLLECTIONS.USERS))
        userSnap.docs.forEach(d => {
          teacherNames[d.id] = d.data().displayName
        })
      }

      // Build student's schedule by filtering periods matching student's trade/sem/section
      const dayMap: Record<string, (Period & { teacherName?: string })[]> = {}
      DAYS_OF_WEEK.forEach(d => { dayMap[d] = [] })

      allTimetables.forEach(tt => {
        tt.schedule.forEach(daySchedule => {
          daySchedule.periods.forEach(period => {
            if (
              period.trade === student.trade &&
              period.semester === student.semester &&
              period.section === student.section
            ) {
              dayMap[daySchedule.day].push({
                ...period,
                teacherName: teacherNames[tt.teacherId] || 'Unknown Teacher',
              })
            }
          })
        })
      })

      // Sort periods by start time
      Object.keys(dayMap).forEach(day => {
        dayMap[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
      })

      setTimetable(DAYS_OF_WEEK.map(d => ({ day: d, periods: dayMap[d] })))
      setDataLoading(false)
    }
    build()
  }, [student])

  if (loading || !student) return <Loading fullScreen />

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar portalName="Student" links={navLinks} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {student.trade} · Semester {student.semester} · Section {student.section}
          </p>
        </div>

        {dataLoading ? <Loading text="Building timetable..." className="py-16" /> : (
          <div className="space-y-4">
            {timetable.map(({ day, periods }) => {
              const isToday = day === today
              return (
                <div key={day} className={`card overflow-hidden ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b"
                    style={{
                      background: isToday ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}>
                    <h3 className={`font-semibold text-sm ${isToday ? 'text-white' : ''}`}
                      style={!isToday ? { color: 'var(--color-text)' } : {}}>
                      {day}
                    </h3>
                    {isToday && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Today</span>}
                    <span className={`ml-auto text-xs ${isToday ? 'text-white/70' : ''}`}
                      style={!isToday ? { color: 'var(--color-text-muted)' } : {}}>
                      {periods.length} period{periods.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-4">
                    {periods.length === 0 ? (
                      <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>No classes scheduled</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {periods.map((period, i) => (
                          <div key={period.id} className={`px-4 py-3 rounded-xl border text-sm ${PERIOD_COLORS[i % PERIOD_COLORS.length]}`}>
                            <p className="font-bold">{period.startTime} – {period.endTime}</p>
                            <p className="font-semibold mt-0.5">{period.subjectName}</p>
                            <p className="text-xs mt-1 opacity-75">{period.teacherName}</p>
                            {period.room && <p className="text-xs mt-0.5 opacity-60">Room: {period.room}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
