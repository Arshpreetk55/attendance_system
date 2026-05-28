'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { onSnapshot, collection, query, where, Timestamp, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  COLLECTIONS, getTodayPeriodsForTeacher,
  getSectionAttendanceByDate, getTimetableByTeacher,
} from '@/lib/db'
import { todayString } from '@/lib/utils'
import type { AppUser, Period, StudentUser, AdminUser, TeacherUser } from '@/types'
import { HiOutlineBell, HiOutlineX } from 'react-icons/hi'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'unmarked' | 'new_student' | 'upcoming_class' | 'teacher_unmarked'

interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  time: Date
  read: boolean
}

interface Props {
  appUser: AppUser
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Parse "HH:MM" into today's Date object
function todayAt(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBar({ appUser }: Props) {
  const [open, setOpen]     = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const panelRef            = useRef<HTMLDivElement>(null)
  const mountTimeRef        = useRef(new Date())
  // Track which period IDs we've already fired "upcoming" for today
  const firedUpcomingRef    = useRef<Set<string>>(new Set())
  // Track which teacher+period combos we've already fired "teacher_unmarked" for
  const firedTeacherRef     = useRef<Set<string>>(new Set())

  const isAdmin   = appUser.role === 'admin'
  const isAsAdmin = isAdmin && (appUser as AdminUser).departmentCode === 'AS'
  const isCseAdmin = isAdmin && (appUser as AdminUser).departmentCode === 'CSE'

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

  // ── Helper: upsert a notification ─────────────────────────────────────────
  const upsert = useCallback((notif: Notification) => {
    setNotifs(prev => {
      const exists = prev.find(n => n.id === notif.id)
      if (exists) return prev
      return [notif, ...prev].sort((a, b) => b.time.getTime() - a.time.getTime())
    })
  }, [])

  const dismiss = (id: string) =>
    setNotifs(prev => prev.filter(n => n.id !== id))

  const markAllRead = () =>
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  // ── 1. Unmarked attendance: check on load + every 5 min ───────────────────
  const checkUnmarked = useCallback(async () => {
    try {
      const today   = todayString()
      const periods = await getTodayPeriodsForTeacher(appUser.uid)

      await Promise.all(periods.map(async (period: Period) => {
        const records = await getSectionAttendanceByDate(
          today, period.trade, period.semester, period.section
        )
        if (records.length === 0) {
          upsert({
            id:      `unmarked-${period.id}`,
            type:    'unmarked',
            title:   'Attendance not marked',
            message: `${period.trade.split(' ').map((w: string) => w[0]).join('')} — Sem ${period.semester}${period.section} · ${period.subjectName} (${period.startTime}–${period.endTime}) has no records yet.`,
            time:    new Date(),
            read:    false,
          })
        } else {
          setNotifs(prev => prev.filter(n => n.id !== `unmarked-${period.id}`))
        }
      }))
    } catch (err) {
      console.error('Notification check failed:', err)
    }
  }, [appUser.uid, upsert])

  useEffect(() => {
    checkUnmarked()
    const interval = setInterval(checkUnmarked, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkUnmarked])

  // ── 2. New students: live Firestore snapshot ───────────────────────────────
  useEffect(() => {
    const user     = appUser as AdminUser | TeacherUser
    const deptCode = user.role === 'admin' || user.role === 'teacher'
      ? (user as AdminUser | TeacherUser).departmentCode ?? ''
      : ''

    const tradesToWatch: string[] = deptCode === 'AS'
      ? ['Computer Science and Engineering','Information Technology','ECE','Electrical Engineering','Civil Engineering','Mechanical Engineering','Automobile Engineering']
      : deptCode === 'CSE'
        ? ['Computer Science and Engineering', 'Information Technology']
        : [(user as AdminUser | TeacherUser).department ?? '']

    const unsubscribers = tradesToWatch.map(trade => {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', 'student'),
        where('trade', '==', trade),
      )
      return onSnapshot(q, (snap) => {
        snap.docChanges().forEach(change => {
          if (change.type !== 'added') return
          const data      = change.doc.data() as StudentUser
          const addedAt   = data.createdAt
          const addedDate = addedAt instanceof Timestamp ? addedAt.toDate() : new Date()
          if (addedDate < mountTimeRef.current) return
          const tradeCode = trade.split(' ').map((w: string) => w[0]).join('')
          upsert({
            id:      `new-student-${change.doc.id}`,
            type:    'new_student',
            title:   'New student added',
            message: `${data.displayName} joined ${tradeCode} — Sem ${data.semester}, Section ${data.section}.`,
            time:    addedDate,
            read:    false,
          })
        })
      })
    })

    return () => unsubscribers.forEach(u => u())
  }, [appUser, upsert])

  // ── 3. Upcoming class in 15 min (teacher + admin) ─────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const periods = await getTodayPeriodsForTeacher(appUser.uid)
        const now     = Date.now()

        for (const period of periods) {
          const startMs  = todayAt(period.startTime).getTime()
          const diffMins = (startMs - now) / 60000

          // Fire once when between 14–16 minutes away
          if (diffMins > 14 && diffMins <= 16 && !firedUpcomingRef.current.has(period.id)) {
            firedUpcomingRef.current.add(period.id)
            upsert({
              id:      `upcoming-${period.id}`,
              type:    'upcoming_class',
              title:   'Class starting soon',
              message: `${period.subjectName} (${period.trade.split(' ').map((w: string) => w[0]).join('')} Sem ${period.semester}${period.section}) starts at ${period.startTime}.`,
              time:    new Date(),
              read:    false,
            })
          }

          // Auto-dismiss once class has started
          if (diffMins <= 0) {
            setNotifs(prev => prev.filter(n => n.id !== `upcoming-${period.id}`))
          }
        }
      } catch (err) {
        console.error('Upcoming class check failed:', err)
      }
    }

