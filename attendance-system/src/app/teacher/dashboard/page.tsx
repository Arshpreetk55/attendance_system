'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  getTodayPeriodsForTeacher, getTimetableByTeacher, getStudentsBySection,
  getSectionAttendanceByDate, getLowAttendanceStudents,
} from '@/lib/db'
import type { TeacherUser, Period, StudentUser, LowAttendanceStudent } from '@/types'
import Loading from '@/components/ui/Loading'
import StatCard from '@/components/ui/StatCard'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { BranchSelector } from '@/components/branchselector'
import { todayString, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  HiOutlineUsers, HiOutlineClipboardCheck,
  HiOutlineCalendar, HiOutlineExclamationCircle, HiOutlineChartBar,
  HiOutlineUserAdd, HiOutlineDocumentReport, HiOutlineClock,
} from 'react-icons/hi'

// ─── types ───────────────────────────────────────────────────────────────────

type Branch = 'CSE' | 'IT' | 'ECE' | 'EE' | 'CE' | 'ME' | 'AE'

const FIRST_YEAR_BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'CE', 'ME', 'AE'] as const

const BRANCH_TRADE: Record<Branch, string> = {
  CSE: 'Computer Science and Engineering',
  IT:  'Information Technology',
  ECE: 'Electronics and Communication Engineering',
  EE:  'Electrical Engineering',
  CE:  'Civil Engineering',
  ME:  'Mechanical Engineering',
  AE:  'Automobile Engineering',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const navLinks = [
  { href: '/teacher/dashboard',       label: 'Dashboard' },
  { href: '/teacher/mark-attendance', label: 'Attendance' },
  { href: '/teacher/students',        label: 'Students' },
  { href: '/teacher/timetable',       label: 'Timetable' },
  { href: '/teacher/reports',         label: 'Reports' },
]

function getTeacherBranches(teacher: TeacherUser): Branch[] {
  const codes: string[] =
    (teacher as any).departmentCodes ??
    [(teacher as any).departmentCode ?? '']
  const teacherDeptCode = (teacher as any).departmentCode as string | undefined

  if (teacherDeptCode === 'AS') {
    return [...FIRST_YEAR_BRANCHES]
  }

  const valid = codes.filter((c): c is Branch => FIRST_YEAR_BRANCHES.includes(c as Branch))
  if (valid.length > 0) return Array.from(new Set(valid))

  const sectionTrades = new Set<string>()
  if (teacher.assignedSections) {
    teacher.assignedSections.forEach(sec => sectionTrades.add(sec.trade))
  }
  if (teacher.timetable) {
    teacher.timetable.schedule.forEach(day => {
      day.periods.forEach(period => sectionTrades.add(period.trade))
    })
  }
  const sectionCodes = Array.from(sectionTrades)
    .map(trade => {
      if (trade === 'Computer Science and Engineering') return 'CSE'
      if (trade === 'Information Technology') return 'IT'
      if (trade === 'Electronics and Communication Engineering') return 'ECE'
      if (trade === 'Electrical Engineering') return 'EE'
      if (trade === 'Civil Engineering') return 'CE'
      if (trade === 'Mechanical Engineering') return 'ME'
      if (trade === 'Automobile Engineering') return 'AE'
      return ''
    })
    .filter((c): c is Branch => FIRST_YEAR_BRANCHES.includes(c as Branch))
  if (sectionCodes.length > 0) return Array.from(new Set(sectionCodes))

  const dept = (teacher as any).department as string | undefined
  if (dept === 'Computer Science and Engineering') return ['CSE']
  if (dept === 'Information Technology') return ['IT']
  if (dept === 'Electronics and Communication Engineering') return ['ECE']
  if (dept === 'Electrical Engineering') return ['EE']
  if (dept === 'Civil Engineering') return ['CE']
  if (dept === 'Mechanical Engineering') return ['ME']
  if (dept === 'Automobile Engineering') return ['AE']

  return ['CSE']
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const teacher = appUser as TeacherUser | null

  // Sidebar links inside component so JSX icons are valid
  const sidebarLinks = [
    { href: '/teacher/dashboard',       label: 'Dashboard',       icon: <HiOutlineChartBar size={18} /> },
    { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
    { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
    { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
    { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
  ]

  const [selectedBranch, setSelectedBranch]               = useState<Branch | null>(null)
  const teacherBranches: Branch[]                         = teacher ? getTeacherBranches(teacher) : []
  const [todayPeriods, setTodayPeriods]                   = useState<Period[]>([])
  const [todayStudents, setTodayStudents]                 = useState<StudentUser[]>([])
  const [totalStudents, setTotalStudents]                 = useState(0)
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([])
  const [todayPct, setTodayPct]                           = useState(0)
  const [dataLoading, setDataLoading]                     = useState(true)

  // auth guard
  useEffect(() => {
    if (!loading && !appUser) router.push('/teacher/login')
    if (!loading && appUser?.role !== 'teacher' && appUser?.role !== 'admin') router.push('/')
  }, [loading, appUser, router])

  // auto-select if teacher only has one branch
  useEffect(() => {
    if (!teacher) return
    const branches = getTeacherBranches(teacher)
    if (branches.length === 1) setSelectedBranch(branches[0])
  }, [teacher])

  // fetch data whenever branch is chosen or changes
  useEffect(() => {
    if (!teacher || !selectedBranch) return
    setDataLoading(true)
    setTodayPeriods([])
    setTodayStudents([])
    setLowAttendanceStudents([])
    setTodayPct(0)
    setTotalStudents(0)

    const init = async () => {
      const allPeriods  = await getTodayPeriodsForTeacher(teacher.uid)
      const branchTrade = BRANCH_TRADE[selectedBranch]
      const periods     = allPeriods.filter(p => p.trade === branchTrade)
      setTodayPeriods(periods)

      const sectionSet = new Set<string>()
      let todayStds: StudentUser[] = []
      for (const period of periods) {
        const key = `${period.trade}-${period.semester}-${period.section}`
        if (!sectionSet.has(key)) {
          sectionSet.add(key)
          const stds = await getStudentsBySection(period.trade, period.semester, period.section)
          todayStds = [...todayStds, ...stds]
          const lowStds = await getLowAttendanceStudents(period.trade, period.semester, period.section)
          setLowAttendanceStudents(prev => {
            const ids = new Set(prev.map(s => s.studentId))
            return [...prev, ...lowStds.filter(s => !ids.has(s.studentId))]
          })
        }
      }
      setTodayStudents(todayStds)

      const timetable = await getTimetableByTeacher(teacher.uid)
      if (timetable) {
        const sectionKeys = new Set<string>()
        timetable.schedule.forEach(day => {
          day.periods.forEach(period => {
            sectionKeys.add(`${period.trade}::${period.semester}::${period.section}`)
          })
        })

        const studentIds = new Set<string>()
        for (const key of sectionKeys) {
          const [trade, semesterStr, section] = key.split('::')
          const sem = Number(semesterStr)
          const students = await getStudentsBySection(trade, sem, section)
          students.forEach(student => studentIds.add(student.uid))
        }
        setTotalStudents(studentIds.size)
      } else {
        setTotalStudents(0)
      }

      if (periods.length > 0 && allStds.length > 0) {
        const todayRecs     = await getSectionAttendanceByDate(todayString(), periods[0].trade, periods[0].semester, periods[0].section)
        const totalMarked   = todayRecs.reduce((a, r) => a + r.students.filter(s => s.status === 'present').length, 0)
        const totalExpected = todayRecs.length * allStds.length
        setTodayPct(totalExpected > 0 ? Math.round((totalMarked / totalExpected) * 100) : 0)
      }
      setDataLoading(false)
    }
    init()
  }, [teacher, selectedBranch])

  if (loading || !teacher) return <Loading fullScreen />

  // Show branch picker for multi-branch teachers
  if (!selectedBranch) {
    return (
      <BranchSelector
        teacherName={teacher.displayName}
        availableBranches={teacherBranches}
        onSelect={setSelectedBranch}
      />
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName="Teacher" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName="Teacher" links={navLinks} />

        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {teacher.displayName} · {BRANCH_TRADE[selectedBranch]} · {formatDate(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Branch switcher — only for multi-branch teachers */}
              {teacherBranches.length > 1 && (
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                  {teacherBranches.map(b => (
                    <button key={b} onClick={() => setSelectedBranch(b)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: selectedBranch === b ? (b === 'CSE' ? '#2563eb' : '#7c3aed') : 'transparent',
                        color: selectedBranch === b ? 'white' : 'var(--color-text-muted)',
                      }}>
                      {b}
                    </button>
                  ))}
                </div>
              )}
              <ThemeToggle showColorTheme />
            </div>
          </div>

          {dataLoading ? (
            <Loading text="Loading data..." className="py-16" />
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Students"     value={totalStudents}               icon={<HiOutlineUsers />}             color="blue" />
                <StatCard title="Today's Periods"    value={todayPeriods.length}           icon={<HiOutlineClock />}             color="purple" />
                <StatCard title="Today's Attendance" value={`${todayPct}%`}               icon={<HiOutlineClipboardCheck />}
                  color={todayPct >= 85 ? 'green' : todayPct >= 75 ? 'yellow' : 'red'} />
                <StatCard title="Low Attendance"     value={lowAttendanceStudents.length}  icon={<HiOutlineExclamationCircle />}
                  color={lowAttendanceStudents.length > 0 ? 'red' : 'green'}
                  subtitle={lowAttendanceStudents.length > 0 ? 'Students below 75%' : 'All clear!'} />
              </div>

              {/* Today's Schedule */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">Today&apos;s Schedule</h2>
                  <Link href="/teacher/mark-attendance" className="btn-primary py-2 text-xs">
                    <HiOutlineClipboardCheck size={15} /> Mark Attendance
                  </Link>
                </div>
                {todayPeriods.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                    <HiOutlineCalendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {selectedBranch} classes scheduled today.</p>
                    <Link href="/teacher/setup" className="text-sm mt-1 block" style={{ color: 'var(--color-primary)' }}>
                      Set up your timetable →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {todayPeriods.map(period => (
                      <div key={period.id} className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: selectedBranch === 'CSE' ? '#2563eb' : '#7c3aed', color: 'white' }}>
                          <HiOutlineClock size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{period.subjectName}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {period.startTime}–{period.endTime} · Sem {period.semester}{period.section}
                            {period.room && ` · ${period.room}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Attendance */}
              {lowAttendanceStudents.length > 0 && (
                <div className="card p-5">
                  <h2 className="section-title mb-4 flex items-center gap-2">
                    <HiOutlineExclamationCircle size={20} className="text-red-500" />
                    Students Below 75% Attendance
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--color-surface-2)' }}>
                          {['Roll No.', 'Name', 'Attendance %', 'Weak Subjects'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        {lowAttendanceStudents.map(s => (
                          <tr key={s.studentId} style={{ background: 'var(--color-surface)' }}>
                            <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--color-text)' }}>{s.rollNumber}</td>
                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{s.name}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${s.percentage < 60 ? 'text-red-600' : 'text-yellow-600'}`}>
                                {s.percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {s.subjectBreakdown.filter(sb => sb.percentage < 75).map(sb => (
                                  <span key={sb.subject}
                                    className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    {sb.subject}: {sb.percentage}%
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { href: '/teacher/students',        Icon: HiOutlineUserAdd,        label: 'Manage Students'  },
                  { href: '/teacher/mark-attendance', Icon: HiOutlineClipboardCheck, label: 'Mark Attendance'  },
                  { href: '/teacher/timetable',       Icon: HiOutlineCalendar,       label: 'View Timetable'   },
                  { href: '/teacher/reports',         Icon: HiOutlineDocumentReport, label: 'Download Reports' },
                ] as const).map(({ href, Icon, label }) => (
                  <Link key={href} href={href}
                    className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}