import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  AppUser, TeacherUser, StudentUser, AttendanceRecord,
  Subject, Trade, Timetable, AttendanceSummary,
  LowAttendanceStudent, StudentAttendance,
} from '@/types'

// ─── Collections ──────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  SUBJECTS: 'subjects',
  TRADES: 'trades',
  ATTENDANCE: 'attendance',
  TIMETABLES: 'timetables',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const

// ─── User Operations ──────────────────────────────────────────────────────────

export async function getUserById(uid: string): Promise<AppUser | null> {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    uid: snap.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as AppUser
}

export async function createUser(uid: string, data: Omit<AppUser, 'uid'>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// ─── Student Operations ───────────────────────────────────────────────────────

export async function getStudentsBySection(
  trade: string, semester: number, section: string
): Promise<StudentUser[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'student'),
    where('trade', '==', trade),
    where('semester', '==', semester),
    where('section', '==', section),
    orderBy('rollNumber')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    ...d.data(),
    uid: d.id,
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  })) as StudentUser[]
}

export async function getStudentByCredentials(
  trade: string, semester: number, section: string, rollNumber: string
): Promise<StudentUser | null> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'student'),
    where('trade', '==', trade),
    where('semester', '==', semester),
    where('section', '==', section),
    where('rollNumber', '==', rollNumber),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    ...d.data(),
    uid: d.id,
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  } as StudentUser
}

export async function addStudent(studentData: Omit<StudentUser, 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.USERS))
  await setDoc(ref, {
    ...studentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function removeStudent(studentId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USERS, studentId))
}

export async function upgradeStudentSemesters(trade: string, currentSemester: number): Promise<void> {
  const students = await getStudentsByTradeSemester(trade, currentSemester)
  const batch = writeBatch(db)
  students.forEach(student => {
    const ref = doc(db, COLLECTIONS.USERS, student.uid)
    batch.update(ref, {
      semester: currentSemester + 1,
      updatedAt: Timestamp.now(),
    })
  })
  await batch.commit()
}

export async function getStudentsByTradeSemester(trade: string, semester: number): Promise<StudentUser[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'student'),
    where('trade', '==', trade),
    where('semester', '==', semester)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), uid: d.id })) as StudentUser[]
}

// ─── Attendance Operations ────────────────────────────────────────────────────

export async function markAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<string> {
  const existing = await getAttendanceByDateSubject(record.date, record.subjectId, record.trade, record.semester, record.section)
  if (existing) {
    await updateDoc(doc(db, COLLECTIONS.ATTENDANCE, existing.id), {
      students: record.students,
      markedAt: Timestamp.now(),
    })
    return existing.id
  }
  const ref = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
    ...record,
    markedAt: Timestamp.now(),
  })
  return ref.id
}

export async function getAttendanceByDateSubject(
  date: string, subjectId: string, trade: string, semester: number, section: string
): Promise<AttendanceRecord | null> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  const match = snap.docs.find(d => {
    const data = d.data()
    return (
      data.subjectId === subjectId &&
      data.trade === trade &&
      data.semester === semester &&
      data.section === section
    )
  })
  if (!match) return null
  return {
    ...match.data(),
    id: match.id,
    markedAt: match.data().markedAt?.toDate(),
  } as AttendanceRecord
}

export async function getStudentAttendance(
  studentId: string, trade: string, semester: number, section: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE),
    where('trade', '==', trade)
  )
  const snap = await getDocs(q)
  const records = snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    markedAt: d.data().markedAt?.toDate(),
  })) as AttendanceRecord[]

  return records
    .filter(r => r.semester === semester && r.section === section)
    .filter(r => r.students.some(s => s.studentId === studentId))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getAttendanceSummaryForStudent(
  studentId: string, trade: string, semester: number, section: string
): Promise<AttendanceSummary[]> {
  const records = await getStudentAttendance(studentId, trade, semester, section)
  const summaryMap = new Map<string, AttendanceSummary>()

  records.forEach(record => {
    const studentEntry = record.students.find(s => s.studentId === studentId)
    if (!studentEntry) return

    if (!summaryMap.has(record.subjectId)) {
      summaryMap.set(record.subjectId, {
        studentId,
        subjectId: record.subjectId,
        subjectName: record.subjectName,
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0,
      })
    }

    const summary = summaryMap.get(record.subjectId)!
    summary.totalClasses++
    if (studentEntry.status === 'present') summary.present++
    else if (studentEntry.status === 'absent') summary.absent++
    else if (studentEntry.status === 'late') summary.late++
    summary.percentage = Math.round((summary.present / summary.totalClasses) * 100)
  })

  return Array.from(summaryMap.values())
}

