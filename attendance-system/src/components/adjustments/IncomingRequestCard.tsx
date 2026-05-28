'use client'

import { useState } from 'react'
import { respondToRequest } from '@/lib/db/adjustments'
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { AdjustmentRequest, TeacherUser } from '@/types'

interface IncomingRequestCardProps {
  request: AdjustmentRequest
  currentTeacher: TeacherUser
  /** Optional callback fired after a successful accept/reject */
  onResponded?: (requestId: string, response: 'accepted' | 'rejected') => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRequestDate(dateStr: string): string {
  const today     = new Date()
  const tomorrow  = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const toDateStr = (d: Date) => d.toISOString().split('T')[0]

  if (dateStr === toDateStr(today))    return 'Today'
  if (dateStr === toDateStr(tomorrow)) return 'Tomorrow'

  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  })
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: 'var(--color-primary)' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IncomingRequestCard({
  request,
  currentTeacher,
  onResponded,
}: IncomingRequestCardProps) {
  const [loading, setLoading]   = useState(false)
  const [decided, setDecided]   = useState<'accepted' | 'rejected' | null>(null)

  const isDecided = decided !== null

  async function respond(response: 'accepted' | 'rejected') {
    if (loading || isDecided) return
    setLoading(true)
    try {
      await respondToRequest(request.id, response)
      setDecided(response)
      onResponded?.(request.id, response)
      toast.success(
        response === 'accepted' ? '✅ Request accepted' : 'Request declined',
      )
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Decided state: show compact confirmation ──────────────────────────────
  if (isDecided) {
    return (
      <div
        className="rounded-xl border p-4 flex items-center gap-3 transition-all"
        style={{
          borderColor:  decided === 'accepted' ? '#16a34a40' : 'var(--color-border)',
          background:   decided === 'accepted' ? '#16a34a08' : 'var(--color-surface-2)',
          opacity: 0.75,
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: decided === 'accepted' ? '#16a34a20' : '#6b728020',
            color:      decided === 'accepted' ? '#16a34a'   : '#6b7280',
          }}
        >
          {decided === 'accepted' ? <HiOutlineCheck size={16} /> : <HiOutlineX size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {request.fromTeacherName}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {decided === 'accepted' ? 'Accepted' : 'Declined'} · Sem {request.semester}{request.section} · P{request.periodNumber}
          </p>
        </div>
        <span
          className="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
          style={{
            background: decided === 'accepted' ? '#16a34a20' : '#6b728020',
            color:      decided === 'accepted' ? '#16a34a'   : '#6b7280',
          }}
        >
          {decided === 'accepted' ? 'Accepted' : 'Declined'}
        </span>
      </div>
    )
  }

  // ── Default: full card ────────────────────────────────────────────────────
  return (
    <div
  className="rounded-xl p-4 space-y-3 transition-shadow hover:shadow-md"
  style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderLeft: '4px solid var(--color-primary)',
  }}
>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <InitialAvatar name={request.fromTeacherName} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
            {request.fromTeacherName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            wants you to handle their lecture
          </p>
        </div>

        {/* Date badge */}
        <span
          className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
        >
          {formatRequestDate(request.date)}
        </span>
      </div>

      {/* Detail chips */}
      <div className="flex flex-wrap gap-2">
        <Chip icon={<HiOutlineAcademicCap size={12} />}>
          {request.subject}
          {request.subjectCode ? ` (${request.subjectCode})` : ''}
        </Chip>

        <Chip icon={<HiOutlineClock size={12} />}>
          P{request.periodNumber} · {request.startTime}–{request.endTime}
        </Chip>

        <Chip icon={<HiOutlineCalendar size={12} />}>
          Sem {request.semester}{request.section}
          {request.room ? ` · ${request.room}` : ''}
        </Chip>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => respond('accepted')}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: loading ? 'var(--color-surface-2)' : 'var(--color-primary)',
            color:      loading ? 'var(--color-text-muted)' : 'white',
            cursor:     loading ? 'not-allowed' : 'pointer',
            opacity:    loading ? 0.7 : 1,
          }}
        >
          <HiOutlineCheck size={14} />
          {loading ? 'Saving…' : 'Accept'}
        </button>

        <button
          onClick={() => respond('rejected')}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
          style={{
            borderColor: 'var(--color-border)',
            color:       loading ? 'var(--color-text-muted)' : 'var(--color-text)',
            background:  'transparent',
            cursor:      loading ? 'not-allowed' : 'pointer',
            opacity:     loading ? 0.6 : 1,
          }}
        >
          <HiOutlineX size={14} />
          Decline
        </button>
      </div>
    </div>
  )
}

// ─── Chip sub-component ───────────────────────────────────────────────────────

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
    >
      {icon}
      {children}
    </span>
  )
}