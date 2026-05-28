'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getAttendanceSummaryForStudent, getSectionAttendanceByDate } from '@/lib/db'
import { todayString } from '@/lib/utils'
import type { StudentUser } from '@/types'
import { HiOutlineBell, HiOutlineX } from 'react-icons/hi'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'low_attendance' | 'absent_today' | 'upcoming_class'

interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  time: Date
  read: boolean
}

interface Props {
  student: StudentUser
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayAt(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentNotificationBar({ student }: Props) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const firedUpcomingRef = useRef<Set<string>>(new Set())

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Upsert helper ──────────────────────────────────────────────────────────
  const upsert = useCallback((notif: Notification) => {
    setNotifs(prev => {
      if (prev.find(n => n.id === notif.id)) return prev
      return [notif, ...prev].sort((a, b) => b.time.getTime() - a.time.getTime())
    })
  }, [])

  const dismiss = (id: string) =>
    setNotifs(prev => prev.filter(n => n.id !== id))

  const markAllRead = () =>
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  // ── 1. Low attendance warning ──────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const summaries = await getAttendanceSummaryForStudent(
          student.uid, student.trade, student.semester, student.section
        )
        const totalClasses = summaries.reduce((a, s) => a + s.totalClasses, 0)
        const totalPresent = summaries.reduce((a, s) => a + s.present, 0)
        if (totalClasses === 0) return

        const overallPct = Math.round((totalPresent / totalClasses) * 100)

        if (overallPct < 75) {
          upsert({
            id: 'low-attendance-overall',
            type: 'low_attendance',
            title: 'Low attendance alert',
            message: `Your overall attendance is ${overallPct}%. Minimum required is 75%.`,
            time: new Date(),
            read: false,
          })
        } else {
          setNotifs(prev => prev.filter(n => n.id !== 'low-attendance-overall'))
        }

        // Per-subject low attendance
        summaries.forEach(s => {
          if (s.totalClasses >= 5 && s.percentage < 75) {
            upsert({
              id: `low-attendance-${s.subjectId}`,
              type: 'low_attendance',
              title: 'Subject attendance low',
              message: `${s.subjectName}: ${s.percentage}% attendance (${s.present}/${s.totalClasses} classes).`,
              time: new Date(),
              read: false,
            })
          } else {
            setNotifs(prev => prev.filter(n => n.id !== `low-attendance-${s.subjectId}`))
          }
        })
      } catch (err) {
        console.error('Low attendance check failed:', err)
      }
    }

    check()
    const interval = setInterval(check, 10 * 60 * 1000) // every 10 min
    return () => clearInterval(interval)
  }, [student, upsert])

  // ── 2. Absent today ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const today = todayString()
        const records = await getSectionAttendanceByDate(
          today, student.trade, student.semester, student.section
        )

        records.forEach(record => {
          const entry = record.students.find(s => s.studentId === student.uid)
          if (!entry) return

          if (entry.status === 'absent') {
            upsert({
              id: `absent-today-${record.subjectId}`,
              type: 'absent_today',
              title: 'Marked absent',
              message: `You were marked absent in ${record.subjectName} today.`,
              time: record.markedAt ?? new Date(),
              read: false,
            })
          } else {
            setNotifs(prev => prev.filter(n => n.id !== `absent-today-${record.subjectId}`))
          }
        })
      } catch (err) {
        console.error('Absent today check failed:', err)
      }
    }

    check()
    const interval = setInterval(check, 5 * 60 * 1000) // every 5 min
    return () => clearInterval(interval)
  }, [student, upsert])

  // ── 3. Upcoming class in 15 min ────────────────────────────────────────────
  // Fetches all teacher timetables that match student's trade/semester/section
  useEffect(() => {
    // Dynamically import to avoid circular deps
    const check = async () => {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        const { COLLECTIONS, getTimetableByTeacher } = await import('@/lib/db')

        // Get all teachers who teach this student's section
        const teacherSnap = await getDocs(query(
          collection(db, COLLECTIONS.USERS),
          where('role', '==', 'teacher'),
          where('trade', '==', student.trade),
        ))

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const today = days[new Date().getDay()]
        const now = Date.now()

        for (const teacherDoc of teacherSnap.docs) {
          const timetable = await getTimetableByTeacher(teacherDoc.id)
          if (!timetable) continue

          const daySchedule = timetable.schedule.find(s => s.day === today)
          if (!daySchedule) continue

          for (const period of daySchedule.periods) {
            // Only periods for this student's semester + section
            if (period.semester !== student.semester || period.section !== student.section) continue

            const startMs = todayAt(period.startTime).getTime()
            const diffMins = (startMs - now) / 60000

            if (diffMins > 14 && diffMins <= 16 && !firedUpcomingRef.current.has(period.id)) {
              firedUpcomingRef.current.add(period.id)
              upsert({
                id: `upcoming-${period.id}`,
                type: 'upcoming_class',
                title: 'Class starting soon',
                message: `${period.subjectName} starts at ${period.startTime}${period.room ? ` in ${period.room}` : ''}.`,
                time: new Date(),
                read: false,
              })
            }

            // Auto-dismiss once started
            if (diffMins <= 0) {
              setNotifs(prev => prev.filter(n => n.id !== `upcoming-${period.id}`))
            }
          }
        }
      } catch (err) {
        console.error('Upcoming class check failed:', err)
      }
    }

    check()
    const interval = setInterval(check, 60 * 1000)
    return () => clearInterval(interval)
  }, [student, upsert])

  // ── Render ─────────────────────────────────────────────────────────────────
  const unread = notifs.filter(n => !n.read).length

  const dotColor: Record<NotifType, string> = {
    low_attendance:  '#E24B4A',
    absent_today:    '#EF9F27',
    upcoming_class:  '#1D9E75',
  }

  const typeLabel: Record<NotifType, string> = {
    low_attendance:  'Low attendance',
    absent_today:    'Absent today',
    upcoming_class:  'Upcoming class',
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); markAllRead() }}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-xl hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
      >
        <HiOutlineBell size={20} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold"
            style={{
              minWidth: 18, height: 18, borderRadius: 9, fontSize: 10,
              background: '#E24B4A',
              border: '2px solid var(--color-bg)',
              padding: '0 3px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position:     'absolute',
            top:          44,
            right:        0,
            width:        340,
            zIndex:       50,
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: 16,
            boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
            overflow:     'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              Notifications
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {notifs.length > 0 && (
                <button
                  onClick={() => setNotifs([])}
                  style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: '#E24B4A22', color: '#A32D2D',
              }}>
                {notifs.length} total
              </span>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            padding: '8px 16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}>
            {(Object.entries(dotColor) as [NotifType, string][]).map(([type, color]) => (
              <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {typeLabel[type]}
              </span>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                <HiOutlineBell size={28} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
                All caught up — no new alerts.
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  background: n.read ? 'var(--color-surface)' : `${dotColor[n.type]}11`,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: dotColor[n.type],
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                    {n.title}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  aria-label="Dismiss notification"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text-muted)', lineHeight: 1 }}
                >
                  <HiOutlineX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}