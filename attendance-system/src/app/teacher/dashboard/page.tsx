'use client'
import DashboardStatCards from '@/components/teacher/DashboardStatCards'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  getTodayPeriodsForTeacher,
  getLowAttendanceStudents,
  getStudentsByTrade,
} from '@/lib/db'
import type {
  TeacherUser,
  StudentUser,
  Period,
  LowAttendanceStudent
} from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { BranchSelector } from '@/components/branchselector'
import { todayString, formatDate, getSemesterLabel } from '@/lib/utils'
import Link from 'next/link'
import {
  HiOutlineUsers, HiOutlineClipboardCheck,
  HiOutlineCalendar, HiOutlineExclamationCircle, HiOutlineChartBar,
  HiOutlineUserAdd, HiOutlineDocumentReport, HiOutlineClock,
  HiOutlineBeaker, HiOutlineBookOpen, HiOutlineSearch,
  HiOutlineArrowLeft, HiOutlineX, HiOutlineCheckCircle
} from 'react-icons/hi'


// ─── types ───────────────────────────────────────────────────────────────────

type Branch = 'CSE' | 'IT' | 'ECE' | 'EE' | 'CE' | 'ME' | 'AE'
type YearFilter = 'all' | '1st' | '2nd' | '3rd'

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

const YEAR_SEMS: Record<YearFilter, number[]> = {
  all:   [1, 2, 3, 4, 5, 6],
  '1st': [1, 2],
  '2nd': [3, 4],
  '3rd': [5, 6],
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const navLinks = [
  { href: '/teacher/dashboard',       label: 'Dashboard' },
  { href: '/teacher/mark-attendance', label: 'Attendance' },
  { href: '/teacher/students',        label: 'Students' },
  { href: '/teacher/timetable',       label: 'Timetable' },
  { href: '/teacher/reports',         label: 'Reports' },
]

function getTeacherBranches(teacher: TeacherUser | null): Branch[] {
  if (!teacher) return []
  const codes: string[] = teacher.departmentCodes ?? [teacher.departmentCode ?? '']
  const teacherDeptCode = teacher.departmentCode

  if (teacherDeptCode === 'AS') {
    return [...FIRST_YEAR_BRANCHES]
  }

  const valid = codes.filter((c): c is Branch => FIRST_YEAR_BRANCHES.includes(c as Branch))
  if (valid.length > 0) return Array.from(new Set(valid))

  const sectionTrades = new Set<string>()
  if (teacher?.assignedSections) {
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

  const dept = teacher?.department
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

  // todayPeriods holds ALL individual period slots for today (not deduplicated).
  // todayPeriods.length is the true "how many periods do I have today" count.
  const [todayPeriods, setTodayPeriods]                   = useState<Period[]>([])
  
  // totalStudents = unique students across ALL sections in the full timetable,
  // not just today's — the true "students I'm responsible for" number.
  const [totalStudents, setTotalStudents]                 = useState(0)
  const [branchStudents, setBranchStudents]               = useState<StudentUser[]>([])
  const [showStudentList, setShowStudentList]             = useState(false)
  const [showLowAttendance, setShowLowAttendance]         = useState(false)
  const [studentYearFilter, setStudentYearFilter]         = useState<YearFilter>('all')
  const [studentSearch, setStudentSearch]                 = useState('')
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([])

  const [dataLoading, setDataLoading]                     = useState(true)

  // Race guard — prevents a slow fetch from overwriting results of a newer one
  const fetchIdRef = useRef(0)

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

    const fetchId = ++fetchIdRef.current
    setDataLoading(true)
    setTodayPeriods([])
    setLowAttendanceStudents([])
    
    setTotalStudents(0)

    const init = async () => {
      const branchTrade = BRANCH_TRADE[selectedBranch]

      // ── Today's periods ───────────────────────────────────────────────────
      // allBranchPeriods = every individual slot today (undeduped).
      // This is what the "Today's Periods" stat card shows.
      const allPeriods       = await getTodayPeriodsForTeacher(teacher.uid)
      const allBranchPeriods = allPeriods.filter(p => p.trade === branchTrade)

      // uniquePeriods deduplicates by section — used only for Firestore queries
      // so we don't fetch the same section data multiple times.
      const sectionSet = new Set<string>()
      const uniquePeriods: Period[] = []
      for (const period of allBranchPeriods) {
        const key = `${period.trade}-${period.semester}-${period.section}`
        if (!sectionSet.has(key)) {
          sectionSet.add(key)
          uniquePeriods.push(period)
        }
      }

      if (fetchId !== fetchIdRef.current) return
      setTodayPeriods(allBranchPeriods)

      // ── Students in today's sections ──────────────────────────────────────
      const lowStdsAccum: LowAttendanceStudent[] = []
      const seenLow = new Set<string>()

      for (const period of uniquePeriods) {
  const lowStds = await getLowAttendanceStudents(
    period.trade,
    period.semester,
    period.section
  )

  for (const s of lowStds) {
    if (!seenLow.has(s.studentId)) {
      seenLow.add(s.studentId)
      lowStdsAccum.push(s)
    }
  }
}
      if (fetchId !== fetchIdRef.current) return
      
      setLowAttendanceStudents(lowStdsAccum)

      // ── Total students across full timetable ──────────────────────────────
      // Walk every section that appears anywhere in the timetable (all days),
      // collect unique student IDs — this is the correct "Total Students" count.
      const branchStudents = await getStudentsByTrade(branchTrade)
      if (fetchId !== fetchIdRef.current) return
      setTotalStudents(branchStudents.length)
      setBranchStudents(branchStudents)

      // ── Today's attendance % ──────────────────────────────────────────────
      // Uses the first unique section only (matches original behaviour).
      

      if (fetchId !== fetchIdRef.current) return
      setDataLoading(false)
    }

    init().catch(console.error)
  }, [teacher, selectedBranch])

  const filteredBranchStudents = useMemo(() => {
    const sems = YEAR_SEMS[studentYearFilter]
    return branchStudents
      .filter(s => sems.includes(s.semester ?? -1))
      .filter(s =>
        s.displayName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
      )
  }, [branchStudents, studentSearch, studentYearFilter])

  const groupedBranchStudents = useMemo(() => {
    const groups: Record<string, StudentUser[]> = {}
    filteredBranchStudents.forEach(student => {
      const key = `${student.trade}::${student.semester}::${student.section}`
      if (!groups[key]) groups[key] = []
      groups[key].push(student)
    })
    return Object.entries(groups)
      .sort()
      .map(([key, students]) => [
        key,
        students.sort((a, b) =>
          (a.rollNumber ?? '').localeCompare(b.rollNumber ?? '', undefined, { numeric: true })
        ),
      ] as [string, StudentUser[]])
  }, [filteredBranchStudents])

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
        <Navbar portalName="Teacher" links={navLinks} hideThemeToggle />

        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                {teacher.displayName}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {BRANCH_TRADE[selectedBranch]} · {formatDate(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              
<DashboardStatCards
  teacherUid={teacher.uid}
  totalStudents={totalStudents}
  todayPeriods={todayPeriods.length}
  lowAttendance={lowAttendanceStudents.length}
  onViewStudents={() => {
    setShowStudentList(true)
    setStudentYearFilter('all')
  }}
  onViewSchedule={() =>
    document.getElementById('todays-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  onViewLowAttendance={() => setShowLowAttendance(true)}
/>

              {showStudentList && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentList(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <HiOutlineArrowLeft size={16} />
                    Back to dashboard
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                      {(['all', '1st', '2nd', '3rd'] as YearFilter[]).map(y => (
                        <button key={y} onClick={() => setStudentYearFilter(y)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: studentYearFilter === y ? 'var(--color-primary)' : 'transparent',
                            color:      studentYearFilter === y ? 'white' : 'var(--color-text-muted)',
                          }}>
                          {y === 'all' ? 'All Years' : `${y} Yr`}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 sm:w-56">
                      <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                      <input className="input pl-9 text-sm" placeholder="Search students..."
                        value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    Showing <strong style={{ color: 'var(--color-text)' }}>
                      {studentYearFilter === 'all' ? 'All Years' : `${studentYearFilter} Year`}
                    </strong> students
                    <span className="ml-auto">{filteredBranchStudents.length} students</span>
                  </div>

                  {filteredBranchStudents.length === 0 ? (
                    <div className="card p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                      No students found.
                    </div>
                  ) : (
                    groupedBranchStudents.map(([group, students]) => {
                      const [trade, sem, sec] = group.split('::')
                      const displayLabel = `${trade} — Sem ${sem} — Sec ${sec}`
                      return (
                        <div key={group} className="card overflow-hidden">
                          <div className="px-5 py-3 border-b flex items-center justify-between"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{displayLabel}</p>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)', color: 'white' }}>
                              {students.length} students
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                                  {['Roll No.', 'Name', 'Section', 'Semester'].map(h => (
                                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {students.map(student => (
                                  <tr key={student.uid} className="border-b hover:opacity-90" style={{ borderColor: 'var(--color-border)' }}>
                                    <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                                      {student.rollNumber}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                          style={{ background: 'var(--color-primary)' }}>
                                          {student.displayName?.charAt(0)}
                                        </div>
                                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>{student.displayName}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                                        {student.section}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                      Sem {student.semester}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* Today's Schedule */}
              <div className="card p-5" id="todays-schedule">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="section-title">Today&apos;s Schedule</h2>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {todayPeriods.length} period{todayPeriods.length !== 1 ? 's' : ''} · {formatDate(new Date())}
      </p>
    </div>
    <Link href="/teacher/mark-attendance" className="btn-primary py-2 text-xs flex items-center gap-2">
      <HiOutlineClipboardCheck size={15} /> Mark Attendance
    </Link>
  </div>
  {todayPeriods.length === 0 ? (
    <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
      <HiOutlineCalendar size={32} className="mx-auto mb-2 opacity-50" />
      <p className="text-sm">No {selectedBranch} classes scheduled today.</p>
      <Link href="/teacher/setup?returnTo=/teacher/dashboard" className="text-sm mt-1 block" style={{ color: 'var(--color-primary)' }}>
        Set up your timetable →
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {todayPeriods.map((period, idx) => {
        const colors = ['#2563eb', '#7c3aed', '#db2777', '#f59e0b', '#059669', '#ea580c']
        const color = colors[idx % colors.length]
        return (
          <div key={period.id}
            className="rounded-xl p-4 flex flex-col gap-2 border"
            style={{ background: `${color}10`, borderColor: `${color}30` }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: color, color: 'white' }}>
                {period.classType === 'practical' ? <HiOutlineBeaker size={16} /> : <HiOutlineBookOpen size={16} />}
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${color}20`, color }}>
                {period.startTime}–{period.endTime}
              </span>
            </div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
              {period.subjectName}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                Sem {period.semester}{period.section}
              </span>
              {period.room && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  {period.room}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                style={{ background: `${color}20`, color }}>
                {period.classType ?? 'lecture'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )}
</div>
              

              {/* Low Attendance */}
              {lowAttendanceStudents.length > 0 && (
                <div className="card p-5" id="low-attendance">
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

          {/* 3. Add low-attendance modal — place it just before the closing </main> tag */}
          {showLowAttendance && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.5)' }}
    onClick={() => setShowLowAttendance(false)}
  >
    <div
      className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            Low Attendance Students
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Students with attendance below 75%
          </p>
        </div>
        <button onClick={() => setShowLowAttendance(false)}
          className="p-1.5 rounded-lg hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}>
          <HiOutlineX size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {lowAttendanceStudents.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            <HiOutlineCheckCircle size={32} className="mx-auto mb-2 opacity-50" style={{ color: '#16a34a' }} />
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>All clear!</p>
            <p className="text-xs mt-1">No students below 75% attendance.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {['Roll No.', 'Name', 'Section', 'Semester', 'Attendance'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowAttendanceStudents.map(student => {
                const matched = branchStudents.find(
                  s => s.uid === student.studentId || s.rollNumber === student.rollNumber
                )
                return (
                  <tr key={student.studentId} className="border-b"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-mono font-bold text-xs"
                      style={{ color: 'var(--color-primary)' }}>
                      {student.rollNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: '#ef4444' }}>
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                        {matched?.section ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}>
                      Sem {matched?.semester ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: '#ef444420', color: '#ef4444' }}>
                        {student.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
)}

        </main>
      </div>
    </div>
  )
}