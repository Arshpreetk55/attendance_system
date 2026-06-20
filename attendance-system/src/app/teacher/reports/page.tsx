'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  getStudentsBySection, getAllTrades, getAvailableSemesters,
} from '@/lib/db'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/db'
import type { TeacherUser, StudentUser, AttendanceRecord, Trade, AppUser } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import { exportAttendanceCSV, exportAttendanceExcel, exportToPDF } from '@/lib/export'
import { SECTIONS, getSemesterLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  HiOutlineDocumentReport, HiOutlineDownload, HiOutlineClipboardCheck,
  HiOutlineUsers, HiOutlineChartBar, HiOutlineCalendar,
  HiOutlineViewGrid,
} from 'react-icons/hi'

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

// ─── Per-student per-subject per-date summary row ─────────────────────────────
interface PreviewRow {
  date: string
  rollNumber: string
  studentName: string
  subject: string
  periodsPresent: number
  totalPeriods: number
  pct: number
}

function buildPreviewRows(records: AttendanceRecord[], students: StudentUser[]): PreviewRow[] {
  const rows: PreviewRow[] = []

  students.forEach(student => {
    const grouped = new Map<string, { date: string; subject: string; present: number; total: number }>()

    records.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (!entry) return

      const key = `${record.date}__${record.subjectId}`
      if (!grouped.has(key)) {
        grouped.set(key, { date: record.date, subject: record.subjectName, present: 0, total: 0 })
      }
      const g = grouped.get(key)!
      g.total++
      if (entry.status === 'present' || entry.status === 'late') g.present++
    })

    grouped.forEach(({ date, subject, present, total }) => {
      rows.push({
        date,
        rollNumber: student.rollNumber ?? '',
        studentName: student.displayName ?? '',
        subject,
        periodsPresent: present,
        totalPeriods: total,
        pct: total > 0 ? Math.round((present / total) * 100) : 0,
      })
    })
  })

  return rows.sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    if (d !== 0) return d
    return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
  })
}

function getTeacherBranches(user: AppUser | null): Branch[] {
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return []
  const teacher = user as TeacherUser | import('@/types').AdminUser
  const codes: string[] = teacher.departmentCodes ?? [teacher.departmentCode ?? '']
  const teacherDeptCode = teacher.departmentCode

  if (teacherDeptCode === 'AS') return [...FIRST_YEAR_BRANCHES]

  const valid = codes.filter((c): c is Branch => FIRST_YEAR_BRANCHES.includes(c as Branch))
  if (valid.includes('CSE')) return ['CSE', 'IT']
  return Array.from(new Set(valid))
}

function getAllowedTrades(user: AppUser | null): string[] {
  return getTeacherBranches(user).map(code => BRANCH_TRADE[code])
}

