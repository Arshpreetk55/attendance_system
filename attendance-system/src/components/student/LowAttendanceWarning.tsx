import { HiOutlineExclamationCircle, HiOutlineMail } from 'react-icons/hi'
//LowAttendanceWarning.tsx
interface LowAttendanceWarningProps {
  percentage: number
  studentName?: string
  subjectBreakdown?: { subject: string; percentage: number }[]
}

export default function LowAttendanceWarning({ percentage, studentName, subjectBreakdown }: LowAttendanceWarningProps) {
  const critical = percentage < 60

  return (
    <div className={`rounded-2xl border p-4 animate-fade-in ${
      critical
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          critical ? 'bg-red-100 dark:bg-red-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'
        }`}>
          <HiOutlineExclamationCircle size={20} className={critical ? 'text-red-600' : 'text-yellow-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${critical ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
            {critical ? '⚠️ Critical Attendance Alert' : '⚠️ Low Attendance Warning'}
          </p>
          <p className={`text-sm mt-0.5 ${critical ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
            {studentName
              ? `${studentName}'s attendance is ${percentage}% — below the 75% minimum.`
              : `Your overall attendance is ${percentage}% — below the required 75%.`}
          </p>
          {subjectBreakdown && subjectBreakdown.some(s => s.percentage < 75) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {subjectBreakdown.filter(s => s.percentage < 75).map(s => (
                <span key={s.subject}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    critical ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                  }`}>
                  {s.subject}: {s.percentage}%
                </span>
              ))}
            </div>
          )}
          <p className={`text-xs mt-2 flex items-center gap-1 ${critical ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            <HiOutlineMail size={13} />
            An email notification has been sent to your registered email.
          </p>
        </div>
      </div>
    </div>
  )
}
