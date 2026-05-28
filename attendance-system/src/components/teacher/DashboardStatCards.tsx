'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { subscribeIncomingRequests, subscribeOutgoingRequests } from '@/lib/db/adjustments'
import { todayString } from '@/lib/utils'
import {
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'

interface Props {
  teacherUid:           string
  totalStudents:        number
  todayPeriods:         number
  lowAttendance:        number
  onViewStudents:       () => void
  onViewSchedule?:      () => void
  onViewLowAttendance?: () => void
}

export default function DashboardStatCards({
  teacherUid,
  totalStudents,
  todayPeriods,
  lowAttendance,
  onViewStudents,
  onViewSchedule,
  onViewLowAttendance,
}: Props) {
  const [pendingIncoming, setPendingIncoming] = useState(0)
  const [acceptedToday, setAcceptedToday]     = useState(0)
  const today = useMemo(() => todayString(), [])

  useEffect(() => {
    const unsubIn = subscribeIncomingRequests(
      teacherUid,
      reqs => setPendingIncoming(
        reqs.filter(r => r.status === 'pending').length
      ),
    )

    const unsubOut = subscribeOutgoingRequests(teacherUid, reqs => {
      setAcceptedToday(
        reqs.filter(r => r.status === 'accepted' && r.date === today).length
      )
    })

    return () => { unsubIn(); unsubOut() }
  }, [teacherUid, today])

  const adjustmentValue = pendingIncoming + acceptedToday
  const adjustmentLabel = `${acceptedToday} covering · ${pendingIncoming} pending`
  const adjustmentColor = pendingIncoming > 0 ? '#f59e0b' : '#10b981'

  const cards = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon:  <HiOutlineUsers size={20} />,
      color: 'var(--color-primary)',
      onClick: onViewStudents,
    },
    {
      label: "Today's Periods",
      value: todayPeriods,
      icon:  <HiOutlineCalendar size={20} />,
      color: '#6366f1',
      onClick: onViewSchedule,
      cursor: onViewSchedule ? 'pointer' : 'default',
    },
    {
      label: 'Adjustments',
      subtitle: adjustmentLabel,
      value: adjustmentValue,
      icon:  pendingIncoming > 0
               ? <HiOutlineClock size={20} />
               : <HiOutlineRefresh size={20} />,
      color: adjustmentColor,
      pulse: pendingIncoming > 0,
      href: '/teacher/adjustments',
    },
    {
      label: 'Low Attendance',
      value: lowAttendance,
      icon:  <HiOutlineExclamationCircle size={20} />,
      color: '#ef4444',
      onClick: onViewLowAttendance,
      cursor: onViewLowAttendance ? 'pointer' : 'default',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => {
        const cardInner = (
          <div
            className="card p-4 flex items-center gap-3 h-full"
            style={{ borderLeft: `4px solid ${card.color}`, cursor: card.cursor || 'default' }}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                card.pulse ? 'animate-pulse' : ''
              }`}
              style={{
                background: `${card.color}20`,
                color:       card.color,
              }}
            >
              {card.icon}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {card.label}
              </p>
              {card.subtitle && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {card.subtitle}
                </p>
              )}
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {card.value}
              </p>
            </div>
          </div>
        )

        if (card.href) {
          return (
            <Link key={card.label} href={card.href} className="block h-full">
              {cardInner}
            </Link>
          )
        }

        return (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="block text-left h-full"
            style={{ width: '100%' }}
          >
            {cardInner}
          </button>
        )
      })}
    </div>
  )
}