export default function ReportsPage() {
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

  const [trades, setTrades] = useState<Trade[]>([])
  const [filter, setFilter] = useState({ trade: '', semester: '', section: '', dateFrom: '', dateTo: '' })
  const [students, setStudents] = useState<StudentUser[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [fetching, setFetching] = useState(false)
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([])

  useEffect(() => {
    if (!filter.trade) { setAvailableSemesters([]); return }
    getAvailableSemesters(filter.trade).then(setAvailableSemesters)
  }, [filter.trade])

  useEffect(() => {
    if (!loading && !appUser) router.push('/teacher/login')
    getAllTrades().then(allTrades => {
      const allowed = getAllowedTrades(appUser)
      const filtered = allowed.length > 0
        ? allTrades.filter(t => allowed.includes(t.name))
        : allTrades
      setTrades(filtered)
    })
  }, [loading, appUser, router])

  const selectedTrade = trades.find(t => t.name === filter.trade)
  const availableSections = selectedTrade?.sections ?? SECTIONS

  // Build summarized preview rows — same logic as export
  const previewRows = useMemo(() => buildPreviewRows(records, students), [records, students])

  const fetchData = async () => {
    if (!filter.trade || !filter.semester || !filter.section) {
      toast.error('Select trade, semester and section')
      return
    }
    if (filter.dateFrom && filter.dateTo && filter.dateFrom > filter.dateTo) {
      toast.error('From date cannot be after To date')
      return
    }

    setFetching(true)
    try {
      const stds = await getStudentsBySection(filter.trade, parseInt(filter.semester), filter.section)
      setStudents(stds)

      const q = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('trade', '==', filter.trade),
        where('semester', '==', parseInt(filter.semester)),
        where('section', '==', filter.section),
      )
      const snap = await getDocs(q)
      const recs = snap.docs.map(d => {
        const data = d.data()
        const rawMarkedAt = data.markedAt
        const markedAt =
          rawMarkedAt && typeof rawMarkedAt.toDate === 'function'
            ? rawMarkedAt.toDate()
            : rawMarkedAt instanceof Date
              ? rawMarkedAt
              : undefined
        return { ...data, id: d.id, markedAt }
      }) as AttendanceRecord[]

      const filteredRecs = recs
        .filter(r => {
          if (filter.dateFrom && r.date < filter.dateFrom) return false
          if (filter.dateTo && r.date > filter.dateTo) return false
          return true
        })
        .sort((a, b) => b.date.localeCompare(a.date))

      setRecords(filteredRecs)
      toast.success(`Loaded ${filteredRecs.length} records for ${stds.length} students`)
    } catch (err) {
      console.error('Report fetch error:', err)
      toast.error(err instanceof Error ? `Failed to load: ${err.message}` : 'Failed to load data')
    } finally {
      setFetching(false)
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!records.length || !students.length) {
      toast.error('No data to export. Fetch data first.')
      return
    }
    const sectionName = `${filter.trade}-sem${filter.semester}-${filter.section}`
    try {
      if (format === 'csv') {
        exportAttendanceCSV(records, students)
        toast.success('CSV downloaded!')
      } else if (format === 'excel') {
        await exportAttendanceExcel(records, students, sectionName)
        toast.success('Excel downloaded!')
      } else {
        await exportToPDF(records, students, {
          trade: filter.trade, semester: parseInt(filter.semester), section: filter.section,
        })
        toast.success('PDF downloaded!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    }
  }

  if (loading || !teacher) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName={isAdmin ? 'Admin' : 'Teacher'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName={isAdmin ? 'Admin' : 'Teacher'} links={navLinks} />
        <main className="flex-1 p-4 sm:p-6 space-y-5">
          <h1 className="page-title">Attendance Reports</h1>

          {/* Filter Card */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Generate Report</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="label">Trade</label>
                <select className="input" value={filter.trade}
                  onChange={e => setFilter(p => ({ ...p, trade: e.target.value, semester: '', section: '' }))}>
                  <option value="">Select</option>
                  {trades.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select className="input" value={filter.semester}
                  onChange={e => setFilter(p => ({ ...p, semester: e.target.value }))}
                  disabled={!filter.trade}>
                  <option value="">Select</option>
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>{getSemesterLabel(s, filter.trade)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select className="input" value={filter.section}
                  onChange={e => setFilter(p => ({ ...p, section: e.target.value }))}
                  disabled={!filter.semester}>
                  <option value="">Select</option>
                  {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">From Date</label>
                <input type="date" className="input" value={filter.dateFrom}
                  onChange={e => setFilter(p => ({ ...p, dateFrom: e.target.value }))} />
              </div>
              <div>
                <label className="label">To Date</label>
                <input type="date" className="input" value={filter.dateTo}
                  onChange={e => setFilter(p => ({ ...p, dateTo: e.target.value }))} />
              </div>
            </div>
            <button onClick={fetchData} disabled={fetching} className="btn-primary mt-4">
              {fetching ? 'Fetching...' : 'Generate Report'}
            </button>
          </div>

          {/* Export Buttons */}
          {previewRows.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-1">Export Options</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                {previewRows.length} summarized rows · {students.length} students
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { format: 'csv'   as const, label: 'Download CSV',   icon: '📄', color: 'bg-green-50 text-green-700 border-green-200' },
                  { format: 'excel' as const, label: 'Download Excel', icon: '📊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { format: 'pdf'   as const, label: 'Download PDF',   icon: '📑', color: 'bg-red-50 text-red-700 border-red-200' },
                ].map(btn => (
                  <button key={btn.format} onClick={() => handleExport(btn.format)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:shadow-md ${btn.color}`}>
                    <span>{btn.icon}</span>
                    <HiOutlineDownload size={15} />
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table — matches export exactly */}
          {previewRows.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                <h2 className="section-title">Report Preview</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  One row per student · subject · date — periods counted correctly
                </p>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'var(--color-surface-2)' }}>
                    <tr>
                      {['Date', 'Roll No.', 'Student Name', 'Subject', 'Present', 'Total', '%'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {previewRows.map((r, i) => (
                      <tr key={i} style={{ background: 'var(--color-surface)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{r.date}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.rollNumber}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{r.studentName}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{r.subject}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{r.periodsPresent}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.totalPeriods}</td>
                        <td className="px-4 py-3 font-bold"
                          style={{ color: r.pct >= 75 ? '#16a34a' : '#dc2626' }}>
                          {r.pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}