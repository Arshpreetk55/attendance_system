'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  COLLECTIONS, 
  getTodayPeriodsAndTimetable,
  getTimetableByTeacher, 
  getStudentsBySection,
  getLowAttendanceStudents,
} from '@/lib/db'
import { subscribeAdminRequests } from '@/lib/db/adjustments'
import Loading from '@/components/ui/Loading'
import Sidebar from '@/components/shared/Sidebar'
import Navbar from '@/components/shared/Navbar'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  HiOutlineSearch,
  HiOutlineAcademicCap, HiOutlineUsers, HiOutlineFilter,
  HiOutlineX,
   HiOutlineCheckCircle,
  HiOutlineClipboardCheck, HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineUserAdd, HiOutlineDocumentReport, HiOutlineClock,
  HiOutlineViewGrid,
  HiOutlineRefresh, 
  HiOutlineBookOpen, 
  HiOutlineBeaker,
} from 'react-icons/hi'
import { todayString, formatDate } from '@/lib/utils'
import type { AppUser, AdminUser, TeacherUser, StudentUser, Period, LowAttendanceStudent, AdjustmentRequest } from '@/types'
import AdminAdjustmentsPanel from '@/components/adjustments/AdjustmentsPanel'
import AdminDirectRequestForm from '@/components/admin/AdminDirectRequestForm'
import ThemeToggle from '@/components/ui/ThemeToggle'

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'teachers' | 'students' | 'adjustments'
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

// Reverse lookup: trade full name → branch code. Derived once from CODE_TO_TRADE
// so the two maps stay in sync automatically.
const TRADE_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_TRADE).map(([code, trade]) => [trade, code])
)

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

const BRANCH_COLORS: Record<BranchCode, { text: string; bg: string }> = {
  CSE: { text: '#2563eb', bg: '#2563eb20' },
  IT:  { text: '#7c3aed', bg: '#7c3aed20' },
  ECE: { text: '#db2777', bg: '#db277720' },
  EE:  { text: '#f59e0b', bg: '#f59e0b20' },
  CE:  { text: '#059669', bg: '#05966920' },
  ME:  { text: '#ea580c', bg: '#ea580c20' },
  AE:  { text: '#dc2626', bg: '#dc262620' },
}
const DEFAULT_BRANCH_STYLE = { text: '#6b7280', bg: '#6b728020' }

const getBranchStyle = (code: string) =>
  BRANCH_COLORS[code as BranchCode] ?? DEFAULT_BRANCH_STYLE

const CSE_BRANCH_FILTERS: BranchFilter[] = ['all', 'CSE', 'IT']


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// staffUser narrows AppUser to the two roles that carry department/departmentCode.
// StudentUser is excluded from the union because it has neither field.
function staffUser(u: AppUser): AdminUser | TeacherUser {
  return u as AdminUser | TeacherUser
}

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
    // Cast to the staff union — rawTeachers contains only teacher/admin role docs
    // fetched by role filter; StudentUser will never appear here at runtime.
    const teacher = t as AdminUser | TeacherUser
    const tid: string = teacher.teacherId?.trim() || teacher.email?.toLowerCase() || teacher.uid
    if (!map.has(tid)) {
      map.set(tid, {
        uid: teacher.uid, displayName: teacher.displayName, email: teacher.email,
        teacherId: tid, role: teacher.role as MergedTeacher['role'],
        departments: [], departmentCodes: [], allRecords: [],
      })
    }
    const merged = map.get(tid)!
    merged.allRecords.push(t)
    const dept = teacher.department     ?? ''
    const code = teacher.departmentCode ?? ''
    if (!merged.departments.includes(dept))     merged.departments.push(dept)
    if (!merged.departmentCodes.includes(code)) merged.departmentCodes.push(code)
    if (teacher.role === 'admin') merged.role = 'admin'
    if (!merged.email) merged.email = teacher.email
  }
  return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName))
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher detail drawer
// ─────────────────────────────────────────────────────────────────────────────

