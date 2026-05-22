import type { AttendanceRecord, StudentAttendance, StudentUser } from '@/types'
import { format } from 'date-fns'

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csvContent = [headers.join(','), ...rows].join('\n')
  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

export function exportAttendanceCSV(records: AttendanceRecord[], students: StudentUser[]): void {
  const rows: Record<string, unknown>[] = []
  students.forEach(student => {
    records.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (entry) {
        rows.push({
          Date: record.date,
          'Roll Number': student.rollNumber,
          'Student Name': student.displayName,
          Subject: record.subjectName,
          Status: entry.status,
        })
      }
    })
  })
  exportToCSV(rows, `attendance_${format(new Date(), 'yyyy-MM-dd')}`)
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportToExcel(data: Record<string, unknown>[], filename: string): Promise<void> {
  const XLSX = (await import('xlsx')).default
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
      }
    }
  }

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportAttendanceExcel(
  records: AttendanceRecord[],
  students: StudentUser[],
  sectionName: string
): Promise<void> {
  const rows: Record<string, unknown>[] = []
  students.forEach(student => {
    records.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (entry) {
        rows.push({
          Date: record.date,
          'Roll Number': student.rollNumber,
          'Student Name': student.displayName,
          Subject: record.subjectName,
          Status: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
        })
      }
    })
  })
  await exportToExcel(rows, `attendance_${sectionName}_${format(new Date(), 'yyyy-MM-dd')}`)
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportToPDF(
  records: AttendanceRecord[],
  students: StudentUser[],
  sectionInfo: { trade: string; semester: number; section: string }
): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  // Header
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

  // Build table data
  const tableData: any[][] = []
  students.forEach(student => {
    records.forEach(record => {
      const entry = record.students.find(s => s.studentId === student.uid)
      if (entry) {
        tableData.push([
          record.date,
          student.rollNumber,
          student.displayName,
          record.subjectName,
          entry.status.toUpperCase(),
        ])
      }
    })
  })

  autoTable(doc, {
    startY: 48,
    head: [['Date', 'Roll No.', 'Student Name', 'Subject', 'Status']],
    body: tableData,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9 },
  })

  doc.save(`attendance_${sectionInfo.trade}_sem${sectionInfo.semester}_${format(new Date(), 'yyyyMMdd')}.pdf`)
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
