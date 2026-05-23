'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  COLLECTIONS, getTodayPeriodsForTeacher, getTimetableByTeacher, getStudentsBySection,
  getSectionAttendanceByDate, getLowAttendanceStudents,
} from '@/lib/db'
import Loading from '@/components/ui/Loading'
import StatCard from '@/components/ui/StatCard'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Sidebar from '@/components/shared/Sidebar'
import Navbar from '@/components/shared/Navbar'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  HiOutlineLogout,
  HiOutlineSearch,
  HiOutlineAcademicCap, HiOutlineUsers, HiOutlineFilter,
  HiOutlineX,
  HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineExclamationCircle, HiOutlineChartBar,
  HiOutlineUserAdd, HiOutlineDocumentReport, HiOutlineClock,
  HiOutlineViewGrid,
} from 'react-icons/hi'
import type { AppUser, StudentUser, TeacherUser, Period, LowAttendanceStudent } from '@/types'
import { todayString, formatDate } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'teachers' | 'students'
type YearFilter = 'all' | '1st' | '2nd' | '3rd'
type BranchCode = 'CSE' | 'IT' | 'ECE' | 'EE' | 'CE' | 'ME' | 'AE'
type BranchFilter = 'all' | BranchCode

const FIRST_YEAR_BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'CE', 'ME', 'AE'] as const

const CODE_TO_TRADE: Record<string, string> = {
  'CSE': 'Computer Science and Engineering',
  'IT':  'Information Technology',
  'ECE': 'Electronics and Communication Engineering',
  'EE':  'Electrical Engineering',
  'CE':  'Civil Engineering',
  'ME':  'Mechanical Engineering',
  'AE':  'Automobile Engineering',
  'AS':  'Applied Science',
}

const YEAR_SEMS: Record<YearFilter, number[]> = {
  all:   [1, 2, 3, 4, 5, 6],
  '1st': [1, 2],
  '2nd': [3, 4],
  '3rd': [5, 6],
}

const BRANCH_TRADE: Record<BranchCode, string> = {
  CSE: 'Computer Science and Engineering',
  IT:  'Information Technology',
  ECE: 'Electronics and Communication Engineering',
  EE:  'Electrical Engineering',
  CE:  'Civil Engineering',
  ME:  'Mechanical Engineering',
  AE:  'Automobile Engineering',
}

// ─────────────────────────────────────────────────────────────────────────────
// MergedTeacher
// ─────────────────────────────────────────────────────────────────────────────

interface MergedTeacher {
  uid: string
  displayName: string
  email: string
  teacherId: string
  role: 'teacher' | 'admin'
  departments: string[]
  departmentCodes: string[]
  allRecords: AppUser[]
}

function mergeTeachers(rawTeachers: AppUser[]): MergedTeacher[] {
  const map = new Map<string, MergedTeacher>()
  for (const t of rawTeachers) {
    const tid: string = (t as any).teacherId ?? t.displayName
    if (!map.has(tid)) {
      map.set(tid, {
        uid: t.uid, displayName: t.displayName, email: t.email,
        teacherId: tid, role: t.role as 'teacher' | 'admin',
        departments: [], departmentCodes: [], allRecords: [],
      })
    }
    const merged = map.get(tid)!
    merged.allRecords.push(t)
    const dept  = (t as any).department     ?? ''
    const code  = (t as any).departmentCode ?? ''
    if (!merged.departments.includes(dept))     merged.departments.push(dept)
    if (!merged.departmentCodes.includes(code)) merged.departmentCodes.push(code)
    if (t.role === 'admin') merged.role = 'admin'
    if (code === 'CSE') merged.email = t.email
  }
  return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName))
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher detail drawer
// ─────────────────────────────────────────────────────────────────────────────

