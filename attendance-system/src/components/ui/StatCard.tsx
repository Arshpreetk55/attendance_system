'use client'
//StatCard.tsx
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  trend?: { value: number; label: string }
  className?: string
}

const colorMap = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',   text: 'text-blue-600 dark:text-blue-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', text: 'text-green-600 dark:text-green-400' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',     icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',         text: 'text-red-600 dark:text-red-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400' },
}

export default function StatCard({ title, value, subtitle, icon, color = 'blue', trend, className }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('stat-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-lg', colors.icon)}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            trend.value >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                             : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-display font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
        {subtitle && (
          <p className={cn('text-xs mt-1 font-medium', colors.text)}>{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{trend.label}</p>
        )}
      </div>
    </div>
  )
}