export async function getSectionAttendanceByDate(
  date: string, trade: string, semester: number, section: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({
      ...(d.data() as Omit<AttendanceRecord, 'id' | 'markedAt'>),
      id: d.id,
      markedAt: (d.data() as any).markedAt?.toDate(),
    }) as AttendanceRecord)
    .filter(r => r.trade === trade && r.semester === semester && r.section === section)
}

export async function getLowAttendanceStudents(
  trade: string, semester: number, section: string, threshold = 75
): Promise<LowAttendanceStudent[]> {
  const students = await getStudentsBySection(trade, semester, section)
  const result: LowAttendanceStudent[] = []

  for (const student of students) {
    const summaries = await getAttendanceSummaryForStudent(student.uid, trade, semester, section)
    const totalClasses = summaries.reduce((a, s) => a + s.totalClasses, 0)
    const totalPresent = summaries.reduce((a, s) => a + s.present, 0)
    const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100

    if (overallPct < threshold) {
      result.push({
        studentId: student.uid,
        rollNumber: student.rollNumber,
        name: student.displayName,
        percentage: overallPct,
        subjectBreakdown: summaries.map(s => ({ subject: s.subjectName, percentage: s.percentage })),
      })
    }
  }

  return result.sort((a, b) => a.percentage - b.percentage)
}

// ─── Subject Operations ───────────────────────────────────────────────────────

export async function getSubjectsBySemester(trade: string, semester: number): Promise<Subject[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBJECTS),
    where('trade', '==', trade),
    where('semester', '==', semester),
    orderBy('name')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Subject[]
}

export async function getAllSubjects(): Promise<Subject[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.SUBJECTS))
  return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Subject[]
}

export async function createSubject(data: Omit<Subject, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.SUBJECTS), data)
  return ref.id
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SUBJECTS, id), data)
}

export async function deleteSubject(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, id))
}

// ─── Trade Operations ─────────────────────────────────────────────────────────

export async function getAllTrades(): Promise<Trade[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.TRADES))
  return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Trade[]
}

export async function createTrade(data: Omit<Trade, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.TRADES), data)
  return ref.id
}

// ─── Timetable Operations ─────────────────────────────────────────────────────

export async function saveTimetable(teacherId: string, timetable: Timetable): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.TIMETABLES, teacherId), {
    ...timetable,
    effectiveFrom: Timestamp.fromDate(timetable.effectiveFrom),
  })
}

export async function getTimetableByTeacher(teacherId: string): Promise<Timetable | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.TIMETABLES, teacherId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    effectiveFrom: data.effectiveFrom?.toDate(),
  } as Timetable
}

export async function getTodayPeriodsForTeacher(teacherId: string): Promise<import('@/types').Period[]> {
  const timetable = await getTimetableByTeacher(teacherId)
  if (!timetable) return []
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  const daySchedule = timetable.schedule.find(s => s.day === today)
  return daySchedule?.periods ?? []
}

// ─── Notification Operations ──────────────────────────────────────────────────

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
}): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    ...data,
    read: false,
    createdAt: Timestamp.now(),
  })
}

export async function getNotifications(userId: string): Promise<import('@/types').Notification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: d.data().createdAt?.toDate(),
  })) as import('@/types').Notification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true })
}

// ─── Admin: Teacher Operations ────────────────────────────────────────────────

/**
 * Returns all users who can teach: role='teacher' OR role='admin'
 * (admins like Hardeep can have a timetable and mark attendance too)
 */
export async function getAllTeachers(): Promise<import('@/types').AppUser[]> {
  const [teacherSnap, adminSnap] = await Promise.all([
    getDocs(query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'teacher'),
      orderBy('displayName')
    )),
    getDocs(query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'admin'),
      orderBy('displayName')
    )),
  ])

  const mapDoc = (d: any) => ({
    ...d.data(),
    uid: d.id,
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  })

  const teachers = teacherSnap.docs.map(mapDoc)
  const admins = adminSnap.docs.map(mapDoc)

  // Merge, deduplicate by uid, sort by displayName
  const all = [...teachers, ...admins]
  const unique = Array.from(new Map(all.map(u => [(u as any).uid, u])).values())
  return unique.sort((a, b) =>
    ((a as any).displayName ?? '').localeCompare((b as any).displayName ?? '')
  ) as import('@/types').AppUser[]
}

export async function deleteTeacherData(uid: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid))
  await deleteDoc(doc(db, COLLECTIONS.TIMETABLES, uid)).catch(() => {})
}

export async function getAllStudents(): Promise<import('@/types').StudentUser[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'student'),
    orderBy('trade')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    ...d.data(),
    uid: d.id,
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  })) as import('@/types').StudentUser[]
}