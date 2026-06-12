'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  getPeriodsForTeacherOnDate, getStudentsBySection,
  markAttendanceSafe,
} from '@/lib/db'
import type { TeacherUser, AdminUser , Period, StudentUser, StudentAttendance, AttendanceStatus } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import { todayString, formatDate, getSemesterLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  HiOutlineClipboardCheck, HiOutlineUsers, HiOutlineChartBar,
  HiOutlineCalendar, HiOutlineDocumentReport, HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi'
import { onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/db'

const teacherSidebarLinks = [
  { href: '/teacher/dashboard',       label: 'Dashboard',       icon: <HiOutlineChartBar size={18} /> },
  { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
  { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
  { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
  { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
]

const adminSidebarLinks = [
  { href: '/admin/dashboard',         label: 'Dashboard',       icon: <HiOutlineChartBar size={18} /> },
  { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
  { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
  { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
  { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
]

const teacherNavLinks = [
  { href: '/teacher/dashboard',       label: 'Dashboard'  },
  { href: '/teacher/mark-attendance', label: 'Attendance' },
  { href: '/teacher/students',        label: 'Students'   },
  { href: '/teacher/timetable',       label: 'Timetable'  },
  { href: '/teacher/reports',         label: 'Reports'    },
]

const adminNavLinks = [
  { href: '/admin/dashboard',         label: 'Dashboard'  },
  { href: '/teacher/mark-attendance', label: 'Attendance' },
  { href: '/teacher/students',        label: 'Students'   },
  { href: '/teacher/timetable',       label: 'Timetable'  },
  { href: '/teacher/reports',         label: 'Reports'    },
]

export default function MarkAttendancePage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const teacher = appUser as TeacherUser | AdminUser | null
  const isAdmin = appUser?.role === 'admin'

  const sidebarLinks = isAdmin ? adminSidebarLinks : teacherSidebarLinks
  const navLinks     = isAdmin ? adminNavLinks     : teacherNavLinks
  const portalName   = isAdmin ? 'Admin'           : 'Teacher'

  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [students, setStudents] = useState<StudentUser[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [date, setDate] = useState(todayString())
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading && !appUser) router.push('/teacher/login')
  }, [loading, appUser, router])

  useEffect(() => {
    if (loading || !teacher) return

    getPeriodsForTeacherOnDate(teacher.uid, date)
      .then(periods => {
        setPeriods(periods)
        setSelectedPeriod(periods[0] ?? null)
      })
      .catch(() => {
        setPeriods([])
        setSelectedPeriod(null)
      })
  }, [loading, teacher, date])

  // Real-time listener for selected period
  useEffect(() => {
    if (!selectedPeriod) return

  // Still fetch students once (they don't change mid-class)
  getStudentsBySection(selectedPeriod.trade, selectedPeriod.semester, selectedPeriod.section)
    .then(stds => {
      setStudents(stds)
      // Default all to present if no saved record yet
      const map: Record<string, AttendanceStatus> = {}
      stds.forEach(s => { map[s.uid] = 'present' })
      setAttendance(map)
    })

  // Real-time listener for attendance record
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE),
    where('date', '==', date),
    where('subjectId', '==', selectedPeriod.subjectId),
    where('trade', '==', selectedPeriod.trade),
    where('semester', '==', selectedPeriod.semester),
    where('section', '==', selectedPeriod.section),
  )

  const unsubscribe = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const record = snap.docs[0].data()
      const map: Record<string, AttendanceStatus> = {}
      record.students.forEach((s: any) => { map[s.studentId] = s.status })
      setAttendance(map)
      setSaved(true)
    } else {
      setSaved(false)
    }
  })

  return () => unsubscribe() // cleanup when period changes or unmounts

}, [selectedPeriod, date])


  const toggleStatus = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }))
    setSaved(false)
  }

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => { map[s.uid] = status })
    setAttendance(map)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!selectedPeriod || !teacher) return
    setSubmitting(true)
    try {
      const studentEntries: StudentAttendance[] = students.map(s => ({
        studentId: s.uid,
        rollNumber: s.rollNumber,
        studentName: s.displayName,
        status: attendance[s.uid] ?? 'present',
      }))

      const base = {
        date,
        subjectId: selectedPeriod.subjectId,
        subjectName: selectedPeriod.subjectName,
        teacherId: teacher.uid,
        trade: selectedPeriod.trade,
        semester: selectedPeriod.semester,
        section: selectedPeriod.section,
        students: studentEntries,
        markedBy: teacher.displayName,
      }

      const classType = selectedPeriod.classType
      const practicalPeriods = selectedPeriod.practicalPeriods ?? 1

      const requestId = selectedPeriod.adjustmentRequestId ?? null

      if (selectedPeriod.startTime === '15:10') {
        await markAttendanceSafe(
          teacher.uid,
          requestId,
          selectedPeriod.id + '-p7',
          date,
          { ...base, periodId: selectedPeriod.id + '-p7', periodLabel: '7th Period', startTime: '15:10', endTime: '16:00' },
        )
        await markAttendanceSafe(
          teacher.uid,
          requestId,
          selectedPeriod.id + '-p8',
          date,
          { ...base, periodId: selectedPeriod.id + '-p8', periodLabel: '8th Period', startTime: '15:10', endTime: '16:00' },
        )
        toast.success('Attendance saved for both 7th & 8th periods!')
      } else if (classType === 'practical' && practicalPeriods > 1) {
        for (let i = 0; i < practicalPeriods; i++) {
          await markAttendanceSafe(
            teacher.uid,
            requestId,
            selectedPeriod.id + '-lab' + (i + 1),
            date,
            { ...base, periodId: selectedPeriod.id + '-lab' + (i + 1), periodLabel: `Practical Period ${i + 1} of ${practicalPeriods}` },
          )
        }
        toast.success(`Attendance saved! Counted as ${practicalPeriods} periods.`)
      } else {
        await markAttendanceSafe(
          teacher.uid,
          requestId,
          selectedPeriod.id,
          date,
          { ...base, periodId: selectedPeriod.id, periodLabel: 'Period' },
        )
        toast.success('Attendance saved!')
      }

      setSaved(true)
    } catch (err) {
      toast.error('Failed to save attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length
  const pct          = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  if (loading || !teacher) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName={portalName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName={portalName} links={navLinks} />
        <main className="flex-1 p-4 sm:p-6 space-y-5">
          <h1 className="page-title">Mark Attendance</h1>

          {/* Date + Period Selector */}
          <div className="card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={date} max={todayString()}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Select Period</label>
                <div className="flex flex-wrap gap-2">
                  {periods.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No periods today. <a href="/teacher/setup" className="underline" style={{ color: 'var(--color-primary)' }}>Set up timetable</a>
                    </p>
                  ) : periods.map(period => (
                    <button key={period.id}
                      onClick={() => { setSelectedPeriod(period); setSaved(false) }}
                      className="px-3 py-2 rounded-xl text-sm border transition-all"
                      style={{
                        background:   selectedPeriod?.id === period.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color:        selectedPeriod?.id === period.id ? 'white' : 'var(--color-text)',
                        borderColor:  selectedPeriod?.id === period.id ? 'var(--color-primary)' : 'var(--color-border)',
                      }}>
                      <span className="font-medium">{period.startTime}</span>
                      {period.startTime === '15:10' && (
                        <span className="ml-1 text-xs opacity-80">(7th & 8th)</span>
                      )}
                      <span className="mx-1 opacity-60">·</span>
                      {period.classType === 'practical' ? '🔬' : '🎓'}
                      {period.subjectName}
                      <span className="ml-1 text-xs opacity-70">{getSemesterLabel(period.semester, period.trade)} {period.section}</span>
                      {period.adjustmentRequestId && period.originalTeacherName && (
  <span
    className="ml-1 text-xs font-semibold"
    style={{
      color:
        selectedPeriod?.id === period.id
          ? '#bfdbfe'
          : 'var(--color-primary)',
    }}
  >
    (Covering {period.originalTeacherName})
  </span>
)}
                      {period.practicalPeriods && period.practicalPeriods > 1 && (
                        <span className="ml-1 text-xs font-bold" style={{ color: selectedPeriod?.id === period.id ? '#e9d5ff' : '#7c3aed' }}>
                          ×{period.practicalPeriods}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Sheet */}
          {selectedPeriod && (
            <div className="card overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <div>
  <p
    className="font-semibold"
    style={{ color: 'var(--color-text)' }}
  >
    {selectedPeriod.subjectName}
  </p>

  {selectedPeriod.adjustmentRequestId &&
    selectedPeriod.originalTeacherName && (
      <p
        className="text-xs mt-0.5 font-semibold"
        style={{ color: 'var(--color-primary)' }}
      >
        Covering for: {selectedPeriod.originalTeacherName}
      </p>
  )}

  <p
    className="text-xs mt-0.5"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {selectedPeriod.trade} ·
    {getSemesterLabel(
      selectedPeriod.semester,
      selectedPeriod.trade
    )} ·
    Section {selectedPeriod.section} ·
    {formatDate(date)}
  </p>
</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                    <HiOutlineCheck size={15} /> {presentCount} Present
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                    <HiOutlineX size={15} /> {absentCount} Absent
                  </span>
                  <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{pct}%</span>
                </div>
              </div>

              {/* Controls */}
              <div className="px-4 py-3 border-b flex flex-wrap gap-2" style={{ borderColor: 'var(--color-border)' }}>
                <button onClick={() => markAll('present')} className="btn-secondary py-1.5 text-xs text-green-600" style={{ borderColor: '#d1fae5' }}>
                  ✓ Mark All Present
                </button>
                <button onClick={() => markAll('absent')} className="btn-secondary py-1.5 text-xs text-red-500" style={{ borderColor: '#fee2e2' }}>
                  ✗ Mark All Absent
                </button>
              </div>

              {/* Student List */}
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {students.map((student, i) => {
                  const status    = attendance[student.uid] ?? 'present'
                  const isPresent = status === 'present'
                  return (
                    <div key={student.uid}
                      className="flex items-center justify-between px-5 py-3 hover:opacity-90 transition-opacity"
                      style={{ background: isPresent ? 'var(--color-surface)' : '#fff5f5' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm w-7 text-center font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: isPresent ? 'var(--color-primary)' : '#ef4444' }}>
                          {student.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{student.displayName}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{student.rollNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStatus(student.uid)}
                        className={`w-24 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isPresent
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}>
                        {isPresent ? '✓ Present' : '✗ Absent'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Save Button */}
              <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button onClick={handleSave} disabled={submitting || saved}
                  className={`btn-primary ${saved ? 'opacity-70' : ''}`}>
                  {submitting ? 'Saving...' : saved ? '✓ Saved' : 'Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
