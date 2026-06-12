'use client'

import { getPeriodsForTeacherOnDate } from '@/lib/db' 
import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { TeacherUser, AdminUser, Period } from '@/types'

import {
  createAdjustmentRequest,
  createAdminAdjustmentRequest,
  getAvailableSubstitutes,
} from '@/lib/db/adjustments'

// ─── Inline helpers ───────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ step, active, done }: { step: number; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={{
          background: done
            ? '#16a34a'
            : active
              ? 'var(--color-primary)'
              : 'var(--color-surface-2)',
          color: done || active ? 'white' : 'var(--color-text-muted)',
        }}
      >
        {done ? <HiOutlineCheckCircle size={14} /> : step}
      </div>
    </div>
  )
}

export function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
          <StepDot step={i + 1} active={current === i + 1} done={current > i + 1} />
          {i < total - 1 && (
            <div
              className="flex-1 h-0.5 rounded-full transition-all"
              style={{ background: current > i + 1 ? '#16a34a' : 'var(--color-border)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────

interface SubstituteOption {
  uid: string
  displayName: string
  email: string
  teacherId: string
  departmentCode: string
  department: string
  matchScore: number
}

interface RequestFormProps {
  teacher: TeacherUser | AdminUser
  onSuccess?: (requestId: string) => void
  onCancel?: () => void
}


// ─── Helpers ────────────────────────────────────────────────────────────

function getUpcomingWeekdays(count: number): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = []
  const now = new Date()           // fixed reference — never mutated
  const cursor = new Date()        // loop cursor — mutated each iteration
  const LAST_PERIOD_HOUR = 15

  while (result.length < count) {
    const dayOfWeek = cursor.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isToday = toDateString(cursor) === toDateString(now)
    const afterCutoff = isToday && now.getHours() >= LAST_PERIOD_HOUR

    if (!isWeekend && !afterCutoff) {
      const label = isToday
        ? `Today · ${cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
        : cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      result.push({ label, value: toDateString(cursor) })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

    

// ─── Main component ───────────────────────────────────────────────────────────
type WorkflowType = 'teacher-to-teacher' | 'teacher-to-admin'

export function RequestForm({ teacher, onSuccess, onCancel }: RequestFormProps) {
  const [step, setStep] = useState(1)
  

const [workflowType, setWorkflowType] =
  useState<WorkflowType>('teacher-to-teacher')

  // Step 1: date + period selection
  const [selectedDate, setSelectedDate]   = useState(toDateString(new Date()))
  const [periods, setPeriods]             = useState<Period[]>([])
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  // Step 2: substitute selection
  const [substitutes, setSubstitutes]         = useState<SubstituteOption[]>([])
  const [subsLoading, setSubsLoading]         = useState(false)
  const [subsError, setSubsError]             = useState<string | null>(null)
  const [subSearch, setSubSearch]             = useState('')
  const [selectedSub, setSelectedSub]         = useState<SubstituteOption | null>(null)

  // Step 3: confirm + submit
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)



  const upcomingDays = getUpcomingWeekdays(5)

  // ── Load periods for the selected date ────────────────────────────────────
  const loadPeriods = useCallback(async () => {
  setPeriodsLoading(true)
  setPeriods([])
  try {
    const all = await getPeriodsForTeacherOnDate(
      teacher.uid,
      selectedDate
      )

    if (all.length === 0) {
      toast('No classes scheduled on that day', {
         icon: 'ℹ️'
         })
    }

    setPeriods(all)
  } catch {
    toast.error('Failed to load your timetable')
  } finally {
    setPeriodsLoading(false)
  }
}, [teacher.uid, selectedDate])  

// The existing useEffect already re-runs when loadPeriods changes, so no
// changes needed there — periods reload automatically on date change.

// Returns periods for a teacher on a specific weekday.
// Timetables are stored by weekday (Mon–Fri), not by calendar date,
// so we map the date to its weekday name.



  useEffect(() => { loadPeriods() }, [loadPeriods])
  useEffect(() => {
  setSelectedPeriod(null)
}, [selectedDate])

  // ── Load substitutes once period is confirmed ─────────────────────────────
  const loadSubstitutes = useCallback(async () => {
    if (!selectedPeriod) return
    setSubsLoading(true)
    setSubsError(null)
    setSubstitutes([])
    setSelectedSub(null)
    try {
      const subs = await getAvailableSubstitutes({
        departmentCode: teacher.departmentCode ?? '',
        date:           selectedDate,
        periodId:       selectedPeriod.id,
        excludeUid:     teacher.uid,
        subject:        selectedPeriod.subjectName,
        subjectCode:    selectedPeriod.subjectCode ?? selectedPeriod.subjectName,
        semester:       selectedPeriod.semester,
        section:        selectedPeriod.section,
      })
      setSubstitutes(subs as SubstituteOption[])
      if (subs.length === 0) {
        setSubsError('No available teachers found for this period.')
      }
    } catch {
      setSubsError('Failed to load available teachers. Please try again.')
    } finally {
      setSubsLoading(false)
    }
  }, [selectedPeriod, selectedDate, teacher.departmentCode, teacher.uid])

  useEffect(() => {
  if (step === 2) loadSubstitutes()
}, [step, loadSubstitutes])

// Reset substitute-related state when switching workflow
useEffect(() => {
  if (workflowType === 'teacher-to-admin') {
    setSelectedSub(null)
    setSubSearch('')
    setSubstitutes([])
    setSubsError(null)
  }
}, [workflowType])

function getPeriodNumber(period: Period): number {
  return (
    period.periodNumber ??
    (parseInt(
      period.id.replace(/\D/g, ''),
      10
    ) ||
    0)
  )
}
  // ── Submit ────────────────────────────────────────────────────────────────
  
    async function handleSubmit() {
  if (!selectedPeriod) return
  setSubmitting(true)

  try {
    let id: string

    if (workflowType === 'teacher-to-admin') {
      id = await createAdminAdjustmentRequest({
        fromTeacher: {
          uid:            teacher.uid,
          name:           teacher.displayName,
          department:     teacher.department??'',
          departmentCode: teacher.departmentCode ?? '',
        },
        date:        selectedDate,
        period: {
          id:        selectedPeriod.id,
          number:    getPeriodNumber(selectedPeriod),
          startTime: selectedPeriod.startTime,
          endTime:   selectedPeriod.endTime,
        },
        subject:     selectedPeriod.subjectName,
        subjectCode: selectedPeriod.subjectCode ?? selectedPeriod.subjectName,
        semester:    selectedPeriod.semester,
        section:     selectedPeriod.section,
        room:        selectedPeriod.room ?? null,
      })
    } else {
      if (!selectedSub) {
        setSubmitting(false)
        return
      }
      id = await createAdjustmentRequest({
        fromTeacher: {
          uid:            teacher.uid,
          name:           teacher.displayName,
          department:     teacher.department??'',
          departmentCode: teacher.departmentCode ?? '',
        },
        toTeacher: {
          uid:  selectedSub.uid,
          name: selectedSub.displayName,
        },
        date:        selectedDate,
        period: {
          id:        selectedPeriod.id,
          number:    getPeriodNumber(selectedPeriod),
          startTime: selectedPeriod.startTime,
          endTime:   selectedPeriod.endTime,
        },
        subject:     selectedPeriod.subjectName,
        subjectCode: selectedPeriod.subjectCode ?? selectedPeriod.subjectName,
        semester:    selectedPeriod.semester,
        section:     selectedPeriod.section,
        room:        selectedPeriod.room ?? null,
      })
    }

    setSubmitted(true)
    onSuccess?.(id!)

  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'Failed to send request.'
    )
  } finally {
    setSubmitting(false)
  }
}
      


  // ─────────────────────────────────────────────────────────────────────────
  // Submitted / success view
  // ─────────────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="rounded-2xl border p-6 text-center space-y-3"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: '#16a34a20', color: '#16a34a' }}>
          <HiOutlineCheckCircle size={28} />
        </div>
        <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Request Sent!</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
  {workflowType === 'teacher-to-admin'
    ? 'Admin has been notified and will arrange coverage.'
    : `${selectedSub?.displayName} has been notified and will respond soon.`}
</p>
        <div className="p-3 rounded-xl text-xs text-left space-y-1"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          <p><strong style={{ color: 'var(--color-text)' }}>Subject:</strong> {selectedPeriod?.subjectName}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Date:</strong> {selectedDate}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Time:</strong> {selectedPeriod?.startTime}–{selectedPeriod?.endTime}</p>
          <p>
  <strong style={{ color: 'var(--color-text)' }}>
    {workflowType === 'teacher-to-admin'
      ? 'Assigned to:'
      : 'Substitute:'}
  </strong>{' '}
  {workflowType === 'teacher-to-admin'
    ? 'Administration'
    : selectedSub?.displayName}
</p>
        </div>
        <button
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          Done
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Form render
  // ─────────────────────────────────────────────────────────────────────────

  const filteredSubs = substitutes.filter(s =>
    s.displayName.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.teacherId.toLowerCase().includes(subSearch.toLowerCase())
  )

  return (
    <div className="rounded-2xl border space-y-0 overflow-hidden"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            Request Adjustment
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {
step === 1
  ? 'Choose date & period'
  : step === 2 && workflowType === 'teacher-to-teacher'
  ? 'Select substitute'
  : 'Confirm & send'
}
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}>
            <HiOutlineX size={18} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
       <StepBar
  current={
    workflowType === 'teacher-to-admin' && step === 3
      ? 2
      : step
  }
  total={
    workflowType === 'teacher-to-admin'
      ? 2
      : 3
  }
/>
        {/* ── STEP 1: Date + period ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">

  <label
    className="text-xs font-semibold uppercase tracking-wider"
    style={{
      color:'var(--color-text-muted)'
    }}
  >
    Request type
  </label>

  <div className="grid grid-cols-2 gap-2">

    {([
      {
        value:'teacher-to-teacher',
        label:'Ask a colleague',
        sub:'Pick a specific teacher'
      },
      {
        value:'teacher-to-admin',
        label:'Ask admin',
        sub:'Let admin arrange cover'
      }
    ] as const).map(opt => (

      <button
        key={opt.value}
        onClick={() => setWorkflowType(opt.value)}
        className="p-3 rounded-xl border text-left"
        style={{
          borderColor:
            workflowType === opt.value
              ? 'var(--color-primary)'
              : 'var(--color-border)',

          background:
            workflowType === opt.value
              ? 'var(--color-primary)10'
              : 'var(--color-surface-2)'
        }}
      >
        <p
          className="text-sm font-semibold"
          style={{
            color:
              workflowType === opt.value
                ? 'var(--color-primary)'
                : 'var(--color-text)'
          }}
        >
          {opt.label}
        </p>

        <p
          className="text-xs"
          style={{
            color:'var(--color-text-muted)'
          }}
        >
          {opt.sub}
        </p>
      </button>

    ))}
  </div>
</div>
            {/* Date picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>
                <HiOutlineCalendar size={12} className="inline mr-1" />
                Date
              </label>
              <div className="flex flex-wrap gap-2">
                {upcomingDays.map(d => (
                  <button key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      borderColor: selectedDate === d.value ? 'var(--color-primary)' : 'var(--color-border)',
                      background:  selectedDate === d.value ? 'var(--color-primary)' : 'transparent',
                      color:       selectedDate === d.value ? 'white' : 'var(--color-text-muted)',
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Period picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>
                <HiOutlineClock size={12} className="inline mr-1" />
                Period to reassign
              </label>

              {periodsLoading ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  Loading your schedule…
                </p>
              ) : periods.length === 0 ? (
                <div className="p-4 rounded-xl text-center text-sm"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  No periods found for today. Make sure your timetable is set up.
                </div>
              ) : (
                <div className="space-y-2">
                  {periods.map(period => {
                    const isSelected = selectedPeriod?.id === period.id
                    return (
                      <button key={period.id}
                        onClick={() => setSelectedPeriod(isSelected ? null : period)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                          background:  isSelected ? 'var(--color-primary)10' : 'var(--color-surface-2)',
                        }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                          style={{ background: isSelected ? 'var(--color-primary)' : 'var(--color-border)' }}>
                          P{period.id.replace(/\D/g, '') || '·'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {period.subjectName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {period.startTime}–{period.endTime} · Sem {period.semester}{period.section}
                            {period.room ? ` · ${period.room}` : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <HiOutlineCheckCircle size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button
  disabled={
    !selectedPeriod ||
    periodsLoading
  }
  onClick={() => setStep(workflowType === 'teacher-to-admin' ? 3 : 2)}

              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
  background:
    selectedPeriod && !periodsLoading
      ? 'var(--color-primary)'
      : 'var(--color-surface-2)',

  color:
    selectedPeriod && !periodsLoading
      ? 'white'
      : 'var(--color-text-muted)',

  cursor:
    selectedPeriod && !periodsLoading
      ? 'pointer'
      : 'not-allowed',
}}>
              {
  workflowType === 'teacher-to-admin'
    ? 'Next: Review →'
    : 'Next: Choose Substitute →'
}
            </button>
          </div>
        )}

        {/* ── STEP 2: Substitute selection ──────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Selected period reminder */}
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
              <HiOutlineClock size={14} />
              <span>
                <strong style={{ color: 'var(--color-text)' }}>{selectedPeriod?.subjectName}</strong>
                {' · '}{selectedPeriod?.startTime}–{selectedPeriod?.endTime}
                {' · '}Sem {selectedPeriod?.semester}{selectedPeriod?.section}
                {' · '}{selectedDate}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <HiOutlineSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                className="input pl-9 text-sm w-full"
              />
            </div>

            {/* Substitute list */}
            {subsLoading ? (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Finding available teachers…
              </p>
            ) : subsError ? (
              <div className="flex items-center gap-2 p-4 rounded-xl text-sm"
                style={{ background: '#ef444420', color: '#ef4444' }}>
                <HiOutlineExclamationCircle size={16} />
                {subsError}
              </div>
            ) : filteredSubs.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                No teachers match your search.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredSubs.map(sub => {
                  const isSelected = selectedSub?.uid === sub.uid
                  return (
                    <button key={sub.uid}
                      onClick={() => setSelectedSub(isSelected ? null : sub)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        background:  isSelected ? 'var(--color-primary)10' : 'var(--color-surface-2)',
                      }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: isSelected ? 'var(--color-primary)' : '#6b7280' }}>
                        {sub.displayName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {sub.displayName}
                          </p>
                          {sub.matchScore >= 2 && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-1"
                              style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                              Best match
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {sub.teacherId} · {sub.departmentCode}
                        </p>
                      </div>
                      {isSelected && (
                        <HiOutlineCheckCircle size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}>
                ← Back
              </button>
              <button
  disabled={!selectedSub}
  onClick={() => setStep(3)}

                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: selectedSub ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color:      selectedSub ? 'white' : 'var(--color-text-muted)',
                  cursor:     selectedSub ? 'pointer' : 'not-allowed',
                }}>
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ───────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Review your request
            </p>

            <div className="rounded-xl border divide-y overflow-hidden"
              style={{ borderColor: 'var(--color-border)' }}>
              {[
                { label: 'Your lecture', icon: <HiOutlineAcademicCap size={14} />,
                  value: `${selectedPeriod?.subjectName} · Sem ${selectedPeriod?.semester}${selectedPeriod?.section}` },
                { label: 'Date & time', icon: <HiOutlineClock size={14} />,
                  value: `${selectedDate} · ${selectedPeriod?.startTime}–${selectedPeriod?.endTime}` },
                {
  label: 'Requesting',
  icon: <HiOutlineUser size={14} />,
  value:
    workflowType === 'teacher-to-admin'
      ? 'Administration'
      : selectedSub?.displayName ?? '—'
},
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span className="ml-auto text-xs font-semibold text-right" style={{ color: 'var(--color-text)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <p
  className="text-xs"
  style={{ color: 'var(--color-text-muted)' }}
>
  {workflowType === 'teacher-to-admin' ? (
    <>
      A notification will be sent to
      <strong style={{ color:'var(--color-text)' }}>
        {' '}Administration
      </strong>.
    </>
  ) : (
    <>
      A notification will be sent to
      <strong style={{ color:'var(--color-text)' }}>
        {' '}{selectedSub?.displayName}
      </strong>.
      They can accept or decline.
    </>
  )}
</p>

            <div className="flex gap-2">
              <button
  onClick={() =>
    setStep(
      workflowType === 'teacher-to-admin'
        ? 1
        : 2
    )
  }
  className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
  style={{
    borderColor:'var(--color-border)',
    color:'var(--color-text-muted)',
    background:'transparent'
  }}
>
  ← Back
</button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: submitting ? 'var(--color-surface-2)' : 'var(--color-primary)',
                  color:      submitting ? 'var(--color-text-muted)' : 'white',
                  cursor:     submitting ? 'not-allowed' : 'pointer',
                }}>
                {submitting ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