function TeacherDrawer({ teacher, onClose }: { teacher: MergedTeacher; onClose: () => void }) {
  const handlesBoth = teacher.departmentCodes.length > 1

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${teacher.displayName} details`}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--color-surface)' }}
        onClick={e => e.stopPropagation()}
      >
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
          <button
            onClick={onClose}
            aria-label="Close teacher details"
            className="p-2 rounded-xl hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
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
              {teacher.departmentCodes.map(code => {
                const style = getBranchStyle(code)
                return (
                  <span key={code} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: style.bg, color: style.text }}>
                    {code}
                  </span>
                )
              })}
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

const sidebarLinks = [
  { href: '/admin/dashboard',         label: 'Dashboard',       icon: <HiOutlineViewGrid size={18} /> },
  { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
  { href: '/teacher/students',        label: 'Students',        icon: <HiOutlineUsers size={18} /> },
  { href: '/teacher/timetable',       label: 'Timetable',       icon: <HiOutlineCalendar size={18} /> },
  { href: '/teacher/reports',         label: 'Reports',         icon: <HiOutlineDocumentReport size={18} /> },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { appUser,loading } = useAuth()
  const router = useRouter()

  // ── Admin/management state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState<Tab>('overview')
  const [showDirectForm, setShowDirectForm] = useState(false)
  const [showLowAttendance, setShowLowAttendance] = useState(false)
  const [yearFilter, setYearFilter]     = useState<YearFilter>('all')
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all')
  const [teachers, setTeachers]         = useState<MergedTeacher[]>([])
  const [students, setStudents]         = useState<StudentUser[]>([])
  const [loadingData, setLoadingData]   = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<MergedTeacher | null>(null)

  // ── Teacher/class state ────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch]               = useState<BranchCode | null>(null)
  // todayPeriods holds ALL individual period slots for today (not deduplicated)
  // so todayPeriods.length is the true "periods today" count shown in the stat card.
  const [todayPeriods, setTodayPeriods]                   = useState<Period[]>([])
  const [classStudents, setClassStudents]                 = useState<StudentUser[]>([])
  // totalStudents = unique students across ALL sections in the full timetable
  const [totalStudents, setTotalStudents]                 = useState(0)
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([])
  const [adminRequests, setAdminRequests]                 = useState<AdjustmentRequest[]>([])

  const [classLoading, setClassLoading]                   = useState(false)

  // ── Race guard: increment on every fetch; stale responses self-discard ─────
  const classRequestIdRef = useRef(0)

  const rollCollator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    []
  )

  // staffUser() narrows appUser away from StudentUser so department/departmentCode
  // are accessible without TypeScript errors. Safe because this component is
  // only reachable by admin-role users (enforced by the auth redirect below).
  const adminDept     = appUser ? staffUser(appUser).department     ?? '' : ''
  const adminDeptCode = appUser ? staffUser(appUser).departmentCode ?? '' : ''
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

  const resolvedBranch = selectedBranch ?? adminBranches[0] ?? null

  // ── Auth redirect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    if (!appUser) { router.replace('/admin/login'); return }
    if (appUser.role !== 'admin') { router.replace('/') }
  }, [appUser, loading, router])

  // ── Management data fetch ───────────────────────────────────────────────────
  const fetchManagementData = useCallback(async (mounted: { current: boolean }) => {
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
        ? allStudents.filter(s => [1, 2].includes(s.semester ?? -1))
        : allStudents

      finalStudents.sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0))

      if (!mounted.current) return
      setTeachers(mergeTeachers(rawTeachers))
      setStudents(finalStudents)
    } catch (err) {
      console.error(err)
      if (mounted.current) toast.error('Failed to load data')
    } finally {
      if (mounted.current) setLoadingData(false)
    }
  }, [isAsAdmin, isCseAdmin, adminDeptCode, adminDept])

  // ── Class data fetch ────────────────────────────────────────────────────────
  const fetchClassData = useCallback(async (mounted: { current: boolean }) => {
    if (!appUser || !selectedBranch) return

    const requestId = ++classRequestIdRef.current
    setClassLoading(true)

    try {
      const today = todayString()

      const { periods: allPeriods, timetable } = await getTodayPeriodsAndTimetable(appUser.uid)
      const branchTrade = BRANCH_TRADE[selectedBranch]

      // allBranchPeriods = every individual period slot today for this branch.
      // This is what powers the "Today's Periods" stat — the raw count of slots,
      // not deduplicated, so e.g. 3 slots in Sem-3A + 2 slots in Sem-4B = 5.
      const allBranchPeriods = allPeriods.filter(p => p.trade === branchTrade)
      

      // uniquePeriods deduplicates by section — used only for Firestore queries
      // (students, low attendance, attendance %) so we don't fetch the same
      // section multiple times when the same section appears in multiple slots.
      const sectionMap = new Map<string, Period>()
      for (const period of allBranchPeriods) {
        const key = `${period.trade}-${period.semester}-${period.section}`
        if (!sectionMap.has(key)) sectionMap.set(key, period)
      }
      const uniquePeriods = Array.from(sectionMap.values())

      // Cache student lists by section key on first fetch so the timetable
      // aggregation pass below can reuse them instead of issuing duplicate
      // getStudentsBySection() calls.
      const sectionStudentCache = new Map<string, StudentUser[]>()

      const sectionResults = await Promise.all(
        uniquePeriods.map(async (period) => {
          const cacheKey = `${period.trade}::${period.semester}::${period.section}`
          const [stds, lowStds] = await Promise.all([
            getStudentsBySection(period.trade, period.semester, period.section),
            getLowAttendanceStudents(period.trade, period.semester, period.section),
          ])
          sectionStudentCache.set(cacheKey, stds)
          return { stds, lowStds }
        })
      )

      const seenStudents = new Set<string>()
      const allStds: StudentUser[] = []
      const lowStdsAccum: LowAttendanceStudent[] = []
      const seenLow = new Set<string>()
      for (const { stds, lowStds } of sectionResults) {
        for (const s of stds) {
          if (!seenStudents.has(s.uid)) { seenStudents.add(s.uid); allStds.push(s) }
        }
        for (const s of lowStds) {
          if (!seenLow.has(s.studentId)) { seenLow.add(s.studentId); lowStdsAccum.push(s) }
        }
      }

      

      // totalStudents = unique students across ALL sections in the full timetable,
      // not just today's. This gives the true "students I'm responsible for" count.
      
      let totalCount  = 0
      if (timetable) {
        const sectionKeys = new Set<string>()
        timetable.schedule.forEach(day => {
          day.periods.forEach(p => {
            sectionKeys.add(`${p.trade}::${p.semester}::${p.section}`)
          })
        })

        // Reuse cached student lists; only fetch sections not already loaded
        // during the period aggregation pass above.
        const studentIdSets = await Promise.all(
          Array.from(sectionKeys).map(async (key) => {
            const cached = sectionStudentCache.get(key)
            if (cached) return cached.map(s => s.uid)
            const [trade, semesterStr, section] = key.split('::')
            const stds = await getStudentsBySection(trade, Number(semesterStr), section)
            return stds.map(s => s.uid)
          })
        )
        totalCount = new Set(studentIdSets.flat()).size
      }

      if (!mounted.current || requestId !== classRequestIdRef.current) return
      
      // Store the full undeduped list so the stat card shows real period count
      setTodayPeriods(allBranchPeriods)
      setClassStudents(allStds)
      setLowAttendanceStudents(lowStdsAccum)
      
      
      
      
      setTotalStudents(totalCount)
    } catch (err) {
      console.error(err)
      if (mounted.current && requestId === classRequestIdRef.current) {
        toast.error('Failed to load class data')
      }
    } finally {
      if (mounted.current && requestId === classRequestIdRef.current) {
        setClassLoading(false)
      }
    }
  }, [appUser, selectedBranch])

  useEffect(() => {
    if (!appUser) return
    if (adminBranches.length > 0 && (!selectedBranch || !adminBranches.includes(selectedBranch))) {
      setSelectedBranch(adminBranches[0])
    }
  }, [appUser, adminBranches, selectedBranch])

  useEffect(() => {
    if (!adminDeptCode) return
    const today = todayString()
    const unsub = subscribeAdminRequests(adminDeptCode, today, reqs => {
      setAdminRequests(reqs as AdjustmentRequest[])
    })
    return () => unsub()
  }, [adminDeptCode])

  const effectiveYearFilter:   YearFilter   = isAsAdmin ? 'all' : yearFilter
  const effectiveBranchFilter: BranchFilter =
    (isAsAdmin && activeTab === 'teachers') ? 'all' : branchFilter

  useEffect(() => {
    if (appUser?.role !== 'admin') return
    const mounted = { current: true }
    fetchManagementData(mounted)
    return () => { mounted.current = false }
  }, [appUser, fetchManagementData])

  useEffect(() => {
    if (!appUser || !selectedBranch) return
    const mounted = { current: true }
    fetchClassData(mounted)
    return () => { mounted.current = false }
  }, [appUser, selectedBranch, fetchClassData])


  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search])
  const deferredSearch   = useDeferredValue(normalizedSearch)

  const filteredTeachers = useMemo(() => teachers.filter(t => {
    const matchSearch = t.displayName.toLowerCase().includes(deferredSearch) || t.teacherId.toLowerCase().includes(deferredSearch)
    const matchBranch = effectiveBranchFilter === 'all' || isAsAdmin || t.departmentCodes.includes(effectiveBranchFilter)
    return matchSearch && matchBranch
  }), [teachers, deferredSearch, effectiveBranchFilter, isAsAdmin])

  const filteredStudents = useMemo(() => {
    const sems = YEAR_SEMS[effectiveYearFilter]
    return students
      .filter(s => sems.includes(s.semester ?? -1))
      .filter(s => {
        const matchCode = TRADE_TO_CODE[s.trade ?? ''] ?? null
        if (isCseAdmin || isAsAdmin) return effectiveBranchFilter === 'all' || matchCode === effectiveBranchFilter
        return matchCode === adminDeptCode
      })
      .filter(s =>
        s.displayName?.toLowerCase().includes(deferredSearch) ||
        s.rollNumber?.toLowerCase().includes(deferredSearch)
      )
  }, [students, effectiveYearFilter, effectiveBranchFilter, isCseAdmin, isAsAdmin, adminDeptCode, deferredSearch])

  const sortedFilteredStudents = useMemo(
    () => [...filteredStudents].sort((a, b) => rollCollator.compare(a.rollNumber ?? '', b.rollNumber ?? '')),
    [filteredStudents, rollCollator]
  )

  const groupedStudents = useMemo(() => sortedFilteredStudents.reduce((acc, s) => {
    const key = `${s.trade}::${s.semester}::${s.section}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {} as Record<string, StudentUser[]>), [sortedFilteredStudents])

  const sortedGroupedStudents = useMemo(
    () => Object.entries(groupedStudents).sort(),
    [groupedStudents]
  )

  const formattedToday = formatDate(new Date())

  if (loading || !appUser) return <Loading fullScreen />

  const uniqueTeacherCount = teachers.length
  const multibranchCount   = teachers.filter(t => t.departmentCodes.length > 1).length

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>

      <Sidebar links={sidebarLinks} portalName="Admin" />

      <div className="flex-1 flex flex-col min-w-0">

        <Navbar portalName="Admin" links={navLinks} hideThemeToggle />

        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {selectedTeacher && <TeacherDrawer teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />}

          {/* ── TAB BAR ───────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                {appUser.displayName}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {resolvedBranch ? BRANCH_TRADE[resolvedBranch] : adminDept} · {formattedToday}
              </p>
            </div>
            <ThemeToggle showColorTheme />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
  <div role="tablist" aria-label="Dashboard sections" className="flex p-1 rounded-xl gap-1" style={{ background: 'var(--color-surface-2)' }}>
    {([
      { key: 'overview',     label: 'My Classes',   icon: <HiOutlineViewGrid size={15}/> },
      { key: 'teachers',     label: 'Teachers',     icon: <HiOutlineAcademicCap size={15}/> },
      { key: 'students',     label: 'Students',     icon: <HiOutlineUsers size={15}/> },
      { key: 'adjustments',  label: 'Adjustments',  icon: <HiOutlineRefresh size={15}/> },
    ] as const).map(tab => (
      <button
        key={tab.key}
        role="tab"
        aria-selected={activeTab === tab.key}
        onClick={() => { setActiveTab(tab.key); setSearch('') }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
          color:      activeTab === tab.key ? 'white' : 'var(--color-text-muted)',
        }}>
        {tab.icon} {tab.label}
      </button>
    ))}
  </div>
</div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              
               
{/* ── STAT CARDS (clickable) ─────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
  {([
  {
    label: 'Total Students',
    value: totalStudents,
    color: '#2563eb',
    icon: <HiOutlineUsers size={18} />,
    onClick: () => setActiveTab('students'),
  },
  {
    label: "Today's Periods",
    value: todayPeriods.length,
    color: '#8b5cf6',
    icon: <HiOutlineClock size={18} />,
     onClick: () => document.getElementById('todays-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  },
  {
    label: 'Adjustments',
    value: adminRequests.length,
    color: '#10b981',
    icon: <HiOutlineRefresh size={18} />,
    onClick: () => setActiveTab('adjustments'),
  },
  {
    label: 'Low Attendance',
    value: lowAttendanceStudents.length,
    color: '#ef4444',
    icon: <HiOutlineExclamationCircle size={18} />,
    onClick: () => setShowLowAttendance(true),
  },
] as const) .map(card => (
  <div
    key={card.label}
    onClick={card.onClick ?? undefined}
    className="card p-4 flex items-center gap-3"
    style={{
      borderLeft: `4px solid ${card.color}`,
      cursor: card.onClick ? 'pointer' : 'default',
    }}>
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${card.color}20`, color: card.color }}>
      {card.icon}
    </div>
    <div>
      <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{card.value}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
    </div>
  </div>
))}
              </div>

              {/* Today's Schedule */}
            {/* Today's Schedule */}
