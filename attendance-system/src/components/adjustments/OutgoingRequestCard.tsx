'use client'

import type { AdjustmentRequest} from '@/types'
import { HiOutlineCalendar, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'

interface OutgoingRequestCardProps {
  request: AdjustmentRequest
}

 export function OutgoingRequestCard({
  request,
}: OutgoingRequestCardProps){
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Accepted',
          color: '#10b981',
          bgColor: '#10b98120',
          icon: <HiOutlineCheckCircle size={20} />,
          message: `${request.toTeacherName || 'A substitute'} has accepted your request`,
        }
      case 'rejected':
        return {
          label: 'Declined',
          color: '#ef4444',
          bgColor: '#ef444420',
          icon: <HiOutlineXCircle size={20} />,
          message: `${request.toTeacherName || 'The teacher'} declined your request`,
        }
      case 'pending':
  return {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: '#f5a62320',
    icon: <HiOutlineClock size={20} />,
    message: `Waiting for ${request.toTeacherName || 'a response'}...`,
  }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: '#6b7280',
          bgColor: '#6b728020',
          icon: null,
          message: 'This request has been cancelled',
        }
     case 'admin-pending':
  return {
    label: 'Awaiting Admin',
    color: '#8b5cf6',
    bgColor: '#8b5cf620',
    icon: <HiOutlineClock size={20} />,
    message: 'Admin has been notified and will arrange coverage',
  }
      case 'admin-assigned':
        return {
          label: 'Assigned',
          color: '#10b981',
          bgColor: '#10b98120',
          icon: <HiOutlineCheckCircle size={20} />,
          message: `Admin assigned ${request.toTeacherName || 'a substitute'}`,
        }
      default:
        return {
          label: status,
          color: '#6b7280',
          bgColor: '#6b728020',
          icon: null,
          message: `Status: ${status}`,
        }
    }
  }

  const statusInfo = getStatusInfo(request.status)

  const createdDate = request.createdAt instanceof Date
    ? request.createdAt
    : request.createdAt?.toDate?.() || new Date()
  const createdDateStr = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdDate.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })

  return (
    <div className="card p-5 border-l-4" style={{ borderColor: statusInfo.color }}>
      <div className="space-y-4">
        {/* Status badge and header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {request.subject} · Sem {request.semester}{request.section}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {statusInfo.message}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
            style={{ background: statusInfo.bgColor, color: statusInfo.color }}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </div>
        </div>

        {/* Details grid */}
       <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar size={16} style={{ color: 'var(--color-text-muted)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Date
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {request.date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HiOutlineClock size={16} style={{ color: 'var(--color-text-muted)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Time
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {request.startTime} - {request.endTime}
              </p>
            </div>
          </div>
          <div>
  <p
    className="text-xs"
    style={{ color: 'var(--color-text-muted)' }}
  >
    Period
  </p>
  <p
    className="text-sm font-medium"
    style={{ color: 'var(--color-text)' }}
  >
    P{request.periodNumber}
  </p>
</div>

<div>
  <p
    className="text-xs"
    style={{ color: 'var(--color-text-muted)' }}
  >
    Room
  </p>
  <p
    className="text-sm font-medium"
    style={{ color: 'var(--color-text)' }}
  >
    {request.room || 'TBA'}
  </p>
</div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Sent on
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {createdDateStr}
            </p>
          </div>
        </div>

        {/* Teacher info if assigned */}
        {request.toTeacherName && (
          <div
            className="p-3 rounded-lg border"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
             {request.status === 'accepted' || request.status === 'admin-assigned'
  ? 'Handled by'
  : 'Requested to'}
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text)' }}>
              {request.toTeacherName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
