// ─── User & Auth Types ──────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student'

export interface BaseUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  theme?: 'light' | 'dark'
  colorTheme?: 'blue' | 'ocean'
  // ── Profile setup flags ──────────────────────────────────────────
  isFirstLogin?: boolean
  showProfileSetup?: boolean
  photoURL?: string
}

export interface AdminUser extends BaseUser {
  role: 'admin'
  // Admins can also be teachers, so include teacher fields as optional
  teacherId?: string
  department?: string
  subjects?: string[]
  assignedSections?: SectionRef[]
  isTutor?: boolean
  tutorSection?: SectionRef
  isFirstLogin?: boolean
  showProfileSetup?: boolean
}

export interface TeacherUser extends BaseUser {
  role: 'teacher'
  teacherId: string
  department: string
  subjects: string[]
  assignedSections: SectionRef[]
  timetable?: Timetable
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

export interface Period {
  id: string
  startTime: string  // "HH:MM"
  endTime: string    // "HH:MM"
  subjectId: string
  subjectName: string
  trade: string
  semester: number
  section: string
  room?: string
}

// ─── Attendance Types ────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceRecord {
  id: string
  date: string           // "YYYY-MM-DD"
  subjectId: string
  subjectName: string
  teacherId: string
  trade: string
  semester: number
  section: string
  periodId: string
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