function TeacherDrawer({ teacher, onClose }: { teacher: MergedTeacher; onClose: () => void }) {
  const handlesBoth = teacher.departmentCodes.length > 1
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: teacher.role === 'admin' ? '#1e3a8a' : 'var(--color-primary)' }}>
              {teacher.displayName.charAt(0)}
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--color-text)' }}>{teacher.displayName}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teacher.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
            <HiOutlineX size={20} />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Teacher ID</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{teacher.teacherId}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Role</span>
            <span>
              {teacher.role === 'admin'
                ? <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">👑 Admin</span>
                : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Teacher</span>}
            </span>
          </div>
          <div className="py-2">
            <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {handlesBoth ? 'Handles Branches' : 'Department'}
            </p>
            <div className="flex flex-wrap gap-2">
              {teacher.departmentCodes.map(code => (
                <span key={code} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: code === 'CSE' ? '#2563eb20' : '#7c3aed20', color: code === 'CSE' ? '#2563eb' : '#7c3aed' }}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        </div>
        {handlesBoth && (
          <div className="p-3 rounded-xl text-xs"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
            💡 This teacher handles both <strong>CSE</strong> and <strong>IT</strong> branches.
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav links
// ─────────────────────────────────────────────────────────────────────────────

const navLinks = [
  { href: '/admin/dashboard',         label: 'Dashboard'      },
  { href: '/teacher/mark-attendance', label: 'Attendance'     },
  { href: '/teacher/students',        label: 'Students'       },
  { href: '/teacher/timetable',       label: 'Timetable'      },
  { href: '/teacher/reports',         label: 'Reports'        },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { appUser, signOut, loading } = useAuth()
  const router = useRouter()

  // ── Admin/management state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState<Tab>('overview')
  const [yearFilter, setYearFilter]     = useState<YearFilter>('all')
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all')
  const [teachers, setTeachers]         = useState<MergedTeacher[]>([])
  const [students, setStudents]         = useState<StudentUser[]>([])
  const [loadingData, setLoadingData]   = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<MergedTeacher | null>(null)

  // ── Teacher/class state ────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch]               = useState<BranchCode | null>(null)
  const [todayPeriods, setTodayPeriods]                   = useState<Period[]>([])
  const [classStudents, setClassStudents]                 = useState<StudentUser[]>([])
  const [totalStudents, setTotalStudents]                 = useState(0)
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([])
  const [todayPct, setTodayPct]                           = useState(0)
  const [classLoading, setClassLoading]                   = useState(false)

  const adminDept     = (appUser as any)?.department ?? ''
  const adminDeptCode = (appUser as any)?.departmentCode ?? ''
  const isAsAdmin     = adminDeptCode === 'AS'
  const isCseAdmin    = adminDeptCode === 'CSE'
  const canFilterBranches = isCseAdmin || isAsAdmin

  const adminBranches = useMemo<BranchCode[]>(() => (
    isAsAdmin
      ? [...FIRST_YEAR_BRANCHES]
      : isCseAdmin ? ['CSE', 'IT']
      : adminDeptCode && FIRST_YEAR_BRANCHES.includes(adminDeptCode as BranchCode)
        ? [adminDeptCode as BranchCode]
        : []
  ), [isAsAdmin, isCseAdmin, adminDeptCode])

  const teacherBranchOptions: BranchFilter[] = isAsAdmin
    ? ['all']
    : ['all', 'CSE', 'IT']

  const fetchManagementData = useCallback(async () => {
    setLoadingData(true)
    try {
      const deptCodes = isAsAdmin
        ? ['AS']
        : isCseAdmin ? ['CSE', 'IT']
        : [adminDeptCode]

      const teacherSnaps = await Promise.all(
        deptCodes.map(code =>
          getDocs(query(collection(db, COLLECTIONS.USERS), where('departmentCode', '==', code)))
        )
      )

      const rawTeachers: AppUser[] = []
      const seen = new Set<string>()
      for (const snap of teacherSnaps) {
        for (const d of snap.docs) {
          const data = { ...d.data(), uid: d.id } as AppUser
          if ((data.role === 'teacher' || data.role === 'admin') && !seen.has(d.id)) {
            seen.add(d.id)
            rawTeachers.push(data)
          }
        }
      }
      setTeachers(mergeTeachers(rawTeachers))

      const tradesToFetch = isAsAdmin
        ? FIRST_YEAR_BRANCHES.map(code => CODE_TO_TRADE[code])
        : isCseAdmin ? ['Computer Science and Engineering', 'Information Technology']
        : [adminDept]

      const studentSnaps = await Promise.all(
        tradesToFetch.map(trade =>
          getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', 'student'), where('trade', '==', trade)))
        )
      )

      const allStudents: StudentUser[] = []
      const seenS = new Set<string>()
      for (const snap of studentSnaps) {
        for (const d of snap.docs) {
          if (!seenS.has(d.id)) {
            seenS.add(d.id)
            allStudents.push({ ...d.data(), uid: d.id } as StudentUser)
          }
        }
      }
      const finalStudents = isAsAdmin
        ? allStudents.filter(s => [1, 2].includes((s as any).semester))
        : allStudents

      finalStudents.sort((a, b) => (a as any).semester - (b as any).semester)
      setStudents(finalStudents)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }, [isAsAdmin, isCseAdmin, adminDeptCode, adminDept])

  const fetchClassData = useCallback(async () => {
    if (!appUser || !selectedBranch) return
    setClassLoading(true)
    setTodayPeriods([])
    setClassStudents([])
    setLowAttendanceStudents([])
    setTodayPct(0)
    setTotalStudents(0)
    try {
      const allPeriods  = await getTodayPeriodsForTeacher(appUser.uid)
      const branchTrade = BRANCH_TRADE[selectedBranch]
      const periods     = allPeriods.filter(p => p.trade === branchTrade)
      setTodayPeriods(periods)

      const sectionSet = new Set<string>()
      let allStds: StudentUser[] = []
      const lowStdsAccum: LowAttendanceStudent[] = []

      for (const period of periods) {
        const key = `${period.trade}-${period.semester}-${period.section}`
        if (!sectionSet.has(key)) {
          sectionSet.add(key)
          const stds    = await getStudentsBySection(period.trade, period.semester, period.section)
          const lowStds = await getLowAttendanceStudents(period.trade, period.semester, period.section)
          allStds = [...allStds, ...stds]
          const ids = new Set(lowStdsAccum.map(s => s.studentId))
          lowStdsAccum.push(...lowStds.filter(s => !ids.has(s.studentId)))
        }
      }
      setClassStudents(allStds)
      setLowAttendanceStudents(lowStdsAccum)

      const timetable = await getTimetableByTeacher(appUser.uid)
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
    } catch (err) {
      console.error(err)
      toast.error('Failed to load class data')
    } finally {
      setClassLoading(false)
    }
  }, [appUser, selectedBranch])

  // Sidebar links (inside component so JSX icons work)
  const sidebarLinks = [
    { href: '/admin/dashboard',         label: 'Dashboard',       icon: <HiOutlineViewGrid size={18} /> },
    { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
    { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
    { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
    { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
  ]

  // Auth guard
  useEffect(() => {
    if (!loading && !appUser)                { router.push('/admin/login'); return }
    if (!loading && appUser?.role !== 'admin') { router.push('/'); return }
  }, [appUser, loading, router])

  // Auto-select branch
  useEffect(() => {
    if (!appUser) return
    if (adminBranches.length === 1) setSelectedBranch(adminBranches[0])
    else if (adminBranches.length > 1 && !selectedBranch) setSelectedBranch(adminBranches[0])
  }, [appUser, adminBranches, selectedBranch])

  useEffect(() => {
    if (activeTab === 'teachers' && isAsAdmin && branchFilter !== 'all') {
      setBranchFilter('all')
    }
  }, [activeTab, isAsAdmin, branchFilter])

  useEffect(() => {
    if (isAsAdmin && yearFilter !== 'all') {
      setYearFilter('all')
    }
  }, [isAsAdmin, yearFilter])

  useEffect(() => {
    if (appUser?.role !== 'admin') return
    fetchManagementData()
  }, [appUser, fetchManagementData])

  useEffect(() => {
    if (!appUser || !selectedBranch) return
    fetchClassData()
  }, [appUser, selectedBranch, fetchClassData])

  // ── Filtered teachers ──────────────────────────────────────────────────────
  const filteredTeachers = teachers.filter(t => {
    const matchSearch = t.displayName.toLowerCase().includes(search.toLowerCase()) || t.teacherId.toLowerCase().includes(search.toLowerCase())
    const matchBranch = branchFilter === 'all' || isAsAdmin || t.departmentCodes.includes(branchFilter)
    return matchSearch && matchBranch
  })

  // ── Filtered students ──────────────────────────────────────────────────────
  const sems = YEAR_SEMS[yearFilter]
  const filteredStudents = students
    .filter(s => sems.includes((s as any).semester))
    .filter(s => {
      let matchCode: string | null = null
      for (const [code, trade] of Object.entries(CODE_TO_TRADE)) {
        if (trade === (s as any).trade) { matchCode = code; break }
      }
      if (isCseAdmin || isAsAdmin) return branchFilter === 'all' || matchCode === branchFilter
      return matchCode === adminDeptCode
    })
    .filter(s =>
      s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      (s as any).rollNumber?.toLowerCase().includes(search.toLowerCase())
    )

  const groupedStudents = filteredStudents.reduce((acc, s) => {
    const key = `${(s as any).trade} — Sem ${(s as any).semester} — Sec ${(s as any).section}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {} as Record<string, StudentUser[]>)

  if (loading || !appUser) return <Loading fullScreen />

  const uniqueTeacherCount = teachers.length
  const multibranchCount   = teachers.filter(t => t.departmentCodes.length > 1).length

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>

      {/* Sidebar */}
      <Sidebar links={sidebarLinks} portalName="Admin" />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Navbar */}
        <Navbar portalName="Admin" links={navLinks} />

        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* Teacher detail drawer */}
          {selectedTeacher && <TeacherDrawer teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />}

          {/* ── TAB BAR ───────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex p-1 rounded-xl gap-1" style={{ background: 'var(--color-surface-2)' }}>
              {([
                { key: 'overview',  label: 'My Classes', icon: <HiOutlineViewGrid size={15} /> },
                { key: 'teachers',  label: 'Teachers',   icon: <HiOutlineAcademicCap size={15} />, count: uniqueTeacherCount },
                { key: 'students',  label: 'Students',   icon: <HiOutlineUsers size={15} />,       count: students.length },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                    color:      activeTab === tab.key ? 'white' : 'var(--color-text-muted)',
                  }}>
                  {tab.icon} {tab.label}
                  {'count' in tab && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--color-border)',
                        color:      activeTab === tab.key ? 'white' : 'var(--color-text-muted)',
                      }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {appUser.displayName} · {selectedBranch ? BRANCH_TRADE[selectedBranch] : adminDept} · {formatDate(new Date())}
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/teacher/mark-attendance" className="btn-primary py-2 text-xs flex items-center gap-2">
                    <HiOutlineClipboardCheck size={15} /> Mark Attendance
                  </Link>
                </div>
              </div>

              {/* ── STAT CARDS (clickable) ─────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => setActiveTab('students')} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <StatCard title="Total Students"     value={totalStudents}               icon={<HiOutlineUsers />}             color="blue" />
                </div>
                <Link href="/teacher/timetable" className="hover:opacity-80 transition-opacity">
                  <StatCard title="Today's Periods"    value={todayPeriods.length}           icon={<HiOutlineClock />}             color="purple" />
                </Link>
                <Link href="/teacher/mark-attendance" className="hover:opacity-80 transition-opacity">
                  <StatCard title="Today's Attendance" value={`${todayPct}%`}               icon={<HiOutlineClipboardCheck />}
                    color={todayPct >= 85 ? 'green' : todayPct >= 75 ? 'yellow' : 'red'} />
                </Link>
                <div onClick={() => setActiveTab('overview')} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <StatCard title="Low Attendance"     value={lowAttendanceStudents.length}  icon={<HiOutlineExclamationCircle />}
                    color={lowAttendanceStudents.length > 0 ? 'red' : 'green'}
                    subtitle={lowAttendanceStudents.length > 0 ? 'Below 75%' : 'All clear!'} />
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">Today&apos;s Schedule</h2>
                  <Link href="/teacher/mark-attendance" className="btn-primary py-2 text-xs flex items-center gap-2">
                    <HiOutlineClipboardCheck size={15} /> Mark Attendance
                  </Link>
                </div>
                {classLoading ? (
                  <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading schedule...</div>
                ) : todayPeriods.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                    <HiOutlineCalendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No classes scheduled yet.</p>
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

              {/* Low Attendance Alert */}
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
            </div>
          )}

          {/* ── TEACHERS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'teachers' && (
            <>
              {/* Filter bar */}
              <div className="flex items-center gap-3 flex-wrap">
                {canFilterBranches && !isAsAdmin && (
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <HiOutlineFilter size={14} className="ml-2" style={{ color: 'var(--color-text-muted)' }} />
                    {teacherBranchOptions.map(b => (
                      <button key={b} onClick={() => setBranchFilter(b)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: branchFilter === b ? (b === 'CSE' ? '#2563eb' : b === 'IT' ? '#7c3aed' : 'var(--color-primary)') : 'transparent',
                          color:      branchFilter === b ? 'white' : 'var(--color-text-muted)',
                        }}>
                        {b === 'all' ? 'All Branches' : b}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative flex-1 sm:w-56">
                  <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input className="input pl-9 text-sm" placeholder="Search teachers..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {filteredTeachers.length} staff member{filteredTeachers.length !== 1 ? 's' : ''}
                    {branchFilter !== 'all' ? ` in ${branchFilter}` : ` in ${adminDept}`}
                  </p>
                  {multibranchCount > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#2563eb20', color: '#2563eb' }}>
                      {multibranchCount} handle both branches
                    </span>
                  )}
                </div>

                {loadingData ? (
                  <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>No teachers found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                          {['#', 'Name', 'Email', 'Teacher ID', 'Branches', 'Role'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((teacher, i) => (
                          <tr key={teacher.uid}
                            className="border-b hover:opacity-90 cursor-pointer"
                            style={{ borderColor: 'var(--color-border)' }}
                            onClick={() => setSelectedTeacher(teacher)}>
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: teacher.role === 'admin' ? '#1e3a8a' : 'var(--color-primary)' }}>
                                  {teacher.displayName.charAt(0)}
                                </div>
                                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{teacher.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{teacher.email}</td>
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text)' }}>{teacher.teacherId}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {teacher.departmentCodes.map(code => (
                                  <span key={code} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: code === 'CSE' ? '#2563eb20' : '#7c3aed20', color: code === 'CSE' ? '#2563eb' : '#7c3aed' }}>
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {teacher.role === 'admin'
                                ? <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">👑 Admin</span>
                                : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Teacher</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STUDENTS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center gap-3 flex-wrap">
                {canFilterBranches && (
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <HiOutlineFilter size={14} className="ml-2" style={{ color: 'var(--color-text-muted)' }} />
                    {(
                      isAsAdmin
                        ? (['all', ...FIRST_YEAR_BRANCHES] as BranchFilter[])
                        : (['all', 'CSE', 'IT'] as BranchFilter[])
                    ).map(b => (
                      <button key={b} onClick={() => setBranchFilter(b)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: branchFilter === b ? (b === 'CSE' ? '#2563eb' : b === 'IT' ? '#7c3aed' : 'var(--color-primary)') : 'transparent',
                          color:      branchFilter === b ? 'white' : 'var(--color-text-muted)',
                        }}>
                        {b === 'all' ? 'All Branches' : b}
                      </button>
                    ))}
                  </div>
                )}
                {!isAsAdmin && (
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    {(['all', '1st', '2nd', '3rd'] as YearFilter[]).map(y => (
                      <button key={y} onClick={() => setYearFilter(y)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: yearFilter === y ? 'var(--color-primary)' : 'transparent',
                          color:      yearFilter === y ? 'white' : 'var(--color-text-muted)',
                        }}>
                        {y === 'all' ? 'All Years' : `${y} Yr`}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative flex-1 sm:w-56">
                  <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input className="input pl-9 text-sm" placeholder="Search students..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              {((!isAsAdmin && (yearFilter !== 'all' || branchFilter !== 'all')) || (isAsAdmin && branchFilter !== 'all')) && (
                <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  Showing
                  {branchFilter !== 'all' && <strong style={{ color: 'var(--color-text)' }}>{branchFilter}</strong>}
                  {!isAsAdmin && yearFilter !== 'all' && <strong style={{ color: 'var(--color-text)' }}>{yearFilter} Year</strong>}
                  students
                  <span className="ml-auto">{filteredStudents.length} students</span>
                </div>
              )}

              {loadingData ? (
                <div className="card p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="card p-8 text-center"><p style={{ color: 'var(--color-text-muted)' }}>No students found.</p></div>
              ) : (
                Object.entries(groupedStudents).sort().map(([group, grpStudents]) => (
                  <div key={group} className="card overflow-hidden">
                    <div className="px-5 py-3 border-b flex items-center justify-between"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{group}</p>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)', color: 'white' }}>
                        {grpStudents.length} students
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
                          {grpStudents
                            .sort((a, b) => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
                              .compare((a as any).rollNumber ?? '', (b as any).rollNumber ?? ''))
                            .map(student => (
                              <tr key={student.uid} className="border-b hover:opacity-90" style={{ borderColor: 'var(--color-border)' }}>
                                <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                                  {(student as any).rollNumber}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: '#7c3aed' }}>
                                      {student.displayName?.charAt(0)}
                                    </div>
                                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>{student.displayName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                                    {(student as any).section}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                  Sem {(student as any).semester}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}