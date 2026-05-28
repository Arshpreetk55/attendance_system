'use client'

import { useEffect, useState } from 'react'
import {
  onSnapshot,
  query,
  collection,
  where,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { todayString } from '@/lib/utils'
import { getTodayPeriodsForTeacher } from '@/lib/db'
import type { Period } from '@/types'

// ── Types ─────────────────────────────────────────────────────────

export type MergedPeriod = {
  id: string
  subjectName: string
  subjectCode?: string
  startTime: string
  endTime: string
  semester: number
  section: string
  trade: string
  room?: string | null

  // Adjustment flags
  isAdjustment: boolean
  adjustmentRequestId?: string | null
  originalTeacherName?: string | null

  // Attendance
  canMarkAttendance: boolean
}

// ── Hook ──────────────────────────────────────────────────────────

export function useMergedTimetable(teacherUid: string) {
  const [periods, setPeriods] = useState<MergedPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [reassignedCount, setReassignedCount] = useState(0)

  // Use state instead of a ref so that rebuild() always reads
  // the latest normal periods even if the Firestore snapshot arrives
  // before getTodayPeriodsForTeacher resolves (race condition).
  const [normalPeriods, setNormalPeriods] = useState<Period[]>([])
  const [normalLoaded, setNormalLoaded] = useState(false)

  const today = todayString()

  // Load timetable once per teacher
  useEffect(() => {
    if (!teacherUid) return
    setNormalLoaded(false)
    setNormalPeriods([])

    getTodayPeriodsForTeacher(teacherUid).then(p => {
      setNormalPeriods(p)
      setNormalLoaded(true)
    })
  }, [teacherUid])

  // Subscribe to adjustments — rebuild whenever normal periods OR adjustments change
  useEffect(() => {
    if (!teacherUid) return

    const incomingQ = query(
      collection(db, 'adjustmentRequests'),
      where('toTeacherId', '==', teacherUid),
      where('date', '==', today),
      where('status', 'in', ['accepted', 'admin-assigned'])
    )

    const outgoingQ = query(
      collection(db, 'adjustmentRequests'),
      where('fromTeacherId', '==', teacherUid),
      where('date', '==', today),
      where('status', 'in', ['accepted', 'admin-assigned'])
    )

    interface TodayAdjustment {
      id: string
      periodId: string
      subject: string
      subjectCode?: string
      startTime: string
      endTime: string
      semester: number
      section: string
      department: string
      room?: string | null
      fromTeacherName: string
    }

    type TodayAdjustmentData = Omit<TodayAdjustment, 'id'>

    let incomingAdj: TodayAdjustment[] = []
    let outgoingAcc: TodayAdjustment[] = []

    // rebuild() now receives normalPeriods as a parameter instead of
    // reading from a ref — this guarantees it uses the current state value
    // rather than a potentially-stale ref captured at subscription time.
    function rebuild(currentNormalPeriods: Period[]) {
      const reassignedIds = new Set(outgoingAcc.map(r => r.periodId))

      const filteredNormal: MergedPeriod[] = currentNormalPeriods
        .filter(p => !reassignedIds.has(p.id))
        .map(p => ({
          ...p,
          isAdjustment: false,
          canMarkAttendance: true,
        }))

      const adjustmentPeriods: MergedPeriod[] = incomingAdj.map(req => ({
        id: `adj-${req.id}`,
        subjectName: req.subject,
        subjectCode: req.subjectCode,
        startTime: req.startTime,
        endTime: req.endTime,
        semester: req.semester,
        section: req.section,
        trade: req.department,
        room: req.room ?? null,
        isAdjustment: true,
        adjustmentRequestId: req.id,
        originalTeacherName: req.fromTeacherName,
        canMarkAttendance: true,
      }))

      const merged = [...filteredNormal, ...adjustmentPeriods].sort(
        (a, b) => a.startTime.localeCompare(b.startTime)
      )

      setPeriods(merged)
      setReassignedCount(outgoingAcc.length)
      setLoading(false)
    }

    const unsubIn = onSnapshot(incomingQ, snap => {
      incomingAdj = snap.docs.map(d => ({ ...(d.data() as TodayAdjustmentData), id: d.id }))
      // Read normalPeriods from state via closure — always up-to-date
      setNormalPeriods(current => {
        rebuild(current)
        return current
      })
    })

    const unsubOut = onSnapshot(outgoingQ, snap => {
      outgoingAcc = snap.docs.map(d => ({ ...(d.data() as TodayAdjustmentData), id: d.id }))
      setNormalPeriods(current => {
        rebuild(current)
        return current
      })
    })

    return () => {
      unsubIn()
      unsubOut()
    }
  }, [teacherUid, today])

  // Re-run rebuild whenever normalPeriods finish loading.
  // This handles the case where the Firestore snapshot arrived first
  // (and rebuild ran with []), then normalPeriods loaded — we rebuild again.
  useEffect(() => {
    if (!normalLoaded) return
    // Trigger a re-render pass; snapshot closures will pick up new state
    // on their next fire. For an immediate rebuild with the loaded periods,
    // we set periods directly here using the same logic as rebuild().
    setPeriods(prev => {
      // If adjustment snapshots haven't fired yet, just show normal periods
      return prev.length === 0
        ? normalPeriods.map(p => ({
            ...p,
            isAdjustment: false as const,
            canMarkAttendance: true,
            adjustmentRequestId: null,
            originalTeacherName: null,
          }))
        : prev
    })
  }, [normalLoaded, normalPeriods])

  const isOnLeaveToday =
    !loading &&
    reassignedCount > 0 &&
    periods.filter(p => !p.isAdjustment).length === 0

  return {
    periods,
    loading,
    isOnLeaveToday,
    reassignedCount,
  }
}