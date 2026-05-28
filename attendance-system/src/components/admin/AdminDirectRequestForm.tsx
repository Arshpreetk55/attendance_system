'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { getPeriodsForTeacherOnDate, getTimetableByTeacher } from '@/lib/db'
import { createAdminDirectRequest, getAvailableSubstitutes } from '@/lib/db/adjustments'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import type { TeacherUser, Period } from '@/types'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getUpcomingWeekdays(count: number): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = []
  const now = new Date()
  const cursor = new Date()
  const LAST_PERIOD_HOUR = 15
  while (result.length < count) {
    const dayOfWeek = cursor.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isToday = toDateString(cursor) === toDateString(now)
    const afterCutoff = isToday && now.getHours() >= LAST_PERIOD_HOUR
    if (!isWeekend && !afterCutoff) {
      result.push({
        label: isToday
          ? `Today · ${cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
          : cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        value: toDateString(cursor),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function StepDot({ step, active, done }: { step: number; active: boolean; done: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
      style={{
        background: done ? '#16a34a' : active ? 'var(--color-primary)' : 'var(--color-surface-2)',
        color: done || active ? 'white' : 'var(--color-text-muted)',
      }}
    >
      {done ? <HiOutlineCheckCircle size={14} /> : step}
    </div>
  )
}

function StepBar({ current, total }: { current: number; total: number }) {
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

interface SubstituteOption extends TeacherUser {
  matchScore: number
  hasConflict: boolean
}

interface LectureOption {
  teacher: TeacherUser
  period: Period
}

interface AdminDirectRequestFormProps {
  adminId: string
  adminName: string
  adminDeptCode: string
  onSuccess?: (requestId: string) => void
  onCancel?: () => void
}

export default function AdminDirectRequestForm({
  adminId,
  adminName,
  adminDeptCode,
  onSuccess,
  onCancel,
}: AdminDirectRequestFormProps) {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))

  // Step 1: all lectures in dept for the selected date
  const [allTeachers, setAllTeachers] = useState<TeacherUser[]>([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [lectureOptions, setLectureOptions] = useState<LectureOption[]>([])
  const [lecturesLoading, setLecturesLoading] = useState(false)
  const [sourceTeacher, setSourceTeacher] = useState<TeacherUser | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  // Step 2: pick assignee
  const [substitutes, setSubstitutes] = useState<SubstituteOption[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [subsError, setSubsError] = useState<string | null>(null)
  const [subSearch, setSubSearch] = useState('')
  const [selectedSub, setSelectedSub] = useState<SubstituteOption | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const upcomingDays = useMemo(() => getUpcomingWeekdays(5), [])

  // ── Load all teachers in dept (excluding admin) ───────────────────────────
  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true)
    try {
      const snap = await getDocs(query(
        collection(db, 'users'),
        where('role', 'in', ['teacher', 'admin']),
        where('departmentCode', '==', adminDeptCode),
      ))
      const found = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as TeacherUser))
        .filter(t => t.uid !== adminId && t.displayName)
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
      setAllTeachers(found)
    } catch {
      toast.error('Failed to load teachers.')
    } finally {
      setTeachersLoading(false)
    }
  }, [adminDeptCode, adminId])

  // ── Load lectures for selected date from all teachers in department ─────
  const loadLectureOptions = useCallback(async () => {
  setLecturesLoading(true)
  setLectureOptions([])
  setSelectedPeriod(null)
  setSourceTeacher(null)

  try {
    // Only fetch admin's own periods for the selected date
    
      const adminSnap = await getDoc(doc(db, 'users', adminId))
     const adminTeacher = adminSnap.exists()
    ? { uid: adminId, ...adminSnap.data() } as TeacherUser
    : { uid: adminId, displayName: adminName } as TeacherUser
    const periods = await getPeriodsForTeacherOnDate(adminId, selectedDate)

    const flattened = periods
      .map(period => ({ teacher: adminTeacher, period }))
      .sort((a, b) => a.period.startTime.localeCompare(b.period.startTime))

    const unique: LectureOption[] = []
    const seen = new Set<string>()
    for (const option of flattened) {
      const key = `${option.period.subjectName.trim()}::${option.period.startTime.trim()}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(option)
      }
    }

    setLectureOptions(unique)
  } catch {
    toast.error('Failed to load lectures for this date.')
  } finally {
    setLecturesLoading(false)
  }
}, [adminId, adminName, selectedDate])
      

  // ── Load substitutes + check conflicts ────────────────────────────────────
  const loadSubstitutes = useCallback(async () => {
    if (!sourceTeacher || !selectedPeriod) return
    setSubsLoading(true)
    setSubsError(null)
    setSubstitutes([])
    setSelectedSub(null)
    try {
      const subs = await getAvailableSubstitutes({
        departmentCode: adminDeptCode,
        date: selectedDate,
        periodId: selectedPeriod.id,
        excludeUid: sourceTeacher.uid,
        subject: selectedPeriod.subjectName,
        subjectCode: selectedPeriod.subjectCode ?? selectedPeriod.subjectName,
        semester: selectedPeriod.semester,
        section: selectedPeriod.section,
      })

      // Check timetable conflicts for each candidate
      const withConflicts = await Promise.all(
        (subs as (TeacherUser & { matchScore: number })[]).map(async sub => {
          let hasConflict = false
          try {
            const tt = await getTimetableByTeacher(sub.uid)
            if (tt) {
              const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
              const dayName = days[new Date(`${selectedDate}T12:00:00`).getDay()]
              const daySchedule = tt.schedule.find(d => d.day === dayName)
              hasConflict = daySchedule?.periods.some(
                p => p.startTime === selectedPeriod.startTime
              ) ?? false
            }
          } catch { /* ignore */ }
          return { ...sub, hasConflict }
        })
      )

      setSubstitutes(withConflicts)
      if (withConflicts.length === 0) {
        setSubsError('No teachers available for this period.')
      }
    } catch {
      setSubsError('Failed to load available teachers.')
    } finally {
      setSubsLoading(false)
    }
  }, [adminDeptCode, selectedDate, selectedPeriod, sourceTeacher])

  useEffect(() => { loadTeachers() }, [loadTeachers])
 useEffect(() => { loadLectureOptions() }, [loadLectureOptions])
  useEffect(() => { if (step === 2) loadSubstitutes() }, [step, loadSubstitutes])

  function getPeriodNumber(period: Period): number {
    return period.periodNumber ?? (parseInt(period.id.replace(/\D/g, ''), 10) || 0)
  }

  async function handleSubmit() {
    if (!sourceTeacher || !selectedPeriod || !selectedSub) return
    setSubmitting(true)
    try {
      const id = await createAdminDirectRequest({
        adminId,
        adminName,
        fromTeacher: { uid: sourceTeacher.uid, name: sourceTeacher.displayName },
        toTeacher: { uid: selectedSub.uid, name: selectedSub.displayName },
        departmentCode: adminDeptCode,
        department: sourceTeacher.department ?? adminDeptCode,
        date: selectedDate,
        period: {
          id: selectedPeriod.id,
          number: getPeriodNumber(selectedPeriod),
          startTime: selectedPeriod.startTime,
          endTime: selectedPeriod.endTime,
        },
        subject: selectedPeriod.subjectName,
        subjectCode: selectedPeriod.subjectCode ?? selectedPeriod.subjectName,
        semester: selectedPeriod.semester,
        section: selectedPeriod.section,
        room: selectedPeriod.room ?? null,
      })
      setSubmitted(true)
      onSuccess?.(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create adjustment.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedLectureKey = selectedPeriod
  ? `${selectedPeriod.subjectName}-${selectedPeriod.startTime}`
  : ''

  const filteredSubs = substitutes.filter(s =>
    s.displayName.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.teacherId.toLowerCase().includes(subSearch.toLowerCase())
  )

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="rounded-2xl border p-6 text-center space-y-3"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: '#16a34a20', color: '#16a34a' }}>
          <HiOutlineCheckCircle size={28} />
        </div>
        <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Adjustment Created!</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {selectedSub?.displayName} has been assigned to handle this lecture.
        </p>
        <div className="p-3 rounded-xl text-xs text-left space-y-1.5"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          <p><strong style={{ color: 'var(--color-text)' }}>Subject:</strong> {selectedPeriod?.subjectName}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Date:</strong> {selectedDate}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Time:</strong> {selectedPeriod?.startTime}–{selectedPeriod?.endTime}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Original teacher:</strong> {sourceTeacher?.displayName}</p>
          <p><strong style={{ color: 'var(--color-text)' }}>Assigned to:</strong> {selectedSub?.displayName}</p>
        </div>
        <button onClick={onCancel} className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: 'white' }}>
          Done
        </button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            Create Direct Adjustment
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {step === 1
              ? 'Choose which lecture needs coverage and assign it to another teacher'
              : step === 2
              ? 'Select the teacher who will handle this lecture'
              : 'Review and confirm the assignment'}
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}>
            <HiOutlineX size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <StepBar current={step} total={3} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-5">

            {/* Date */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                <HiOutlineCalendar size={12} className="inline mr-1" /> Date
              </label>
              <div className="flex flex-wrap gap-2">
                {upcomingDays.map(d => (
                  <button key={d.value} type="button"
                    onClick={() => { setSelectedDate(d.value); setSelectedPeriod(null) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      borderColor: selectedDate === d.value ? 'var(--color-primary)' : 'var(--color-border)',
                      background: selectedDate === d.value ? 'var(--color-primary)' : 'transparent',
                      color: selectedDate === d.value ? 'white' : 'var(--color-text-muted)',
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lecture / duty to assign */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                <HiOutlineClock size={12} className="inline mr-1" /> Lecture / Duty to Assign
              </label>

              {teachersLoading || lecturesLoading ? (
                <div className="p-4 rounded-xl text-sm text-center"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  Loading schedule…
                </div>
              ) : lectureOptions.length === 0 ? (
                <div className="p-4 rounded-xl text-sm text-center"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  No lectures found for {selectedDate}.
                </div>
              ) : (
                <div>
                  <select
                    value={selectedLectureKey}
                    onChange={e => {
                      const selectedKey = e.target.value
                      const selectedItem = lectureOptions.find(({ period }) =>
  `${period.subjectName}-${period.startTime}` === selectedKey
)
                      if (selectedItem) {
                        setSelectedPeriod(selectedItem.period)
                        setSourceTeacher(selectedItem.teacher)
                      } else {
                        setSelectedPeriod(null)
                        setSourceTeacher(null)
                      }
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                    style={{
                      background: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}>
                    <option value="" disabled hidden>
                      Select a lecture
                    </option>
                    {lectureOptions.map(({ period }) => {
  const lectureKey = `${period.subjectName}-${period.startTime}`
  return (
    <option key={lectureKey} value={lectureKey}>
      {period.subjectName} – {period.startTime}–{period.endTime}
    </option>
  )
})}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Summary of selected lecture */}
            <div className="p-3 rounded-xl text-xs"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                {selectedPeriod?.subjectName}
              </p>
              <p>Sem {selectedPeriod?.semester}{selectedPeriod?.section} · {selectedPeriod?.startTime}–{selectedPeriod?.endTime} · {selectedDate}</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1"
                style={{ color: 'var(--color-text-muted)' }}>
                Assign To Teacher
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Select the teacher who will handle this lecture. Teachers with a conflict at this time are flagged.
              </p>

              <div className="relative mb-3">
                <HiOutlineSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input type="text" placeholder="Search by name or ID…"
                  value={subSearch} onChange={e => setSubSearch(e.target.value)}
                  className="input pl-9 text-sm w-full" />
              </div>

              {subsLoading ? (
                <div className="p-4 rounded-xl text-sm text-center"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  Checking teacher availability…
                </div>
              ) : subsError ? (
                <div className="p-4 rounded-xl text-sm flex items-center gap-2"
                  style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
                  <HiOutlineExclamationCircle size={16} /> {subsError}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredSubs.map(sub => {
                    const isSelected = selectedSub?.uid === sub.uid
                    return (
                      <button key={sub.uid} type="button"
                        onClick={() => setSelectedSub(isSelected ? null : sub)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                          background: isSelected ? 'var(--color-primary)10' : 'var(--color-surface-2)',
                        }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {sub.matchScore >= 2 && !sub.hasConflict && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                              Best match
                            </span>
                          )}
                          {sub.hasConflict && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: '#fef9c3', color: '#854d0e' }}>
                              Has class
                            </span>
                          )}
                          {isSelected && (
                            <HiOutlineCheckCircle size={16} style={{ color: 'var(--color-primary)' }} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border divide-y overflow-hidden"
              style={{ borderColor: 'var(--color-border)' }}>
              {[
                { label: 'Original teacher', value: sourceTeacher?.displayName ?? '—' },
                { label: 'Assigned to', value: selectedSub?.displayName ?? '—' },
                { label: 'Subject', value: selectedPeriod?.subjectName ?? '—' },
                { label: 'Date', value: selectedDate },
                { label: 'Time', value: `${selectedPeriod?.startTime}–${selectedPeriod?.endTime}` },
                { label: 'Section', value: `Sem ${selectedPeriod?.semester}${selectedPeriod?.section}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {selectedSub?.hasConflict && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>
                <HiOutlineExclamationCircle size={14} />
                {selectedSub.displayName} already has a class at this time. You can still proceed.
              </div>
            )}

          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 border-t bg-[var(--color-surface)] px-5 py-4"
        style={{ borderColor: 'var(--color-border)' }}>
        {step === 1 && (
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
              style={{ background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Cancel
            </button>
            <button type="button" disabled={!selectedPeriod} onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selectedPeriod ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: selectedPeriod ? 'white' : 'var(--color-text-muted)',
                cursor: selectedPeriod ? 'pointer' : 'not-allowed',
              }}>
              Next: Assign Teacher →
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
              style={{ background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              ← Back
            </button>
            <button type="button" disabled={!selectedSub} onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selectedSub ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: selectedSub ? 'white' : 'var(--color-text-muted)',
                cursor: selectedSub ? 'pointer' : 'not-allowed',
              }}>
              Next: Review →
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
              style={{ background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              ← Back
            </button>
            <button type="button" disabled={submitting} onClick={handleSubmit}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: submitting ? 'var(--color-surface-2)' : 'var(--color-primary)',
                color: submitting ? 'var(--color-text-muted)' : 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
              {submitting ? 'Saving…' : 'Confirm Assignment'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}