import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createNotification } from '@/lib/db'
import type { TeacherUser } from '@/types'

const ADJUSTMENT_COLLECTION = 'adjustmentRequests'

export function subscribeIncomingRequests(
  teacherUid: string,
  callback: (requests: any[]) => void,
  status?: string,
) {
  const q = status
    ? query(
        collection(db, ADJUSTMENT_COLLECTION),
        where('toTeacherId', '==', teacherUid),
        where('status', '==', status),
      )
    : query(
        collection(db, ADJUSTMENT_COLLECTION),
        where('toTeacherId', '==', teacherUid),
      )

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeOutgoingRequests(
  teacherUid: string,
  callback: (requests: any[]) => void,
) {
  const q = query(
    collection(db, ADJUSTMENT_COLLECTION),
    where('fromTeacherId', '==', teacherUid),
  )

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function respondToRequest(
  requestId: string,
  response: 'accepted' | 'rejected',
) {
  const ref = doc(db, ADJUSTMENT_COLLECTION, requestId)
  await updateDoc(ref, {
    status: response,
    updatedAt: Timestamp.now(),
  })
}

export async function getAvailableSubstitutes(params: {
  departmentCode: string
  date:           string
  periodId:       string
  excludeUid:     string
  subject:        string
  subjectCode:    string
  semester:       number
  section:        string
}): Promise<(TeacherUser & { matchScore: number })[]> {
  const { departmentCode, date, periodId, excludeUid, subject, subjectCode, semester, section } = params

  const [teacherSnap, allAdjSnap, pendingSnap] = await Promise.all([

    getDocs(query(
      collection(db, 'users'),
      where('role', 'in', ['teacher', 'admin']),
      where('departmentCode', '==', departmentCode),
      
    )),

    // accepted OR admin-pending — both mean the teacher is absent today
    getDocs(query(
      collection(db, ADJUSTMENT_COLLECTION),
      where('departmentCode', '==', departmentCode),
      where('date', '==', date),
      where('status', 'in', ['accepted', 'admin-pending']),
    )),

    getDocs(query(
      collection(db, ADJUSTMENT_COLLECTION),
      where('departmentCode', '==', departmentCode),
      where('date', '==', date),
      where('periodId', '==', periodId),
      where('status', '==', 'pending'),
    )),
  ])

  const busyUids   = new Set<string>()
  const absentUids = new Set<string>()

  for (const d of allAdjSnap.docs) {
    const data = d.data()
    absentUids.add(data.fromTeacherId)
    if (data.periodId === periodId && data.toTeacherId) {
      busyUids.add(data.toTeacherId)
    }
  }

  const pendingUids = new Set<string>(
    pendingSnap.docs.map(d => d.data().toTeacherId).filter(Boolean)
  )

  const getWeekdayName = (dateValue: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date(`${dateValue}T12:00:00`).getDay()]
  }

  const computeMatchScore = async (teacher: TeacherUser): Promise<number> => {
    let score = 0
    const timetableSnap = await getDoc(doc(db, 'timetables', teacher.uid))
    if (!timetableSnap.exists()) return score

    const timetable = timetableSnap.data() as { schedule?: Array<{ day: string; periods: any[] }> }
    const dayName = getWeekdayName(date)
    const daySchedule = timetable.schedule?.find(d => d.day === dayName)
    if (!daySchedule?.periods?.length) return score

    for (const period of daySchedule.periods) {
      if (subjectCode && period.subjectCode === subjectCode) score += 5
      if (!subjectCode && period.subjectName === subject) score += 3
      if (period.semester === semester && period.section === section) score += 3
      if (period.subjectName === subject) score += 2
    }

    return score
  }

  const teachers = teacherSnap.docs
    .map(d => ({ uid: d.id, ...d.data() } as TeacherUser))
    .filter(t =>
      t.uid !== excludeUid &&
      !busyUids.has(t.uid) &&
      !absentUids.has(t.uid) &&
      !pendingUids.has(t.uid)
    )



  const scored = await Promise.all(
    teachers.map(async teacher => ({
      ...teacher,
      matchScore: await computeMatchScore(teacher),
    }))
  )

  return scored.sort((a, b) => b.matchScore - a.matchScore || a.displayName.localeCompare(b.displayName))
}

export function subscribeAdminRequests(
  departmentCode: string,
  date: string,
  callback: (requests: any[]) => void,
) {
  const q = query(
    collection(db, ADJUSTMENT_COLLECTION),
    where('departmentCode', '==', departmentCode),
    where('date', '==', date),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

interface CreateAdjustmentParams {
  fromTeacher: {
    uid: string
    name: string
    department: string
    departmentCode: string
  }
  toTeacher: {
    uid: string
    name: string
  }
  date: string
  period: {
    id: string
    number: number
    startTime: string
    endTime: string
  }
  subject: string
  subjectCode: string
  semester: number
  section: string
  room: string | null
}

interface CreateAdminAdjustmentParams {
  fromTeacher: {
    uid: string
    name: string
    department: string
    departmentCode: string
  }
  date: string
  period: {
    id: string
    number: number
    startTime: string
    endTime: string
  }
  subject: string
  subjectCode: string
  semester: number
  section: string
  room: string | null
}

export async function createAdjustmentRequest(
  params: CreateAdjustmentParams,
): Promise<string> {
  const ref = await addDoc(collection(db, ADJUSTMENT_COLLECTION), {
    fromTeacherId: params.fromTeacher.uid,
    fromTeacherName: params.fromTeacher.name,
    toTeacherId: params.toTeacher.uid,
    toTeacherName: params.toTeacher.name,
    departmentCode: params.fromTeacher.departmentCode,
    department: params.fromTeacher.department,
    date: params.date,
    periodId: params.period.id,
    periodNumber: params.period.number,
    startTime: params.period.startTime,
    endTime: params.period.endTime,
    subject: params.subject,
    subjectCode: params.subjectCode,
    semester: params.semester,
    section: params.section,
    room: params.room,
    status: 'pending',
    workflowType: 'teacher-to-teacher',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  await createNotification({
    userId: params.toTeacher.uid,
    type: 'system',
    title: 'Adjustment request received',
    message: `${params.fromTeacher.name} asked you to cover ${params.subject} on ${params.date}, period ${params.period.number}.`,
  })

  return ref.id
}

export async function createAdminAdjustmentRequest(
  params: CreateAdminAdjustmentParams,
): Promise<string> {
  const ref = await addDoc(collection(db, ADJUSTMENT_COLLECTION), {
    fromTeacherId: params.fromTeacher.uid,
    fromTeacherName: params.fromTeacher.name,
    toTeacherId: null,
    toTeacherName: null,
    departmentCode: params.fromTeacher.departmentCode,
    department: params.fromTeacher.department,
    date: params.date,
    periodId: params.period.id,
    periodNumber: params.period.number,
    startTime: params.period.startTime,
    endTime: params.period.endTime,
    subject: params.subject,
    subjectCode: params.subjectCode,
    semester: params.semester,
    section: params.section,
    room: params.room,
    status: 'admin-pending',
    workflowType: 'teacher-to-admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await createNotification({
    userId: params.fromTeacher.uid,
    type: 'system',
    title: 'Adjustment request submitted',
    message: `Your request for ${params.subject} on ${params.date}, period ${params.period.number} is waiting for admin assignment.`,
  })

  return ref.id
}

export interface CreateAdminDirectParams {
  adminId: string
  adminName: string
  fromTeacher: {
    uid: string
    name: string
  }
  toTeacher: {
    uid: string
    name: string
  }
  departmentCode: string
  department: string
  date: string
  period: {
    id: string
    number: number
    startTime: string
    endTime: string
  }
  subject: string
  subjectCode: string
  semester: number
  section: string
  room: string | null
}

export async function createAdminDirectRequest(
  params: CreateAdminDirectParams,
): Promise<string> {
  const ref = await addDoc(collection(db, ADJUSTMENT_COLLECTION), {
    fromTeacherId: params.fromTeacher.uid,
    fromTeacherName: params.fromTeacher.name,
    toTeacherId: params.toTeacher.uid,
    toTeacherName: params.toTeacher.name,
    departmentCode: params.departmentCode,
    department: params.department,
    date: params.date,
    periodId: params.period.id,
    periodNumber: params.period.number,
    startTime: params.period.startTime,
    endTime: params.period.endTime,
    subject: params.subject,
    subjectCode: params.subjectCode,
    semester: params.semester,
    section: params.section,
    room: params.room,
    status: 'admin-assigned',
    workflowType: 'admin-direct',
    assignedByAdminId: params.adminId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await Promise.all([
    createNotification({
      userId: params.fromTeacher.uid,
      type: 'system',
      title: 'Lecture reassigned',
      message: `${params.adminName} reassigned your ${params.subject} class on ${params.date} to ${params.toTeacher.name}.`,
    }),
    createNotification({
      userId: params.toTeacher.uid,
      type: 'system',
      title: 'New lecture assigned',
      message: `${params.adminName} assigned you to cover ${params.subject} on ${params.date}, period ${params.period.number}.`,
    }),
  ])

  return ref.id
}

export async function adminAssignSubstitute(
  requestId: string,
  adminId: string,
  substitute: { uid: string; name: string },
  fromTeacherName: string,
  period: { number: number },
  requireConfirm: boolean,
): Promise<void> {
  await updateDoc(doc(db, ADJUSTMENT_COLLECTION, requestId), {
    toTeacherId: substitute.uid,
    toTeacherName: substitute.name,
    assignedByAdminId: adminId,
    adminAssignedAt: Timestamp.now(),
    status: requireConfirm ? 'pending' : 'admin-assigned',
    updatedAt: Timestamp.now(),
  })
}

export async function adminReassignSubstitute(
  requestId: string,
  adminId: string,
  substitute: { uid: string; name: string },
  previousSubstituteId: string,
  fromTeacherName: string,
  period: { number: number },
): Promise<void> {
  await updateDoc(doc(db, ADJUSTMENT_COLLECTION, requestId), {
    toTeacherId: substitute.uid,
    toTeacherName: substitute.name,
    assignedByAdminId: adminId,
    adminAssignedAt: Timestamp.now(),
    status: 'admin-assigned',
    updatedAt: Timestamp.now(),
  })
}

export async function cancelAdjustment(
  requestId: string,
  cancelledById: string,
  cancellationReason?: string,
): Promise<void> {
  await updateDoc(doc(db, ADJUSTMENT_COLLECTION, requestId), {
    status: 'cancelled',
    assignedByAdminId: cancelledById,
    cancellationReason: cancellationReason || null,
    updatedAt: Timestamp.now(),
  })
}

export async function adminCancelRequest(
  requestId: string,
  adminId: string,
  reason?: string,
): Promise<void> {
  await cancelAdjustment(requestId, adminId, reason)
}
