'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { getTimetableByTeacher } from '@/lib/db'
import type { TeacherUser, Timetable, Period } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import Link from 'next/link'
import { DAYS_OF_WEEK, getSemesterLabel } from '@/lib/utils'
import {
  HiOutlineClipboardCheck, HiOutlineUsers, HiOutlineChartBar,
  HiOutlineCalendar, HiOutlineDocumentReport, HiOutlinePencil,
  HiOutlineViewGrid,
} from 'react-icons/hi'

const PERIOD_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
]

export default function TimetablePage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const teacher = appUser as TeacherUser | null
  const isAdmin = appUser?.role === 'admin'

  const sidebarLinks = [
    { href: isAdmin ? '/admin/dashboard' : '/teacher/dashboard', label: 'Dashboard', icon: isAdmin ? <HiOutlineViewGrid size={18} /> : <HiOutlineChartBar size={18} /> },
    { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
    { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
    { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
    { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
  ]

  const navLinks = [
    { href: isAdmin ? '/admin/dashboard' : '/teacher/dashboard', label: 'Dashboard' },
    { href: '/teacher/mark-attendance', label: 'Attendance' },
    { href: '/teacher/students',        label: 'Students' },
    { href: '/teacher/timetable',       label: 'Timetable' },
    { href: '/teacher/reports',         label: 'Reports' },
  ]

  const [timetable, setTimetable] = useState<Timetable | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as typeof DAYS_OF_WEEK[number]

  useEffect(() => {
    if (!loading && !appUser) router.push('/teacher/login')
  }, [loading, appUser, router])

  useEffect(() => {
    if (!teacher) return
    getTimetableByTeacher(teacher.uid)
      .then(setTimetable)
      .finally(() => setDataLoading(false))
  }, [teacher])

  if (loading || !teacher) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName={isAdmin ? 'Admin' : 'Teacher'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName={isAdmin ? 'Admin' : 'Teacher'} links={navLinks} />
        <main className="flex-1 p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">My Timetable</h1>
              {timetable && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {timetable.semesterType === 'odd' ? 'Odd Semesters' : 'Even Semesters'}
                  · Effective from {timetable.effectiveFrom?.toLocaleDateString()}
                </p>
              )}
            </div>
            <Link href={`/teacher/setup?returnTo=${isAdmin ? '/admin/dashboard' : '/teacher/dashboard'}`} className="btn-secondary gap-2">
              <HiOutlinePencil size={15} /> Edit Timetable
            </Link>
          </div>

          {dataLoading ? <Loading text="Loading timetable..." className="py-16" /> :
           !timetable ? (
            <div className="card p-10 text-center">
              <HiOutlineCalendar size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>No timetable configured</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Set up your weekly schedule to enable automatic attendance loading.
              </p>
              <Link href={`/teacher/setup?returnTo=${isAdmin ? '/admin/dashboard' : '/teacher/dashboard'}`} className="btn-primary">Set Up Timetable →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(day => {
                const daySchedule = timetable.schedule.find(d => d.day === day)
                const isToday = day === today
                return (
                  <div key={day} className={`card overflow-hidden ${isToday ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
                    <div className={`px-5 py-3 flex items-center gap-3 border-b`}
                      style={{
                        background: isToday ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                      }}>
                      <h3 className={`font-semibold text-sm ${isToday ? 'text-white' : ''}`}
                        style={!isToday ? { color: 'var(--color-text)' } : {}}>
                        {day}
                      </h3>
                      {isToday && (
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Today</span>
                      )}
                      <span className={`ml-auto text-xs ${isToday ? 'text-white/70' : ''}`}
                        style={!isToday ? { color: 'var(--color-text-muted)' } : {}}>
                        {daySchedule?.periods.length ?? 0} periods
                      </span>
                    </div>

                    <div className="p-4">
                      {!daySchedule?.periods.length ? (
                        <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>No classes</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {daySchedule.periods.map((period, i) => (
                            <div key={period.id}
                              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${PERIOD_COLORS[i % PERIOD_COLORS.length]}`}>
                              <div>
                                <p className="font-semibold">{period.startTime} – {period.endTime}</p>
                                <p className="font-medium mt-0.5">{period.subjectName}</p>
                                <p className="text-xs mt-0.5 opacity-75">
                                  {period.trade} · {getSemesterLabel(period.semester, period.trade)} · Sec {period.section}
                                  {period.room && ` · ${period.room}`}
                                </p>
                              </div>
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
    </div>
  )
}