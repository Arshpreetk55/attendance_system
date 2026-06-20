import type { AttendanceRecord, StudentUser } from '@/types'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummarizedRow {
  Date: string
  'Roll Number': string
  'Student Name': string
  Subject: string
  'Periods Present': number
  'Total Periods': number
  'Attendance %': string
}

// ─── Core: Summarize by date + subject (Option A) ─────────────────────────────
//
// Each Firestore attendance doc = one period of a subject on a date.
// e.g. Minor Project marked for 5 periods → 5 docs with same date+subjectId.
// We collapse them into one row per student per subject per date,
// counting how many periods they were present/absent across those docs.

function buildSummarizedRows(
  records: AttendanceRecord[],
  students: StudentUser[]
): SummarizedRow[] {
  const rows: SummarizedRow[] = []

  students.forEach(student => {
    // Group this student's records by date+subjectId
    const grouped = new Map<string, { record: AttendanceRecord; present: number; total: number }>()

    records.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (!entry) return

      const key = `${record.date}__${record.subjectId}`
      if (!grouped.has(key)) {
        grouped.set(key, { record, present: 0, total: 0 })
      }
      const group = grouped.get(key)!
      group.total++
      if (entry.status === 'present' || entry.status === 'late') group.present++
    })

    // One row per date+subject group
    grouped.forEach(({ record, present, total }) => {
      const pct = total > 0 ? Math.round((present / total) * 100) : 0
      rows.push({
        Date: record.date,
        'Roll Number': student.rollNumber ?? '',
        'Student Name': student.displayName ?? '',
        Subject: record.subjectName,
        'Periods Present': present,
        'Total Periods': total,
        'Attendance %': `${pct}%`,
      })
    })
  })

  // Sort by date desc, then roll number
  return rows.sort((a, b) => {
    const dateCompare = b.Date.localeCompare(a.Date)
    if (dateCompare !== 0) return dateCompare
    return (a['Roll Number']).localeCompare(b['Roll Number'], undefined, { numeric: true })
  })
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportAttendanceCSV(records: AttendanceRecord[], students: StudentUser[]): void {
  const rows = buildSummarizedRows(records, students)
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? '')).join(',')
    ),
  ].join('\n')

  downloadFile(csvContent, `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportAttendanceExcel(
  records: AttendanceRecord[],
  students: StudentUser[],
  sectionName: string
): Promise<void> {
  // Use namespace import — xlsx has no reliable default export in all bundlers
  const XLSX = await import('xlsx')

  const rows = buildSummarizedRows(records, students)
  if (!rows.length) throw new Error('No data to export')

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 14 }, // Roll Number
    { wch: 22 }, // Student Name
    { wch: 30 }, // Subject
    { wch: 16 }, // Periods Present
    { wch: 14 }, // Total Periods
    { wch: 14 }, // Attendance %
  ]

  // Bold header row (no-op in xlsx community edition but safe)
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
      }
    }
  }

  XLSX.writeFile(wb, `attendance_${sectionName}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportToPDF(
  records: AttendanceRecord[],
  students: StudentUser[],
  sectionInfo: { trade: string; semester: number; section: string }
): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape' }) // landscape fits 7 columns better

  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235)
  doc.text('AttendX - Attendance Report', 14, 22)

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Trade: ${sectionInfo.trade} | Semester: ${sectionInfo.semester} | Section: ${sectionInfo.section}`,
    14, 32
  )
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 40)

  const rows = buildSummarizedRows(records, students)
  const tableData = rows.map(r => [
    r.Date,
    r['Roll Number'],
    r['Student Name'],
    r.Subject,
    r['Periods Present'],
    r['Total Periods'],
    r['Attendance %'],
  ])

  autoTable(doc, {
    startY: 48,
    head: [['Date', 'Roll No.', 'Student Name', 'Subject', 'Present', 'Total', '%']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9 },
    columnStyles: {
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    // Color the % cell red if below 75%
    didParseCell(data) {
      if (data.column.index === 6 && data.section === 'body') {
        const val = parseInt(String(data.cell.raw))
        if (!isNaN(val) && val < 75) {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  doc.save(
    `attendance_${sectionInfo.trade}_sem${sectionInfo.semester}_${format(new Date(), 'yyyyMMdd')}.pdf`
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}