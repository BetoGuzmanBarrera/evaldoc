import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { loadPdfReport, type ReportRequest } from '../../lib/loadPdfReport'
import { safePdfFilename } from '../../lib/pdfReportModel'
import { downloadPdf, renderPdfReport } from '../../lib/renderPdfReport'

export function PdfDownloadButton({ request, label = 'Descargar PDF', className = 'button button-outline' }: {
  request: ReportRequest
  label?: string
  className?: string
}) {
  const busy = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function download() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setError(false)
    try {
      const report = await loadPdfReport(request)
      const blob = await renderPdfReport(report)
      downloadPdf(blob, safePdfFilename(report, request.kind === 'teacher' ? request.teacherName : undefined))
    } catch {
      setError(true)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return <span className="pdf-download-control">
    <button className={className} type="button" onClick={() => void download()} disabled={loading} aria-busy={loading}>
      <Download size={16} aria-hidden="true" />{loading ? 'Generando PDF…' : label}
    </button>
    {error && <span className="pdf-download-error" role="alert">No se pudo generar el PDF. Inténtalo de nuevo.</span>}
  </span>
}
