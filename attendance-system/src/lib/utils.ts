import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') return format(parseISO(date), 'MMM dd, yyyy')
  return format(date, 'MMM dd, yyyy')
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getWeekDays(date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function getAttendanceColor(percentage: number): string {
  if (percentage >= 85) return 'text-green-600 dark:text-green-400'
  if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function getAttendanceBgColor(percentage: number): string {
  if (percentage >= 85) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  if (percentage >= 75) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
}

export function getSemesterType(semester: number): 'odd' | 'even' {
  return semester % 2 !== 0 ? 'odd' : 'even'
}

export function getSemesterNumbers(type: 'odd' | 'even'): number[] {
  return type === 'odd' ? [1, 3, 5, 7] : [2, 4, 6, 7]
}

export function getSemesterLabel(semester: number | string, trade?: string): string {
  const semStr = String(semester)
  if (semStr === '7' && trade) {
    const t = trade.toString().toLowerCase()
    if (t === 'ae' || t.includes('auto') || t.includes('automobile')) return 'PD Auto'
  }
  return `Sem ${semester}`
}

export const TRADES = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil Engineering',
  'Electrical',
] as const

export const SECTIONS = ['A', 'B', 'C', 'D'] as const

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
] as const

// Fixed college periods
export const PERIODS = [
  { number: 1, label: '1st Period',    startTime: '08:30', endTime: '09:30' },
  { number: 2, label: '2nd Period',    startTime: '09:30', endTime: '10:30' },
  { number: 3, label: '3rd Period',    startTime: '10:30', endTime: '11:30' },
  { number: 4, label: '4th Period',    startTime: '11:30', endTime: '12:30' },
  // 12:30 PM – 1:30 PM  →  Lunch Break (not listed)
  { number: 5, label: '5th Period',    startTime: '13:30', endTime: '14:20' },
  { number: 6, label: '6th Period',    startTime: '14:20', endTime: '15:10' },
  { number: 7, label: '7th & 8th Period', startTime: '15:10', endTime: '16:00' },
] as const

export type PeriodSlot = typeof PERIODS[number]

// Keep TIME_SLOTS for any legacy usage
export const TIME_SLOTS = PERIODS.map(p => p.startTime)