    check()
    const interval = setInterval(check, 60 * 1000) // check every minute
    return () => clearInterval(interval)
  }, [appUser.uid, upsert])

  // ── 4. Teacher hasn't marked attendance (admin-only) ──────────────────────
  useEffect(() => {
    if (!isAdmin) return

    const checkTeacherUnmarked = async () => {
      try {
        const today      = todayString()
        const deptCodes  = isAsAdmin
          ? ['AS']
          : isCseAdmin ? ['CSE', 'IT']
          : [(appUser as AdminUser).departmentCode ?? '']

        // Fetch all teachers in this admin's department(s)
        const teacherSnaps = await Promise.all(
          deptCodes.map(code =>
            getDocs(query(
              collection(db, COLLECTIONS.USERS),
              where('departmentCode', '==', code),
            ))
          )
        )

        const teachers: { uid: string; displayName: string }[] = []
        const seen = new Set<string>()
        for (const snap of teacherSnaps) {
          for (const d of snap.docs) {
            const data = d.data()
            if ((data.role === 'teacher' || data.role === 'admin') && !seen.has(d.id)) {
              seen.add(d.id)
              
teachers.push({ uid: d.id, displayName: data.displayName ?? 'Unknown' })
            }
          }
        }

        // For each teacher check if they have periods today with no records
        await Promise.all(teachers.map(async (teacher) => {
          // Skip self — own unmarked periods are covered by notification #1
          if (teacher.uid === appUser.uid) return

          const periods = await getTodayPeriodsForTeacher(teacher.uid)
          if (periods.length === 0) return

          // Only check periods whose start time has already passed
          const now = Date.now()
          const pastPeriods = periods.filter(p => todayAt(p.startTime).getTime() < now)
          if (pastPeriods.length === 0) return

          await Promise.all(pastPeriods.map(async (period) => {
            const fireKey = `${teacher.uid}-${period.id}`
            const records = await getSectionAttendanceByDate(
              today, period.trade, period.semester, period.section
            )

            if (records.length === 0 && !firedTeacherRef.current.has(fireKey)) {
              firedTeacherRef.current.add(fireKey)
              upsert({
                id:      `teacher-unmarked-${fireKey}`,
                type:    'teacher_unmarked',
                title:   'Teacher attendance pending',
                message: `${teacher.displayName} hasn't marked attendance for ${period.subjectName} (${period.startTime}–${period.endTime}).`,
                time:    new Date(),
                read:    false,
              })
            } else if (records.length > 0) {
              // Clear if they've since marked it
              setNotifs(prev => prev.filter(n => n.id !== `teacher-unmarked-${fireKey}`))
              firedTeacherRef.current.delete(fireKey)
            }
          }))
        }))
      } catch (err) {
        console.error('Teacher unmarked check failed:', err)
      }
    }

    checkTeacherUnmarked()
    const interval = setInterval(checkTeacherUnmarked, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [appUser, isAdmin, isAsAdmin, isCseAdmin, upsert])

  // ── Render ─────────────────────────────────────────────────────────────────
  const unread = notifs.filter(n => !n.read).length

  // Dot color per type
  const dotColor: Record<NotifType, string> = {
    unmarked:         '#EF9F27',
    new_student:      '#378ADD',
    upcoming_class:   '#1D9E75',
    teacher_unmarked: '#D85A30',
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
                {type === 'unmarked'         ? 'My unmarked'    :
                 type === 'new_student'      ? 'New student'    :
                 type === 'upcoming_class'   ? 'Upcoming class' :
                                              'Teacher pending'}
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