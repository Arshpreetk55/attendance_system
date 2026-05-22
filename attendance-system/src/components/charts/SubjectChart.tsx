  // SubjectChart.tsx

'use client'

import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, CategoryScale, LinearScale, Tooltip, BarController,
} from 'chart.js'
import type { AttendanceSummary } from '@/types'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, BarController)

interface SubjectChartProps {
  summaries: AttendanceSummary[]
  height?: number
}

export default function SubjectChart({ summaries, height }: SubjectChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const computedHeight = height ?? Math.max(summaries.length * 48, 120)

  useEffect(() => {
    if (!canvasRef.current || !summaries.length) return
    if (chartRef.current) chartRef.current.destroy()

    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#94a3b8' : '#64748b'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    const barColors = summaries.map(s =>
      s.percentage >= 85 ? 'rgba(22, 163, 74, 0.8)'
      : s.percentage >= 75 ? 'rgba(202, 138, 4, 0.8)'
      : 'rgba(220, 38, 38, 0.8)'
    )

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: summaries.map(s => s.subjectName),
        datasets: [{
          label: 'Attendance %',
          data: summaries.map(s => s.percentage),
          backgroundColor: barColors,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1e2a3a' : '#ffffff',
            titleColor: isDark ? '#f0f9ff' : '#0f172a',
            bodyColor: textColor,
            borderColor: isDark ? '#1e3a5f' : '#dbeafe',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const s = summaries[ctx.dataIndex]
                return ` ${s.percentage}%  (${s.present}/${s.totalClasses} classes)`
              },
            },
          },
        },
        scales: {
          x: {
            min: 0, max: 100,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 }, callback: v => `${v}%` },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } },
            border: { display: false },
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [summaries])

  return (
    <div style={{ height: computedHeight }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
