'use client'

import { useState, useEffect, useMemo } from 'react'
import { subscribeAdminRequests, adminAssignSubstitute, adminCancelRequest, adminReassignSubstitute, getAvailableSubstitutes } from '@/lib/db/adjustments'
import AdminDirectRequestForm from '@/components/admin/AdminDirectRequestForm'
import { todayString } from '@/lib/utils'
import {
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineBan,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi'
import toast from 'react-hot-toast'

interface AdjustmentRequest {
  id: string
  fromTeacherId: string
  fromTeacherName: string
  toTeacherId: string | null
  toTeacherName: string | null
  date: string
  periodNumber: number
  startTime: string
  endTime: string
  subject: string
  subjectCode?: string
  semester: number
  section: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'admin-pending' | 'admin-assigned'
  workflowType: 'teacher-to-teacher' | 'teacher-to-admin' | 'admin-direct'
  assignedByAdminId: string | null
  periodId: string
  createdAt: any
}

interface SubstituteOption {
  uid: string
  displayName: string
  teacherId: string
  departmentCode: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  'pending':       { label: 'Pending',       bg: '#f5a62320', color: '#f59e0b' },
  'admin-pending': { label: 'Needs Admin',   bg: '#818cf820', color: '#6366f1' },
  'accepted':      { label: 'Accepted',      bg: '#10b98120', color: '#10b981' },
  'rejected':      { label: 'Rejected',      bg: '#ef444420', color: '#ef4444' },
  'cancelled':     { label: 'Cancelled',     bg: '#6b728020', color: '#6b7280' },
  'admin-assigned': { label: 'Assigned', bg: '#10b98120', color: '#10b981' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['cancelled']
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Assign modal ──────────────────────────────────────────────────────────────
function AssignModal({
  request,
  adminId,
  departmentCode,
  onClose,
}: {
  request: AdjustmentRequest
  adminId: string
  departmentCode: string
  onClose: () => void
}) {
  const [substitutes, setSubstitutes] = useState<SubstituteOption[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<SubstituteOption | null>(null)
  const [saving, setSaving]           = useState(false)
  const [requireConfirm, setRequireConfirm] = useState(false)

  useEffect(() => {
    getAvailableSubstitutes({
      departmentCode,
      date:       request.date,
      periodId:   request.periodId,
      excludeUid: request.fromTeacherId,
      subject:    request.subject,
      subjectCode: request.subjectCode ?? request.subject,
      semester:   request.semester,
      section:    request.section,
    }).then(subs => {
      setSubstitutes(subs as SubstituteOption[])
      setLoading(false)
    })
  }, [departmentCode, request])

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    try {
      const isReassign = !!request.toTeacherId

      if (isReassign) {
        await adminReassignSubstitute(
          request.id, adminId,
          { uid: selected.uid, name: selected.displayName },
          request.toTeacherId!,
          request.fromTeacherName,
          { number: request.periodNumber },
        )
      } else {
        await adminAssignSubstitute(
          request.id, adminId,
          { uid: selected.uid, name: selected.displayName },
          request.fromTeacherName,
          { number: request.periodNumber },
          requireConfirm,
        )
      }

      toast.success(`Assigned to ${selected.displayName}`)
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to assign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--color-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            {request.toTeacherId ? 'Reassign lecture' : 'Assign substitute'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {request.subject} · Sem {request.semester}{request.section} · P{request.periodNumber}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
            Loading available teachers…
          </p>
        ) : substitutes.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#ef4444' }}>
            No available teachers for this period.
          </p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {substitutes.map(sub => {
              const isSelected = selected?.uid === sub.uid
              return (
                <button key={sub.uid}
                  onClick={() => setSelected(isSelected ? null : sub)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    background:  isSelected ? 'var(--color-primary)10' : 'var(--color-surface-2)',
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: isSelected ? 'var(--color-primary)' : '#6b7280' }}>
                    {sub.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {sub.displayName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {sub.teacherId}
                    </p>
                  </div>
                  {isSelected && <HiOutlineCheckCircle size={16} style={{ color: 'var(--color-primary)' }} />}
                </button>
              )
            })}
          </div>
        )}

        {/* Require teacher confirmation toggle — only for unassigned requests */}
        {!request.toTeacherId && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requireConfirm}
              onChange={e => setRequireConfirm(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Require teacher to confirm (workflow B)
            </span>
          </label>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}>
            Cancel
          </button>
          <button
            disabled={!selected || saving}
            onClick={handleAssign}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: selected && !saving ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color:      selected && !saving ? 'white' : 'var(--color-text-muted)',
              cursor:     selected && !saving ? 'pointer' : 'not-allowed',
            }}>
            {saving ? 'Saving…' : request.toTeacherId ? 'Reassign' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AdminAdjustmentsPanel({
  adminId,
  adminName,
  adminDeptCode,
}: {
  adminId: string
  adminName: string
  adminDeptCode: string
}) {
  const [requests, setRequests]       = useState<AdjustmentRequest[]>([])
  const [loading, setLoading]         = useState(true)
  const [assignTarget, setAssignTarget] = useState<AdjustmentRequest | null>(null)
  const [showDirectForm, setShowDirectForm] = useState(false)
  const today = useMemo(() => todayString(), [])

  useEffect(() => {
    const unsub = subscribeAdminRequests(adminDeptCode, today, reqs => {
      setRequests(reqs as AdjustmentRequest[])
      setLoading(false)
    })
    return () => unsub()
  }, [adminDeptCode, today])

  async function handleCancel(req: AdjustmentRequest) {
    try {
      await adminCancelRequest(req.id, adminId)
      toast.success('Request cancelled')
    } catch {
      toast.error('Failed to cancel')
    }
  }

  // Stat counts
  const pending     = requests.filter(r => r.status === 'pending' || r.status === 'admin-pending').length
  const accepted    = requests.filter(r => r.status === 'accepted').length
  const unassigned  = requests.filter(r => r.status === 'admin-pending' && !r.toTeacherId).length

  return (
    <>
      {assignTarget && (
        <AssignModal
          request={assignTarget}
          adminId={adminId}
          departmentCode={adminDeptCode}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {showDirectForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDirectForm(false)}
        >
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <AdminDirectRequestForm
              adminId={adminId}
              adminName={adminName}
              adminDeptCode={adminDeptCode}
              onCancel={() => setShowDirectForm(false)}
              onSuccess={() => setShowDirectForm(false)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowDirectForm(true)}
            className="btn-primary py-2 text-xs flex items-center gap-2"
          >
            <HiOutlineRefresh size={14} /> Create Adjustment
          </button>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',    value: pending,    color: '#f59e0b' },
            { label: 'Accepted',   value: accepted,   color: '#10b981' },
            { label: 'Unassigned', value: unassigned, color: '#ef4444' },
          ].map(s => (
            <div
  key={s.label}
  className="card p-4"
  style={{
    borderLeft: `4px solid ${s.color}`
  }}
>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center gap-2"
            style={{ borderColor: 'var(--color-border)' }}>
            <HiOutlineRefresh size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="section-title">Today&apos;s Adjustments</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <HiOutlineCheckCircle size={32} className="mx-auto mb-2 opacity-40"
                style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No adjustments today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)' }}>
                    {['Absent', 'Assigned To', 'Lecture', 'Period', 'Type', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold"
                        style={{ color: 'var(--color-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>

                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                        {req.fromTeacherName}
                      </td>

                      <td className="px-4 py-3"
                        style={{ color: req.toTeacherName ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {req.toTeacherName ?? '—'}
                        {req.assignedByAdminId && (
                          <span className="ml-1 text-xs" style={{ color: '#6366f1' }}>(admin)</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{req.subject}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Sem {req.semester}{req.section}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        P{req.periodNumber}<br />{req.startTime}–{req.endTime}
                      </td>

                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {req.workflowType === 'teacher-to-admin'   ? 'Via Admin'    :
                         req.workflowType === 'admin-direct'       ? 'Admin Direct' :
                         'T → T'}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Assign / Reassign */}
                          {req.status !== 'cancelled' && req.status !== 'rejected' && (
                            <button
                              onClick={() => setAssignTarget(req)}
                              title={req.toTeacherId ? 'Reassign' : 'Assign substitute'}
                              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                              style={{ color: 'var(--color-primary)' }}>
                              {req.toTeacherId
                                ? <HiOutlineSwitchHorizontal size={16} />
                                : <HiOutlineUser size={16} />}
                            </button>
                          )}

                          {/* Cancel */}
                          {req.status !== 'cancelled' && req.status !== 'rejected' && (
                            <button
                              onClick={() => handleCancel(req)}
                              title="Cancel request"
                              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                              style={{ color: '#ef4444' }}>
                              <HiOutlineBan size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}