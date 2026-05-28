'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { subscribeIncomingRequests, subscribeOutgoingRequests } from '@/lib/db/adjustments'
import { todayString } from '@/lib/utils'
import type { TeacherUser } from '@/types'
import Loading from '@/components/ui/Loading'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { RequestForm } from '@/components/adjustments/RequestForm'
import { IncomingRequestCard } from '@/components/adjustments/IncomingRequestCard'
import { OutgoingRequestCard } from '@/components/adjustments/OutgoingRequestCard'
import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineRefresh,
} from 'react-icons/hi'

// Added 'history' to the tab type so teachers can see past incoming requests
type Tab = 'incoming' | 'outgoing' | 'history'

const navLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard' },
  { href: '/teacher/mark-attendance', label: 'Attendance' },
  { href: '/teacher/students', label: 'Students' },
  { href: '/teacher/timetable', label: 'Timetable' },
  { href: '/teacher/adjustments', label: 'Adjustments' },
]

const sidebarLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: <HiOutlineClipboardCheck size={18} /> },
  { href: '/teacher/mark-attendance', label: 'Attendance', icon: <HiOutlineCheckCircle size={18} /> },
  { href: '/teacher/students', label: 'Students', icon: <HiOutlineUsers size={18} /> },
  { href: '/teacher/timetable', label: 'Timetable', icon: <HiOutlineCalendar size={18} /> },
  { href: '/teacher/adjustments', label: 'Adjustments', icon: <HiOutlineRefresh size={18} /> },
]

export default function AdjustmentsPage() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const teacher = appUser as TeacherUser | null

  const [activeTab, setActiveTab] = useState<Tab>('incoming')
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([])
  const [allIncoming, setAllIncoming] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    if (!loading && !appUser) {
      router.push('/teacher/login')
    }

    if (
      !loading &&
      appUser?.role !== 'teacher' &&
      appUser?.role !== 'admin'
    ) {
      router.push('/')
    }
  }, [loading, appUser, router])

  useEffect(() => {
    if (!teacher) return

    const unsubPending = subscribeIncomingRequests(
      teacher.uid,
      (reqs) => {
        setPendingIncoming(reqs)
        setDataLoading(false)
      },
      'pending'
    )

    // allIncoming subscription — no status filter = full history
    const unsubAll = subscribeIncomingRequests(
      teacher.uid,
      (reqs) => {
        setAllIncoming(reqs)
      }
    )

    const unsubOut = subscribeOutgoingRequests(
      teacher.uid,
      (reqs) => {
        setOutgoingRequests(reqs)
      }
    )

    return () => {
      unsubPending()
      unsubAll()
      unsubOut()
    }
  }, [teacher])

  const today = useMemo(() => todayString(), [])

  if (loading || !teacher) return <Loading fullScreen />

  const acceptedToday = outgoingRequests.filter(
    r => r.status === 'accepted' && r.date === today
  ).length

  const todayLeave = outgoingRequests.some(
    r => r.date === today && r.status === 'accepted'
  )

  // History = allIncoming minus what's already in pendingIncoming
  const pendingIds = new Set(pendingIncoming.map((r: any) => r.id))
  const historyRequests = allIncoming.filter((r: any) => !pendingIds.has(r.id))

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <Sidebar links={sidebarLinks} portalName="Teacher" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar portalName="Teacher" links={navLinks} />

        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="page-title">Adjustments</h1>

              <p
                className="text-sm mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Manage your lecture adjustments and substitutions
              </p>

              {todayLeave && (
                <p
                  className="text-sm mt-2 font-medium"
                  style={{ color: '#f59e0b' }}
                >
                  You are on leave today
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRequestForm(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                Request Adjustment
              </button>

              <ThemeToggle showColorTheme />
            </div>
          </div>

          {dataLoading ? (
            <Loading text="Loading adjustments..." className="py-16" />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="card p-4 flex items-center gap-3"
                  style={{ borderLeft: '4px solid var(--color-primary)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}
                  >
                    <HiOutlineArrowDown size={20} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {pendingIncoming.length}
                    </p>
                  </div>
                </div>

                <div
                  className="card p-4 flex items-center gap-3"
                  style={{ borderLeft: '4px solid #10b981' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#10b98120', color: '#10b981' }}
                  >
                    <HiOutlineArrowUp size={20} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Accepted Today
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {acceptedToday}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {/* Show pending count on Incoming tab, add History tab */}
                <button
                  onClick={() => setActiveTab('incoming')}
                  className="px-4 py-3 text-sm font-semibold transition-colors relative"
                  style={{
                    color: activeTab === 'incoming' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  Incoming ({pendingIncoming.length})
                  {activeTab === 'incoming' && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('outgoing')}
                  className="px-4 py-3 text-sm font-semibold transition-colors relative"
                  style={{
                    color: activeTab === 'outgoing' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  Outgoing ({outgoingRequests.length})
                  {activeTab === 'outgoing' && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                </button>

                {/* History tab renders allIncoming minus pending */}
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-3 text-sm font-semibold transition-colors relative"
                  style={{
                    color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  History ({historyRequests.length})
                  {activeTab === 'history' && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-3">
                {activeTab === 'incoming' && (
                  <>
                    {pendingIncoming.length === 0 ? (
                      <div className="card p-12 text-center">
                        <HiOutlineArrowDown
                          size={40}
                          className="mx-auto mb-3 opacity-50"
                          style={{ color: 'var(--color-text-muted)' }}
                        />
                        <p style={{ color: 'var(--color-text-muted)' }}>
                          No incoming requests at the moment.
                        </p>
                      </div>
                    ) : (
                      pendingIncoming.map(request => (
                        // Pass currentTeacher — was missing, caused silent crash
                        <IncomingRequestCard
                          key={request.id}
                          request={request}
                          currentTeacher={teacher}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === 'outgoing' && (
                  <>
                    {outgoingRequests.length === 0 ? (
                      <div className="card p-12 text-center">
                        <HiOutlineArrowUp
                          size={40}
                          className="mx-auto mb-3 opacity-50"
                          style={{ color: 'var(--color-text-muted)' }}
                        />
                        <p style={{ color: 'var(--color-text-muted)' }}>
                          No outgoing requests yet.
                        </p>
                      </div>
                    ) : (
                      outgoingRequests.map(request => (
                        <OutgoingRequestCard
                          key={request.id}
                          request={request}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === 'history' && (
                  <>
                    {historyRequests.length === 0 ? (
                      <div className="card p-12 text-center">
                        <HiOutlineArrowDown
                          size={40}
                          className="mx-auto mb-3 opacity-50"
                          style={{ color: 'var(--color-text-muted)' }}
                        />
                        <p style={{ color: 'var(--color-text-muted)' }}>
                          No past incoming requests yet.
                        </p>
                      </div>
                    ) : (
                      historyRequests.map(request => (
                        <IncomingRequestCard
                          key={request.id}
                          request={request}
                          currentTeacher={teacher}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {showRequestForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowRequestForm(false)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <div
                className="w-full max-w-3xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'var(--color-surface)' }}
              >
                <RequestForm
                  teacher={teacher}
                  onSuccess={() => setShowRequestForm(false)}
                  onCancel={() => setShowRequestForm(false)}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}