import type { PdfReport, ReportSection } from './pdfReportModel'
import { privacyNotice } from './pdfReportModel.ts'

const navy = [23, 54, 93] as const
const blue = [37, 99, 235] as const
const ink = [11, 15, 20] as const
const muted = [91, 105, 123] as const
const border = [229, 231, 235] as const

type Pdf = InstanceType<typeof import('jspdf').jsPDF>

function text(pdf: Pdf, value: string, x: number, y: number, width: number, size = 9, color: readonly number[] = ink): number {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(size)
  pdf.setTextColor(color[0], color[1], color[2])
  const lines = pdf.splitTextToSize(value, width) as string[]
  pdf.text(lines, x, y)
  return y + lines.length * (size * 0.43 + 1)
}

function pageHeader(pdf: Pdf, title: string): void {
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, 210, 34, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(255, 255, 255)
  pdf.text('EvalDoc', 17, 17)
  pdf.setFontSize(8.5)
  pdf.text(title, 193, 17, { align: 'right', maxWidth: 120 })
  pdf.setFillColor(...blue)
  pdf.rect(0, 34, 210, 1.6, 'F')
}

function footer(pdf: Pdf, page: number, total: number): void {
  pdf.setDrawColor(...border)
  pdf.line(17, 278, 193, 278)
  text(pdf, privacyNotice, 17, 284, 152, 7, muted)
  pdf.setFontSize(7)
  pdf.setTextColor(...muted)
  pdf.text(`${page} / ${total}`, 193, 284, { align: 'right' })
}

export async function renderPdfReport(report: PdfReport): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  pdf.setProperties({ title: report.title, subject: 'Resultados agregados EvalDoc', author: 'EvalDoc', creator: 'EvalDoc' })
  const left = 17
  const right = 193
  const usable = right - left
  let y = 44
  pageHeader(pdf, report.title)

  function nextPage(required: number, sectionTitle?: string): void {
    if (y + required <= 271) return
    pdf.addPage()
    pageHeader(pdf, report.title)
    y = 44
    if (sectionTitle) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(...navy)
      pdf.text(`${sectionTitle} (continuación)`, left, y)
      y += 9
    }
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(...ink)
  y = text(pdf, report.title, left, y + 2, usable, 18, ink) + 3
  y = text(pdf, `Institución: ${report.institution}`, left, y, usable, 10, navy) + 1
  y = text(pdf, `Periodo: ${report.period}`, left, y, usable, 9, muted) + 1
  const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(report.generatedAt)
  y = text(pdf, `Generado: ${date}`, left, y, usable, 9, muted) + 2
  if (report.filters.length) {
    y = text(pdf, `Filtros: ${report.filters.join(' · ')}`, left, y, usable, 8.5, muted) + 4
  }
  pdf.setDrawColor(...border)
  pdf.line(left, y, right, y)
  y += 9

  for (let index = 0; index < report.metrics.length; index += 2) {
    nextPage(23)
    for (let column = 0; column < 2; column++) {
      const metric = report.metrics[index + column]
      if (!metric) continue
      const x = left + column * 90
      pdf.setFillColor(246, 248, 251)
      pdf.roundedRect(x, y, 85, 20, 2, 2, 'F')
      text(pdf, metric.label, x + 4, y + 6, 77, 7.5, muted)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.setTextColor(...navy)
      pdf.text(metric.value, x + 4, y + 15, { maxWidth: 77 })
    }
    y += 25
  }

  function renderTable(section: ReportSection): void {
    if (!section.rows.length) {
      y = text(pdf, section.note ?? 'Sin datos para los filtros seleccionados.', left, y, usable, 9, muted) + 3
      return
    }
    const n = section.columns.length
    const widths = n === 6 ? [22, 54, 25, 25, 25, 25]
      : n === 5 && section.columns[0] === 'Nombre' ? [72, 26, 26, 26, 26]
        : n === 5 ? [48, 29, 37, 30, 32]
          : n === 4 && section.columns[0] === 'Ámbito' ? [25, 81, 35, 35]
            : n === 4 && section.columns[0] === '#' ? [12, 94, 35, 35]
              : n === 4 ? [95, 27, 27, 27]
              : section.columns[0] === '#' ? [12, 128, 36] : [100, 40, 36]
    const header = () => {
      pdf.setFillColor(...navy)
      pdf.rect(left, y, usable, 10, 'F')
      let x = left
      section.columns.forEach((column, index) => {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7)
        pdf.setTextColor(255, 255, 255)
        pdf.text(column, x + 2, y + 6.5, { maxWidth: widths[index] - 4 })
        x += widths[index]
      })
      y += 10
    }
    header()
    for (const [rowIndex, row] of section.rows.entries()) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const lineCounts = row.map((value, index) => (pdf.splitTextToSize(value, widths[index] - 4) as string[]).length)
      const height = Math.max(10, Math.max(...lineCounts) * 4.1 + 4)
      if (y + height > 271) {
        nextPage(height + 10, section.title)
        header()
      }
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(246, 248, 251)
        pdf.rect(left, y, usable, height, 'F')
      }
      let x = left
      row.forEach((value, index) => {
        text(pdf, value, x + 2, y + 5.4, widths[index] - 4, 8, ink)
        x += widths[index]
      })
      pdf.setDrawColor(...border)
      pdf.line(left, y + height, right, y + height)
      y += height
    }
    y += 4
  }

  function renderBars(section: ReportSection): void {
    for (const bar of section.bars ?? []) {
      nextPage(15, section.title)
      y = text(pdf, bar.label, left, y + 3, 126, 8, ink)
      pdf.setFillColor(229, 235, 245)
      pdf.roundedRect(left, y - 1, 143, 3, 1.5, 1.5, 'F')
      pdf.setFillColor(...blue)
      pdf.roundedRect(left, y - 1, 143 * Math.max(0, Math.min(1, bar.value / bar.maximum)), 3, 1.5, 1.5, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(...navy)
      pdf.text(`${bar.value.toFixed(1)} / ${bar.maximum}`, right, y + 1.5, { align: 'right' })
      y += 7
    }
  }

  for (const section of report.sections) {
    nextPage(22, section.title)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(...navy)
    y = text(pdf, section.title, left, y + 2, usable, 12, navy) + 4
    renderTable(section)
    if (section.bars?.length) renderBars(section)
    if (section.note && section.rows.length) y = text(pdf, section.note, left, y, usable, 8, muted) + 2
    y += 5
  }

  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    footer(pdf, page, pages)
  }
  return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' })
}

export function downloadPdf(blob: Blob, filename: string): void {
  if (blob.type !== 'application/pdf' || blob.size === 0) throw new Error('pdf_invalid')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
