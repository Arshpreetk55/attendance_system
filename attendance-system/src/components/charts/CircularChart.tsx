'use client'

import { useEffect, useRef } from 'react'
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js'
import { cn, getAttendanceColor } from '@/lib/utils'

Chart.register(ArcElement, Tooltip, Legend, DoughnutController)

interface CircularChartProps {
  percentage: number
  size?: number
  label?: string
  className?: string
}

export default function CircularChart({ percentage, size = 180, label, className }: CircularChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const color = percentage >= 85 ? '#16a34a' : percentage >= 75 ? '#ca8a04' : '#dc2626'
  const trackColor = percentage >= 85 ? '#dcfce7' : percentage >= 75 ? '#fef9c3' : '#fee2e2'

  useEffect(() => {
    if (!canvasRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: [color, trackColor],
          borderWidth: 0,
          borderRadius: 8,
        }],
      },
      options: {
        cutout: '78%',
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: {
          animateRotate: true,
          duration: 1000,
          easing: 'easeInOutQuart',
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [percentage, color, trackColor])

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <canvas ref={canvasRef} width={size} height={size} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display font-bold', getAttendanceColor(percentage))}
            style={{ fontSize: size * 0.22 }}>
            {percentage}%
          </span>
          {size > 120 && (
            <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Attendance
            </span>
          )}
        </div>
      </div>
      {label && (
        <p className="text-sm font-medium mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      )}
    </div>
  )
}
