'use client'
 //AttendanceHistoryTable.tsx
import { useState } from 'react'
import type { AttendanceRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import { HiOutlineSearch, HiOutlineCalendar } from 'react-icons/hi'

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[]
  studentId: string
  showSubject?: boolean
}

export default function AttendanceHistoryTable({ records, studentId, showSubject = true }: AttendanceHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const filtered = records.filter(r => {
    const entry = r.students.find(s => s.studentId === studentId)
    if (!entry) return false
    const matchStatus = statusFilter === 'all' || entry.status === statusFilter
    const matchSearch = r.subjectName.toLowerCase().includes(search.toLowerCase()) ||
                        r.date.includes(search)
    return matchStatus && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b flex flex-wrap gap-3 items-center" style={{ borderColor: 'var(--color-border)' }}>
        <div className="relative flex-1 min-w-40">
          <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            className="input pl-9 py-2"
            placeholder="Search subject or date..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
          {['all', 'present', 'absent', 'late'].map(s => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all capitalize"
              style={{
                background: statusFilter === s ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === s ? 'white' : 'var(--color-text-muted)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-2)' }}>
              <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1.5"><HiOutlineCalendar size={13} />Date</span>
              </th>
              {showSubject && (
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Subject</th>
              )}
              <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={showSubject ? 3 : 2} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
                  No records found
                </td>
              </tr>
            ) : paginated.map(record => {
              const entry = record.students.find(s => s.studentId === studentId)
              if (!entry) return null
              return (
                <tr key={record.id} className="hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--color-surface)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                    {formatDate(record.date)}
                  </td>
                  {showSubject && (
                    <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                      {record.subjectName}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <span className={`badge-${entry.status}`}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: p === page ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: p === page ? 'white' : 'var(--color-text)',
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
