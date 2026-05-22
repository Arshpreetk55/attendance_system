'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { saveTimetable, getAllTrades, getSubjectsBySemester } from '@/lib/db'
import { getSemesterNumbers, DAYS_OF_WEEK, PERIODS } from '@/lib/utils'
import type { TeacherUser, DaySchedule, Period, Trade, Subject } from '@/types'
import Loading from '@/components/ui/Loading'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineTrash, HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlinePhotograph } from 'react-icons/hi'

type ClassType = 'lecture' | 'practical'

export default function TeacherSetupPage() {
  const { appUser, loading, changePassword, updateProfileInfo } = useAuth()
  const router = useRouter()
  const teacher = appUser as TeacherUser | null
  const fileRef = useRef<HTMLInputElement>(null)

  const [semesterType, setSemesterType] = useState<'odd' | 'even'>('odd')
  const [trades, setTrades] = useState<Trade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map(day => ({ day, periods: [] }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [classType, setClassType] = useState<ClassType>('lecture')
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    photoPreview: '',
  })

  const [newPeriod, setNewPeriod] = useState({
    day: 'Monday',
    periodFrom: 1,
    periodTo: 1,
    subjectId: '', trade: '', semester: '', section: '', room: '',
  })

  useEffect(() => {
    if (!loading && !appUser) router.push('/teacher/login')
    getAllTrades().then(setTrades)
  }, [loading, appUser, router])

  useEffect(() => {
    if (newPeriod.trade && newPeriod.semester) {
      getSubjectsBySemester(newPeriod.trade, parseInt(newPeriod.semester)).then(setSubjects)
    }
  }, [newPeriod.trade, newPeriod.semester])

  const handleTradeChange = (tradeName: string) => {
    const selected = trades.find(t => t.name === tradeName)
    const autoSection = classType === 'lecture'
      ? (selected?.sections ?? []).join(' & ')
      : ''
    setNewPeriod(p => ({ ...p, trade: tradeName, semester: '', subjectId: '', section: autoSection }))
  }

  const handleClassTypeChange = (type: ClassType) => {
    setClassType(type)
    const selected = trades.find(t => t.name === newPeriod.trade)
    if (type === 'lecture') {
      const autoSection = (selected?.sections ?? []).join(' & ')
      setNewPeriod(p => ({ ...p, section: autoSection, periodTo: p.periodFrom }))
    } else {
      setNewPeriod(p => ({ ...p, section: '' }))
    }
  }

  const semesters = getSemesterNumbers(semesterType)
  const selectedTrade = trades.find(t => t.name === newPeriod.trade)
  const tradeSections = selectedTrade?.sections ?? []

  const selectedPeriods = classType === 'practical'
    ? PERIODS.filter(p => p.number >= newPeriod.periodFrom && p.number <= newPeriod.periodTo)
    : PERIODS.filter(p => p.number === newPeriod.periodFrom)

  const periodCount = selectedPeriods.length

  const addPeriod = () => {
    if (!newPeriod.trade) { toast.error('Please select a trade'); return }
    if (!newPeriod.semester) { toast.error('Please select a semester'); return }
    if (!newPeriod.subjectId) { toast.error('Please select a subject'); return }
    if (classType === 'practical' && !newPeriod.section) {
      toast.error('Section is required for practical classes')
      return
    }

    const subject = subjects.find(s => s.id === newPeriod.subjectId)
    if (!subject) return

    const section = classType === 'lecture'
      ? (selectedTrade?.sections ?? []).join(' & ')
      : newPeriod.section

    const firstSlot = selectedPeriods[0]
    const lastSlot = selectedPeriods[selectedPeriods.length - 1]

    const period: Period = {
      id: `${newPeriod.day}-${firstSlot.startTime}-${Date.now()}`,
      startTime: firstSlot.startTime,
      endTime: lastSlot.endTime,
      subjectId: newPeriod.subjectId,
      subjectName: subject.name,
      trade: newPeriod.trade,
      semester: parseInt(newPeriod.semester),
      section,
      room: newPeriod.room,
      classType,
      practicalPeriods: classType === 'practical' ? periodCount : 1,
      periodNumber: newPeriod.periodFrom,
    } as any

    setSchedule(prev => prev.map(d => {
      if (d.day !== newPeriod.day) return d
      return { ...d, periods: [...d.periods, period].sort((a, b) => a.startTime.localeCompare(b.startTime)) }
    }))

    const msg = classType === 'practical' && periodCount > 1
      ? `Practical added (${periodCount} periods — counts as ${periodCount} in attendance)`
      : `${classType === 'lecture' ? 'Lecture' : 'Practical'} period added`
    toast.success(msg)
  }

  const removePeriod = (day: string, periodId: string) => {
    setSchedule(prev => prev.map(d => {
      if (d.day !== day) return d
      return { ...d, periods: d.periods.filter(p => p.id !== periodId) }
    }))
  }

  const handleSubmit = async () => {
    if (!teacher) return
    const hasAnyPeriod = schedule.some(d => d.periods.length > 0)
    if (!hasAnyPeriod) {
      toast.error('Add at least one period to your timetable')
      return
    }
    setSubmitting(true)
    try {
      await saveTimetable(teacher.uid, {
        teacherId: teacher.uid,
        semesterType,
        schedule,
        effectiveFrom: new Date(),
      })
      toast.success('Timetable saved successfully! ✓')
      setProfileForm(p => ({ ...p, displayName: teacher.displayName || '' }))
      setShowPasswordModal(true)
    } catch (err) {
      toast.error('Failed to save timetable')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfileForm(p => ({ ...p, photoPreview: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSavePassword = async () => {
    if (!profileForm.displayName.trim()) { toast.error('Please enter your name'); return }
    if (!profileForm.newPassword) { toast.error('Please set a new password'); return }
    if (profileForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (profileForm.newPassword !== profileForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (!profileForm.currentPassword) { toast.error('Enter your current (temporary) password'); return }

    setSavingProfile(true)
    try {
      await updateProfileInfo({
        displayName: profileForm.displayName,
        ...(profileForm.photoPreview ? { photoURL: profileForm.photoPreview } : {}),
      })
      await changePassword(profileForm.currentPassword, profileForm.newPassword)
      const { updateUser } = await import('@/lib/db')
      const uid = (await import('@/lib/firebase')).auth.currentUser?.uid
      if (uid) await updateUser(uid, { showProfileSetup: false } as any)
      toast.success('✅ Password changed successfully! Welcome to AttendX 🎉')
      setShowPasswordModal(false)
      setTimeout(() => router.push('/teacher/dashboard'), 500)
    } catch (err: any) {
      const msg = err?.code === 'auth/wrong-password' ? 'Current (temporary) password is incorrect.'
                : err?.code === 'auth/weak-password' ? 'New password is too weak.'
                : 'Failed to update. Try again.'
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSkipPasswordSetup = async () => {
    const { updateUser } = await import('@/lib/db')
    const uid = (await import('@/lib/firebase')).auth.currentUser?.uid
    if (uid) await updateUser(uid, { showProfileSetup: false } as any)
    setShowPasswordModal(false)
    router.push('/teacher/dashboard')
  }

  if (loading || !teacher) return <Loading fullScreen />

  return (
    <div>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--color-surface)' }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--color-primary)' }}>
                <HiOutlineShieldCheck size={24} color="white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                One Last Step! 🎉
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Update your name, profile photo and change your temporary password.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--color-primary)' }}>
                {profileForm.photoPreview
                  ? <img src={profileForm.photoPreview} alt="Photo" className="w-full h-full object-cover" />
                  : <HiOutlinePhotograph size={28} style={{ color: 'var(--color-text-muted)' }} />}
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Click to upload profile photo (optional)
              </p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Your full name"
                value={profileForm.displayName}
                onChange={e => setProfileForm(p => ({ ...p, displayName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Current (Temporary) Password</label>
              <div className="relative">
                <HiOutlineLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input className="input pl-10" type="password" placeholder="Password given by admin"
                  value={profileForm.currentPassword}
                  onChange={e => setProfileForm(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <HiOutlineLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input className="input pl-10" type="password" placeholder="Min 6 characters"
                  value={profileForm.newPassword}
                  onChange={e => setProfileForm(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <HiOutlineLockClosed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }} />
                <input className="input pl-10" type="password" placeholder="Re-enter new password"
                  value={profileForm.confirmPassword}
                  onChange={e => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              {profileForm.newPassword && profileForm.confirmPassword &&
                profileForm.newPassword !== profileForm.confirmPassword && (
                <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleSavePassword} disabled={savingProfile} className="btn-primary flex-1 py-3">
                {savingProfile
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving...
                    </span>
                  : '✓ Save'}
              </button>
              <button onClick={handleSkipPasswordSetup} disabled={savingProfile} className="btn-secondary flex-1 py-3">
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="page-title">Set Up Your Timetable</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Configure your weekly teaching schedule here. ↓
          </p>
        </div>

        <div className="card p-5">
          <label className="label text-base font-semibold">Semester Type</label>
          <div className="flex gap-3 mt-2">
            {(['odd', 'even'] as const).map(t => (
              <button key={t} onClick={() => setSemesterType(t)}
                className="px-6 py-2.5 rounded-xl font-medium capitalize border transition-all"
                style={{
                  background: semesterType === t ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: semesterType === t ? 'white' : 'var(--color-text)',
                  borderColor: semesterType === t ? 'var(--color-primary)' : 'var(--color-border)',
                }}>
                {t} ({getSemesterNumbers(t).join(', ')})
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Add a Period</h2>

          <div className="mb-5">
            <label className="label mb-2">Class Type</label>
            <div className="flex gap-3">
              {(['lecture', 'practical'] as ClassType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleClassTypeChange(type)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium capitalize border transition-all"
                  style={{
                    background: classType === type ? (type === 'lecture' ? 'var(--color-primary)' : '#7c3aed') : 'var(--color-surface-2)',
                    color: classType === type ? 'white' : 'var(--color-text)',
                    borderColor: classType === type ? (type === 'lecture' ? 'var(--color-primary)' : '#7c3aed') : 'var(--color-border)',
                  }}>
                  <span>{type === 'lecture' ? '🎓' : '🔬'}</span>
                  {type}
                  {type === 'lecture' && <span className="text-xs opacity-80">(Both sections)</span>}
                  {type === 'practical' && <span className="text-xs opacity-80">(Select section)</span>}
                </button>
              ))}
            </div>
            {classType === 'lecture' && newPeriod.trade && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                ✅ Lecture will be marked for both sections: <strong>{tradeSections.join(' & ')}</strong>
              </p>
            )}
            {classType === 'practical' && (
              <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
                ⚠️ Select the section and period range for this practical class.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label">Day</label>
              <select className="input" value={newPeriod.day}
                onChange={e => setNewPeriod(p => ({ ...p, day: e.target.value }))}>
                {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">{classType === 'practical' ? 'From Period' : 'Period'}</label>
              <select className="input" value={newPeriod.periodFrom}
                onChange={e => setNewPeriod(p => ({
                  ...p,
                  periodFrom: Number(e.target.value),
                  periodTo: Math.max(Number(e.target.value), p.periodTo),
                }))}>
                {PERIODS.map(p => (
                  <option key={p.number} value={p.number}>
                    {p.number === 7 ? '7th & 8th' : `${p.number}${['st','nd','rd','th','th','th','th'][p.number-1]}`} — {p.startTime}
                  </option>
                ))}
              </select>
            </div>

            {classType === 'practical' && (
              <div>
                <label className="label">To Period</label>
                <select className="input" value={newPeriod.periodTo}
                  onChange={e => setNewPeriod(p => ({ ...p, periodTo: Number(e.target.value) }))}>
                  {PERIODS.filter(p => p.number >= newPeriod.periodFrom).map(p => (
                    <option key={p.number} value={p.number}>
                      {p.number === 7 ? '7th & 8th' : `${p.number}${['st','nd','rd','th','th','th','th'][p.number-1]}`} — {p.endTime}
                    </option>
                  ))}
                </select>
                {periodCount > 1 && (
                  <p className="text-xs mt-1 font-medium" style={{ color: '#7c3aed' }}>
                    🔢 {periodCount} periods selected → counts as {periodCount} in attendance
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">Trade</label>
              <select className="input" value={newPeriod.trade}
                onChange={e => handleTradeChange(e.target.value)}>
                <option value="">Select Trade</option>
                {trades.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="label">
                Section
                {classType === 'practical' && (
                  <span className="ml-1 text-red-500 text-xs font-semibold">* Required</span>
                )}
              </label>
              {classType === 'lecture' ? (
                <div className="input flex items-center gap-2 cursor-not-allowed opacity-75"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--color-primary)', color: 'white' }}>Auto</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {newPeriod.trade ? tradeSections.join(' & ') || 'Both sections' : 'Select trade first'}
                  </span>
                </div>
              ) : (
                <>
                  <select
                    className="input"
                    value={newPeriod.section}
                    onChange={e => setNewPeriod(p => ({ ...p, section: e.target.value }))}
                    disabled={!newPeriod.trade}
                    style={{
                      borderColor: newPeriod.trade && !newPeriod.section ? '#ef4444' : undefined,
                    }}>
                    <option value="">Select Section *</option>
                    {/* ── ONLY CHANGE: Both option added for practical ── */}
                    {tradeSections.length > 1 && (
                      <option value={tradeSections.join(' & ')}>
                        Both ({tradeSections.join(' & ')})
                      </option>
                    )}
                    {tradeSections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {newPeriod.trade && !newPeriod.section && (
                    <p className="text-xs mt-1 text-red-500">Section is required for practical</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="label">Semester</label>
              <select className="input" value={newPeriod.semester}
                onChange={e => setNewPeriod(p => ({ ...p, semester: e.target.value, subjectId: '' }))}
                disabled={!newPeriod.trade}>
                <option value="">Select</option>
                {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Subject</label>
              <select className="input" value={newPeriod.subjectId}
                onChange={e => setNewPeriod(p => ({ ...p, subjectId: e.target.value }))}
                disabled={!newPeriod.semester || (classType === 'practical' && !newPeriod.section)}>
                <option value="">
                  {classType === 'practical' && !newPeriod.section ? 'Select section first' : 'Select Subject'}
                </option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Room (optional)</label>
              <input className="input" placeholder="e.g. Lab-3" value={newPeriod.room}
                onChange={e => setNewPeriod(p => ({ ...p, room: e.target.value }))} />
            </div>
          </div>

          {classType === 'practical' && periodCount > 1 && newPeriod.trade && (
            <div className="mt-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: '#f5f3ff', borderColor: '#c4b5fd', color: '#5b21b6' }}>
              <strong>🔬 Practical Lab Summary:</strong> {periodCount} consecutive periods
              ({selectedPeriods[0].startTime} – {selectedPeriods[selectedPeriods.length - 1].endTime})
              &nbsp;→ will be saved as <strong>{periodCount} separate attendance records</strong>,
              each counting independently.
            </div>
          )}

          <button onClick={addPeriod} className="btn-primary mt-4">
            <HiOutlinePlus size={16} />
            Add {classType === 'lecture' ? 'Lecture' : `Practical${periodCount > 1 ? ` (${periodCount} periods)` : ''}`} Period
          </button>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Weekly Schedule Preview</h2>
          <div className="space-y-4">
            {schedule.map(daySchedule => (
              <div key={daySchedule.day}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {daySchedule.day}
                </h3>
                {daySchedule.periods.length === 0 ? (
                  <p className="text-xs italic pl-3" style={{ color: 'var(--color-text-muted)' }}>No periods</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {daySchedule.periods.map(period => {
                      const slot = PERIODS.find(p => p.startTime === period.startTime)
                      const isLecture = (period as any).classType === 'lecture'
                      return (
                        <div key={period.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                          <span className="font-semibold text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--color-primary)', color: 'white' }}>
                            {slot ? (slot.number === 7 ? '7&8' : slot.number) : ''}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: isLecture ? '#dbeafe' : '#ede9fe',
                              color: isLecture ? '#1d4ed8' : '#6d28d9',
                            }}>
                            {isLecture ? '🎓 Lecture' : '🔬 Practical'}
                          </span>
                          <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                            {period.startTime}–{period.endTime}
                          </span>
                          <span style={{ color: 'var(--color-text)' }}>{period.subjectName}</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Sem {period.semester} · {period.section}
                          </span>
                          {period.room && (
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{period.room}</span>
                          )}
                          <button onClick={() => removePeriod(daySchedule.day, period.id)}
                            className="text-red-400 hover:text-red-600 ml-1">
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save Timetable & Continue →'}
          </button>
          <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}