// lib/db/attendance.ts — full replacement

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AttendanceRecord } from '@/types'

export async function markAttendanceSafe(
  markerUid: string,
  requestId: string | null,
  periodId: string,
  date: string,
  attendanceData: Omit<AttendanceRecord, 'id' | 'markedAt'>,
) {
  let adjustmentRequest: any | null = null

  if (requestId) {
    // ── Adjustment lecture — verify ownership ────────────────────────────
    const reqSnap = await getDoc(doc(db, 'adjustmentRequests', requestId))

    if (!reqSnap.exists()) {
      throw new Error('Adjustment request not found')
    }

    adjustmentRequest = reqSnap.data()

    if (adjustmentRequest.toTeacherId !== markerUid) {
      throw new Error(
        'Only the assigned substitute can mark attendance for this lecture'
      )
    }

    if (adjustmentRequest.status !== 'accepted') {
      throw new Error('Adjustment is not in accepted state')
    }

    if (adjustmentRequest.attendanceMarkedBy) {
      throw new Error('Attendance already marked for this lecture')
    }

    await updateDoc(doc(db, 'adjustmentRequests', requestId), {
      attendanceMarkedBy: markerUid,
      attendanceMarkedAt: serverTimestamp(),
    })
  }
// ── Key strategy ──────────────────────────────────────────────────────
  // Normal lecture:     date_periodId_teacherUid         (unique per teacher)
  // Adjustment lecture: date_periodId_adj_requestId      (unique per request)
  //
  // This prevents collision when two teachers touch the same periodId on
  // the same day (original teacher's normal record vs substitute's record).
  const docKey = requestId
    ? `${date}_${periodId}_adj_${requestId}`
    : `${date}_${periodId}_${markerUid}`

  await setDoc(
    doc(db, 'attendance', docKey),
    {
      ...attendanceData,
      teacherId: requestId ? adjustmentRequest?.fromTeacherId : markerUid,
      markedBy: markerUid,
      markedAt: serverTimestamp(),
      adjustmentRequestId: requestId ?? null,
      date,
      originalTeacherId: requestId ? adjustmentRequest?.fromTeacherId : markerUid,
      originalTeacherName: requestId ? adjustmentRequest?.fromTeacherName : null,
      substituteTeacherId: requestId ? markerUid : null,
      substituteTeacherName: requestId ? adjustmentRequest?.toTeacherName ?? null : null,
    },
    { merge: true },
  )
}
  