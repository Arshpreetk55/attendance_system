// ─── User & Auth Types ──────────────────────────────────────────────────────
import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'teacher' | 'student'

export interface BaseUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  theme?: 'light' | 'dark'
  colorTheme?: 'blue' | 'ocean'
  isFirstLogin?: boolean
  showProfileSetup?: boolean
  photoURL?: string
  departmentCodes?: string[]
}

export interface TeacherUser extends BaseUser {
  role: 'teacher'
  teacherId: string
  department: string
  departmentCode: string
  trade?: string
  subjects: string[]
  assignedSections: SectionRef[]
  timetable?: Timetable
  isTutor?: boolean
  tutorSection?: SectionRef
  isFirstLogin?: boolean
  showProfileSetup?: boolean
}

export interface AdminUser extends BaseUser {
  role: 'admin'
  teacherId?: string
  department?: string
  departmentCode?: string
  trade?: string
  subjects?: string[]
  assignedSections?: SectionRef[]
  isTutor?: boolean
  tutorSection?: SectionRef
  isFirstLogin?: boolean
  showProfileSetup?: boolean
}

export interface StudentUser extends BaseUser {
  role: 'student'
  rollNumber: string
  trade: string
  semester: number
  section: string
  tutorId: string
  parentEmail?: string
}

export type AppUser = AdminUser | TeacherUser | StudentUser

// ─── Academic Structure ──────────────────────────────────────────────────────

export interface Trade {
  id: string
  name: string
  code: string
  semesters: number
  sections?: string[]
}

export interface SectionRef {
  trade: string
  semester: number
  section: string
}

export interface Subject {
  id: string
  name: string
  code: string
  trade: string
  semester: number
  weeklyHours: number
  teacherId?: string
}

export interface Timetable {
  teacherId: string
  semesterType: 'odd' | 'even'
  schedule: DaySchedule[]
  effectiveFrom: Date
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  periods: Period[]
}

// Added subjectCode and periodNumber fields used throughout the adjustment system
export interface Period {
  id: string
  startTime: string
  endTime: string
  subjectId: string
  subjectName: string
  subjectCode?: string    // used by RequestForm and adjustment requests
  periodNumber?: number   // used by AdminAdjustmentsPanel and notifications
  trade: string
  semester: number
  section: string
  room?: string
  classType?: 'lecture' | 'practical'
  practicalPeriods?: number
  adjustmentRequestId?: string | null
  periodLabel?: string
}

// ─── Attendance Types ────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceRecord {
  id: string
  date: string
  subjectId: string
  subjectName: string
  teacherId: string
  trade: string
  semester: number
  section: string
  periodId: string
  periodLabel?: string
  startTime?: string
  endTime?: string
  adjustmentRequestId?: string | null
  originalTeacherId?: string
  students: StudentAttendance[]
  markedAt: Date
  markedBy: string
}

export interface StudentAttendance {
  studentId: string
  rollNumber: string
  studentName: string
  status: AttendanceStatus
}

export interface AttendanceSummary {
  studentId: string
  subjectId: string
  subjectName: string
  totalClasses: number
  present: number
  absent: number
  late: number
  percentage: number
}

export interface StudentAttendanceReport {
  student: StudentUser
  overall: {
    totalClasses: number
    present: number
    absent: number
    percentage: number
  }
  bySubject: AttendanceSummary[]
  isLowAttendance: boolean
  recentHistory: AttendanceRecord[]
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface TeacherDashboardStats {
  totalStudents: number
  todayAttendance: number
  todayAttendancePercentage: number
  weeklyTrend: WeeklyTrendPoint[]
  subjectStats: SubjectAttendanceStat[]
  lowAttendanceStudents: LowAttendanceStudent[]
}

export interface WeeklyTrendPoint {
  day: string
  percentage: number
  present: number
  total: number
}

export interface SubjectAttendanceStat {
  subjectId: string
  subjectName: string
  averagePercentage: number
  totalClasses: number
}

export interface LowAttendanceStudent {
  studentId: string
  rollNumber: string
  name: string
  percentage: number
  subjectBreakdown: { subject: string; percentage: number }[]
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: 'low_attendance' | 'attendance_marked' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

// ─── Export Types ─────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  dateRange?: { from: Date; to: Date }
  subjects?: string[]
  students?: string[]
}

// Complete AdjustmentRequest type with all fields used across the system
export interface AdjustmentRequest {
  id: string

  fromTeacherId: string
  fromTeacherName: string

  toTeacherId: string | null
  toTeacherName: string | null

  departmentCode: string
  department?: string

  date: string

  periodId: string
  periodNumber: number
  startTime: string
  endTime: string

  subject: string
  subjectCode?: string
  semester: number
  section: string
  room?: string | null

  status:
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'admin-pending'
    | 'admin-assigned'

  workflowType: 'teacher-to-teacher' | 'teacher-to-admin' | 'admin-direct'

  assignedByAdminId?: string | null
  adminAssignedAt?: Timestamp | Date | null

  attendanceMarkedBy?: string | null
  attendanceMarkedAt?: Timestamp | Date | null

  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
}