<div className="card p-5" id="todays-schedule">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="section-title">Today&apos;s Schedule</h2>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {todayPeriods.length} period{todayPeriods.length !== 1 ? 's' : ''} · {formattedToday}
      </p>
    </div>
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
      <Link href="/teacher/setup?returnTo=/admin/dashboard" className="text-sm mt-1 block" style={{ color: 'var(--color-primary)' }}>
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
              <div className="flex items-center gap-3 flex-wrap">
                {canFilterBranches && !isAsAdmin && (
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <HiOutlineFilter size={14} className="ml-2" style={{ color: 'var(--color-text-muted)' }} />
                    {CSE_BRANCH_FILTERS.map(b => {
                      const style = b === 'all' ? null : getBranchStyle(b)
                      return (
                        <button key={b} onClick={() => setBranchFilter(b)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: branchFilter === b
                              ? (b === 'all' ? 'var(--color-primary)' : style?.bg)
                              : 'transparent',
                            color: branchFilter === b ? 'white' : 'var(--color-text-muted)',
                          }}>
                          {b === 'all' ? 'All Branches' : b}
                        </button>
                      )
                    })}
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
                    {effectiveBranchFilter !== 'all' ? ` in ${effectiveBranchFilter}` : ` in ${adminDept}`}
                  </p>
                  {multibranchCount > 0 && (() => {
                    const style = getBranchStyle('CSE')
                    return (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: style.bg, color: style.text }}>
                        {multibranchCount} handle both branches
                      </span>
                    )
                  })()}
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
                          <tr key={teacher.teacherId}
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
                                {teacher.departmentCodes.map(code => {
                                  const style = getBranchStyle(code)
                                  return (
                                    <span key={code} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                      style={{ background: style.bg, color: style.text }}>
                                      {code}
                                    </span>
                                  )
                                })}
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
              <div className="flex items-center gap-3 flex-wrap">
                {canFilterBranches && (
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <HiOutlineFilter size={14} className="ml-2" style={{ color: 'var(--color-text-muted)' }} />
                    {(
                      isAsAdmin
                        ? (['all', ...FIRST_YEAR_BRANCHES] as BranchFilter[])
                        : CSE_BRANCH_FILTERS
                    ).map(b => {
                      const style = b === 'all' ? null : getBranchStyle(b)
                      return (
                        <button key={b} onClick={() => setBranchFilter(b)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: branchFilter === b
                              ? (b === 'all' ? 'var(--color-primary)' : style?.bg)
                              : 'transparent',
                            color: branchFilter === b ? 'white' : 'var(--color-text-muted)',
                          }}>
                          {b === 'all' ? 'All Branches' : b}
                        </button>
                      )
                    })}
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

              {((!isAsAdmin && (effectiveYearFilter !== 'all' || effectiveBranchFilter !== 'all')) || (isAsAdmin && effectiveBranchFilter !== 'all')) && (
                <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  Showing
                  {effectiveBranchFilter !== 'all' && <strong style={{ color: 'var(--color-text)' }}>{effectiveBranchFilter}</strong>}
                  {!isAsAdmin && effectiveYearFilter !== 'all' && <strong style={{ color: 'var(--color-text)' }}>{effectiveYearFilter} Year</strong>}
                  students
                  <span className="ml-auto">{filteredStudents.length} students</span>
                </div>
              )}

              {loadingData ? (
                <div className="card p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="card p-8 text-center"><p style={{ color: 'var(--color-text-muted)' }}>No students found.</p></div>
              ) : (
                sortedGroupedStudents.map(([group, grpStudents]) => {
                  const [trade, sem, sec] = group.split('::')
                  const displayLabel = `${trade} — Sem ${sem} — Sec ${sec}`
                  return (
                    <div key={group} className="card overflow-hidden">
                      <div className="px-5 py-3 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{displayLabel}</p>
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
                            {grpStudents.map(student => {
                              const avatarStyle = getBranchStyle(TRADE_TO_CODE[student.trade ?? ''] ?? '')
                              return (
                                <tr key={student.uid} className="border-b hover:opacity-90" style={{ borderColor: 'var(--color-border)' }}>
                                  <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                                    {student.rollNumber}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: avatarStyle.text }}>
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
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        
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
                const matched = classStudents.find(s => s.uid === student.studentId || s.rollNumber === student.rollNumber)
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

{showDirectForm && appUser && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.5)' }}
    onClick={() => setShowDirectForm(false)}
  >
    <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
      <AdminDirectRequestForm
        adminId={appUser.uid}
        adminName={appUser.displayName}
        adminDeptCode={adminDeptCode}
        onCancel={() => setShowDirectForm(false)}
        onSuccess={() => setShowDirectForm(false)}
      />
    </div>
  </div>
)}

{/* ── ADJUSTMENTS TAB ───────────────────────────────────────────── */}
{activeTab === 'adjustments' && (
  <AdminAdjustmentsPanel
    adminId={appUser.uid}
    adminName={appUser.displayName}
    adminDeptCode={adminDeptCode}
  />
)}
</main>
</div>
</div>
)
}