      //WeeklyChart.tsx

'use client'

import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, BarController,
} from 'chart.js'
import type { WeeklyTrendPoint } from '@/types'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController)

interface WeeklyChartProps {
  data: WeeklyTrendPoint[]
  height?: number
}

export default function WeeklyChart({ data, height = 220 }: WeeklyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.length) return
    if (chartRef.current) chartRef.current.destroy()

    const isDark = document.documentElement.classList.contains('dark')
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const textColor = isDark ? '#94a3b8' : '#64748b'

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.day),
        datasets: [
          {
            label: 'Present',
            data: data.map(d => d.present),
            backgroundColor: 'rgba(37, 99, 235, 0.85)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Absent',
            data: data.map(d => d.total - d.present),
            backgroundColor: 'rgba(239, 68, 68, 0.4)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'var(--font-body)', size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#1e2a3a' : '#ffffff',
            titleColor: isDark ? '#f0f9ff' : '#0f172a',
            bodyColor: textColor,
            borderColor: isDark ? '#1e3a5f' : '#dbeafe',
            borderWidth: 1,
            padding: 10,
            titleFont: { family: 'var(--font-display)', weight: 'bold' },
            callbacks: {
              afterLabel: (ctx) => {
                const point = data[ctx.dataIndex]
                return `Percentage: ${point.percentage}%`
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'var(--font-body)', size: 11 } },
            border: { display: false },
          },
          y: {
            stacked: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'var(--font-body)', size: 11 } },
            border: { display: false },
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [data])

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
