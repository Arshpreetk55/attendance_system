'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudentsBySection, getStudentsByTrade, addStudent, removeStudent, getAllTrades, getAvailableSemesters } from '@/lib/db'
import type { TeacherUser, StudentUser, Trade, AppUser } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import Modal from '@/components/ui/Modal'
import { SECTIONS, getSemesterLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  HiOutlineUserAdd, HiOutlineTrash, HiOutlineSearch,
  HiOutlineClipboardCheck, HiOutlineUsers, HiOutlineChartBar,
  HiOutlineCalendar, HiOutlineDocumentReport,
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

function getTeacherBranches(user: AppUser | null): Branch[] {
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return []
  const teacher = user as TeacherUser | import('@/types').AdminUser
  const codes: string[] = teacher.departmentCodes ?? [teacher.departmentCode ?? '']
  const teacherDeptCode = teacher.departmentCode

  if (teacherDeptCode === 'AS') {
    return [...FIRST_YEAR_BRANCHES]
  }

  const valid = codes.filter((c): c is Branch => FIRST_YEAR_BRANCHES.includes(c as Branch))
  if (valid.includes('CSE')) {
    return ['CSE', 'IT']
  }
  return Array.from(new Set(valid))
}

function getAllowedTrades(user: AppUser | null): string[] {
  return getTeacherBranches(user).map(code => BRANCH_TRADE[code])
}




function StudentsPage() {

  const { appUser, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const teacher = appUser as TeacherUser | null
  const isAdmin = appUser?.role === 'admin'

  const sidebarLinks = [
    { href: isAdmin ? '/admin/dashboard' : '/teacher/dashboard', label: 'Dashboard', icon: isAdmin ? <HiOutlineViewGrid size={18} /> : <HiOutlineChartBar size={18} /> },
    { href: '/teacher/mark-attendance', label: 'Mark Attendance', icon: <HiOutlineClipboardCheck size={18} /> },
    { href: '/teacher/students', label: 'Students', icon: <HiOutlineUsers size={18} /> },
    { href: '/teacher/timetable', label: 'Timetable', icon: <HiOutlineCalendar size={18} /> },
    { href: '/teacher/reports', label: 'Reports', icon: <HiOutlineDocumentReport size={18} /> },
  ]

  const navLinks = [
    { href: isAdmin ? '/admin/dashboard' : '/teacher/dashboard', label: 'Dashboard' },
    { href: '/teacher/mark-attendance', label: 'Attendance' },
    { href: '/teacher/students', label: 'Students' },
    { href: '/teacher/timetable', label: 'Timetable' },
    { href: '/teacher/reports', label: 'Reports' },
  ]

  const [trades, setTrades] = useState<Trade[]>([])
  const [students, setStudents] = useState<StudentUser[]>([])
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentUser | null>(null)
  const [sectionFilter, setSectionFilter] = useState({ trade: '', semester: '', section: '' })
  const [dataLoading, setDataLoading] = useState(false)
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([])

  const isAsTeacher = !!appUser && appUser.role !== 'student' && appUser.departmentCode === 'AS'
  const [newStudent, setNewStudent] = useState({
    displayName: '', rollNumber: '', email: '',
    trade: '', semester: '', section: '', parentEmail: '',
  })

  useEffect(() => {
    if (!sectionFilter.trade) { setAvailableSemesters([]); return }
    getAvailableSemesters(sectionFilter.trade).then(setAvailableSemesters)
  }, [sectionFilter.trade])

  useEffect(() => {
    if (!loading && !appUser) {
      router.push('/teacher/login')
      return
    }

    const allowed = getAllowedTrades(appUser)
    getAllTrades().then(allTrades => {
      const filtered = allowed.length > 0
        ? allTrades.filter(t => allowed.includes(t.name))
        : allTrades
      setTrades(filtered)
    })
  }, [loading, appUser, router])

  useEffect(() => {
    const trade = searchParams?.get('trade') ?? ''
    const semester = searchParams?.get('semester') ?? ''
    const section = searchParams?.get('section') ?? ''
    if (!trade) return
    setSectionFilter(prev => ({
      trade: trade || prev.trade,
      semester: semester || prev.semester,
      section: section || prev.section,
    }))
  }, [searchParams])

  useEffect(() => {
    const allowed = getAllowedTrades(appUser)
    if (allowed.length === 1 && !sectionFilter.trade) {
      setSectionFilter(prev => ({ ...prev, trade: allowed[0] }))
    }
  }, [appUser, sectionFilter.trade])

  useEffect(() => {
    if (!sectionFilter.trade) return
    setDataLoading(true)
    const fetchStudents = sectionFilter.semester && sectionFilter.section
      ? getStudentsBySection(sectionFilter.trade, parseInt(sectionFilter.semester), sectionFilter.section)
      : getStudentsByTrade(sectionFilter.trade)

    fetchStudents
      .then(data => {
        data.sort((a, b) => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a.rollNumber, b.rollNumber))
        setStudents(data)
      })
      .finally(() => setDataLoading(false))
  }, [sectionFilter])

  const handleAddStudent = async () => {
    if (!newStudent.displayName || !newStudent.rollNumber || !newStudent.trade || !newStudent.semester || !newStudent.section) {
      toast.error('Fill in all required fields')
      return
    }
    if (!teacher) return
    try {
      const email = `${newStudent.rollNumber.toLowerCase()}@${newStudent.trade.replace(/\s/g, '').toLowerCase()}-s${newStudent.semester}-${newStudent.section.toLowerCase()}.attendx.edu`
      await addStudent({
        email,
        displayName: newStudent.displayName,
        role: 'student',
        rollNumber: newStudent.rollNumber,
        trade: newStudent.trade,
        semester: parseInt(newStudent.semester),
        section: newStudent.section,
        tutorId: teacher.uid,
        parentEmail: newStudent.parentEmail,
        theme: 'light',
        colorTheme: 'blue',
      })
      toast.success('Student added successfully!')
      setAddModal(false)
      setNewStudent({ displayName: '', rollNumber: '', email: '', trade: '', semester: '', section: '', parentEmail: '' })
      if (sectionFilter.trade === newStudent.trade && sectionFilter.semester === newStudent.semester && sectionFilter.section === newStudent.section) {
        getStudentsBySection(newStudent.trade, parseInt(newStudent.semester), newStudent.section).then(setStudents)
      }
    } catch (err) {
      toast.error('Failed to add student')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await removeStudent(deleteTarget.uid)
      setStudents(prev => prev.filter(s => s.uid !== deleteTarget.uid))
      toast.success('Student removed')
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Failed to remove student')
    }
  }

  const selectedTrade = trades.find(t => t.name === sectionFilter.trade)
  const availableSections = selectedTrade?.sections ?? SECTIONS

  const rollCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

  const filteredStudents = [...students]
    .sort((a, b) => rollCollator.compare(a.rollNumber, b.rollNumber))
    .filter(s =>
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
    )

  if (loading || !teacher) return <Loading fullScreen />

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName={isAdmin ? 'Admin' : 'Teacher'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName={isAdmin ? 'Admin' : 'Teacher'} links={navLinks} />
        <main className="flex-1 p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="page-title">Students</h1>
            <button onClick={() => setAddModal(true)} className="btn-primary">
              <HiOutlineUserAdd size={16} /> Add Student
            </button>
          </div>

          {/* Section Filter */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Trade</label>
                <select className="input" value={sectionFilter.trade}
                  onChange={e => setSectionFilter(p => ({ ...p, trade: e.target.value, semester: '', section: '' }))}>
                  <option value="">Select Trade</option>
                  {trades.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select className="input" value={sectionFilter.semester}
                  onChange={e => setSectionFilter(p => ({ ...p, semester: e.target.value }))}
                  disabled={!sectionFilter.trade}>
                  <option value="">Select</option>
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>{getSemesterLabel(s, sectionFilter.trade)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select className="input" value={sectionFilter.section}
                  onChange={e => setSectionFilter(p => ({ ...p, section: e.target.value }))}
                  disabled={!sectionFilter.semester}>
                  <option value="">Select</option>
                  {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Students List */}
          {sectionFilter.trade && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="relative flex-1 max-w-xs">
                  <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input className="input pl-9 py-2 text-sm" placeholder="Search name or roll..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{filteredStudents.length} students</span>
              </div>

              {dataLoading ? <Loading text="Loading..." className="py-12" /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-2)' }}>
                      {['#', 'Name', 'Roll No.', 'Section', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No students found</td></tr>
                    ) : filteredStudents.map((s, i) => (
                      <tr key={s.uid} style={{ background: 'var(--color-surface)' }} className="hover:opacity-80">
                        <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--color-primary)' }}>
                              {s.displayName.charAt(0)}
                            </div>
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{s.displayName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-sm" style={{ color: 'var(--color-text)' }}>{s.rollNumber}</td>
                        <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>{s.section}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => setDeleteTarget(s)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <HiOutlineTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Student Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Student" size="md">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Student Name" value={newStudent.displayName}
              onChange={e => setNewStudent(p => ({ ...p, displayName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Roll Number *</label>
            <input className="input font-mono" placeholder="CS-101" value={newStudent.rollNumber}
              onChange={e => setNewStudent(p => ({ ...p, rollNumber: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Trade *</label>
              <select className="input" value={newStudent.trade} onChange={e => setNewStudent(p => ({ ...p, trade: e.target.value }))}>
                <option value="">Select</option>
                {trades.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester *</label>
              <select className="input" value={newStudent.semester} onChange={e => setNewStudent(p => ({ ...p, semester: e.target.value }))}>
                <option value="">Sem</option>
                {[1,2,3,4,5,6,...(newStudent.trade === 'Automobile Engineering' ? [7] : [])].map(s => (
                  <option key={s} value={s}>{getSemesterLabel(s, newStudent.trade)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Section *</label>
              <select className="input" value={newStudent.section} onChange={e => setNewStudent(p => ({ ...p, section: e.target.value }))}>
                <option value="">Sec</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Parent Email (for alerts)</label>
            <input className="input" type="email" placeholder="parent@email.com" value={newStudent.parentEmail}
              onChange={e => setNewStudent(p => ({ ...p, parentEmail: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddStudent} className="btn-primary flex-1">Add Student</button>
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Student" size="sm">
        <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>
          Are you sure you want to remove <strong>{deleteTarget?.displayName}</strong>? This will also delete their attendance records.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn-danger flex-1">Yes, Remove</button>
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}

export default function StudentsPageWrapper() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <StudentsPage />
    </Suspense>
  )
}