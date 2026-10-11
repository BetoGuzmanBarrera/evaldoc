import type { AnalyticsBreakdownRow, AnalyticsOverview, AnalyticsTrendPoint, QuestionAnalyticsRow } from './institutionalAnalytics'
import type { ParticipationRow, TeacherRankingRow, HrTeacherRow } from './institutionalDashboards'
import type { TeacherAssignmentResult, TeacherPeriodResult } from './teacherResults'
import { classifyTeacherScore, pdfClassificationDisclaimer, teacherClassificationLabel } from './teacherClassification.ts'

export type ReportKind = 'Avance' | 'Participacion' | 'Docente' | 'Historico' | 'Institucional'

export interface ReportSection {
  title: string
  columns: string[]
  rows: string[][]
  bars?: { label: string; value: number; maximum: number }[]
  note?: string
}

export interface PdfReport {
  kind: ReportKind
  title: string
  institution: string
  period: string
  generatedAt: Date
  filters: string[]
  metrics: { label: string; value: string }[]
  sections: ReportSection[]
}

export const privacyNotice = 'Los resultados presentados son agregados y protegen la identidad de los estudiantes.'
export const insufficientNotice = 'Resultados insuficientes para proteger el anonimato.'

const score = (value: number | null) => value === null ? 'Protegido' : `${value.toFixed(1)} / 10`
const percent = (value: number) => `${value.toFixed(1)}%`
const scope = (value: ParticipationRow['scope']) => ({ total: 'Total', campus: 'Campus', program: 'Programa', group: 'Grupo', period: 'Periodo' })[value]

export function safePdfFilename(report: PdfReport, subject?: string): string {
  const segment = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b[0-9a-f]{32}\b/gi, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 42) || 'General'
  return ['EvalDoc', report.kind, subject ? segment(subject) : segment(report.institution), segment(report.period)].join('_') + '.pdf'
}

export function progressReport(base: Omit<PdfReport, 'kind' | 'title' | 'metrics' | 'sections'>, rows: ParticipationRow[]): PdfReport {
  const total = rows.find((row) => row.scope === 'total')
  return {
    ...base, kind: 'Avance', title: 'Avance de evaluaciones',
    metrics: [
      { label: 'Esperadas', value: String(total?.expected ?? 0) },
      { label: 'Realizadas', value: String(total?.completed ?? 0) },
      { label: 'Pendientes', value: String(total?.pending ?? 0) },
      { label: 'Avance', value: percent(total?.participation ?? 0) },
    ],
    sections: [{ title: 'Avance por ámbito', columns: ['Ámbito', 'Nombre', 'Esperadas', 'Realizadas', 'Pendientes', 'Avance'],
      rows: rows.filter((row) => row.scope !== 'total').map((row) => [scope(row.scope), row.label, String(row.expected), String(row.completed), String(row.pending), percent(row.participation)]),
      note: rows.length <= 1 ? 'No hay evaluaciones registradas para los filtros seleccionados.' : undefined,
    }],
  }
}

export function participationReport(base: Omit<PdfReport, 'kind' | 'title' | 'metrics' | 'sections'>, rows: ParticipationRow[]): PdfReport {
  const total = rows.find((row) => row.scope === 'total')
  return {
    ...base, kind: 'Participacion', title: 'Participación estudiantil',
    metrics: [
      { label: 'Participación', value: percent(total?.participation ?? 0) },
      { label: 'Esperadas', value: String(total?.expected ?? 0) },
      { label: 'Realizadas', value: String(total?.completed ?? 0) },
      { label: 'Pendientes', value: String(total?.pending ?? 0) },
    ],
    sections: ['campus', 'program', 'group', 'period'].map((group) => ({
      title: `Participación por ${{ campus: 'campus', program: 'programa', group: 'grupo', period: 'periodo' }[group as 'campus' | 'program' | 'group' | 'period']}`,
      columns: ['Nombre', 'Esperadas', 'Realizadas', 'Pendientes', 'Participación'],
      rows: rows.filter((row) => row.scope === group).map((row) => [row.label, String(row.expected), String(row.completed), String(row.pending), percent(row.participation)]),
    })),
  }
}

export function teacherReport(base: Omit<PdfReport, 'kind' | 'title' | 'metrics' | 'sections'>, teacherName: string, assignment: TeacherAssignmentResult, history: TeacherPeriodResult[]): PdfReport {
  const classification = classifyTeacherScore(assignment.averageScore, assignment.published ? assignment.responseCount : 0)
  const published = classification !== 'protected' && classification !== 'unavailable'
  const questions = published && assignment.questions.length === 15 ? [...assignment.questions].sort((a, b) => a.position - b.position) : []
  const ordered = [...questions].sort((a, b) => a.score - b.score)
  const insight = ordered.length === 15 && ordered[0].score < ordered[14].score
    ? `Fortaleza: ${ordered[14].label}. Área de oportunidad: ${ordered[0].label}.`
    : undefined
  return {
    ...base, kind: 'Docente', title: `Resultados docentes · ${teacherName}`,
    period: assignment.periodName,
    filters: [...base.filters, `Campus: ${assignment.campusName ?? 'No configurado'}`, `Programa: ${assignment.programName ?? 'No configurado'}`, `Materia: ${assignment.subjectName}`, `Grupo: ${assignment.groupCode}`],
    metrics: [
      { label: 'Evaluaciones', value: String(assignment.responseCount) },
      { label: 'Promedio general', value: published ? score(assignment.averageScore) : classification === 'protected' ? 'Protegido' : 'No disponible' },
      { label: 'Clasificación institucional', value: teacherClassificationLabel(classification) },
      { label: 'Valoración favorable', value: published && assignment.favorablePercent !== null ? percent(assignment.favorablePercent) : classification === 'protected' ? 'Protegido' : 'No disponible' },
    ],
    sections: [
      { title: 'Reactivos oficiales', columns: ['#', 'Reactivo', 'Promedio'],
        rows: questions.map((item) => [String(item.position), item.label, score(item.score)]),
        bars: questions.map((item) => ({ label: `${item.position}. ${item.label}`, value: item.score, maximum: 10 })),
        note: questions.length === 0 ? published ? 'El desglose no está disponible por coexistencia de versiones de plantilla.' : insufficientNotice : insight,
      },
      { title: 'Histórico publicable', columns: ['Periodo', 'Evaluaciones publicables', 'Promedio'],
        rows: history.map((item) => [item.name, String(item.publishedResponses), score(item.averageScore)]),
      },
      { title: 'Nota institucional', columns: [], rows: [], note: pdfClassificationDisclaimer },
    ],
  }
}

export function historyReport(base: Omit<PdfReport, 'kind' | 'title' | 'metrics' | 'sections'>, periods: { name: string; startsAt: string; averageScore: number | null; responseCount: number }[], teacherHistory = false): PdfReport {
  const sorted = [...periods].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const rows = sorted.map((item, index) => {
    const previous = sorted[index - 1]
    const delta = previous?.averageScore != null && item.averageScore != null ? item.averageScore - previous.averageScore : null
    const relative = delta !== null && previous?.averageScore != null && previous.averageScore !== 0 ? (delta / previous.averageScore) * 100 : null
    const values = [item.name, String(item.responseCount), score(item.averageScore), delta === null ? 'Sin comparativo' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`, relative === null ? '—' : `${relative >= 0 ? '+' : ''}${relative.toFixed(1)}%`]
    return teacherHistory ? [...values, teacherClassificationLabel(classifyTeacherScore(item.averageScore, item.responseCount))] : values
  })
  const publishable = sorted.filter((item) => item.averageScore !== null)
  return {
    ...base, kind: 'Historico', title: 'Comparativo histórico',
    metrics: [{ label: 'Periodos', value: String(sorted.length) }, { label: 'Con resultados publicables', value: String(publishable.length) }],
    sections: [{ title: 'Evolución por periodo', columns: ['Periodo', 'Respuestas', 'Promedio', 'Cambio', 'Cambio %', ...(teacherHistory ? ['Clasificación'] : [])], rows,
      bars: publishable.map((item) => ({ label: item.name, value: item.averageScore ?? 0, maximum: 10 })),
      note: sorted.length === 0 ? 'No hay periodos con datos para los filtros seleccionados.' : undefined,
    }, ...(teacherHistory ? [{ title: 'Nota institucional', columns: [], rows: [], note: pdfClassificationDisclaimer }] : [])],
  }
}

export function executiveReport(base: Omit<PdfReport, 'kind' | 'title' | 'metrics' | 'sections'>, data: {
  overview: AnalyticsOverview
  trend: AnalyticsTrendPoint[]
  breakdown?: AnalyticsBreakdownRow[]
  questions?: QuestionAnalyticsRow[]
  ranking?: TeacherRankingRow[]
  hr?: HrTeacherRow[]
}): PdfReport {
  return {
    ...base, kind: 'Institucional', title: 'Informe institucional ejecutivo',
    metrics: [
      { label: 'Promedio / 10', value: score(data.overview.averageScore) },
      { label: 'Participación', value: percent(data.overview.participation) },
      { label: 'Esperadas', value: String(data.overview.expected) },
      { label: 'Realizadas', value: String(data.overview.completed) },
      { label: 'Pendientes', value: String(data.overview.pending) },
      { label: 'Docentes publicables', value: String(data.overview.teacherCount) },
    ],
    sections: [
      { title: 'Tendencia institucional · todos los periodos', columns: ['Periodo', 'Promedio', 'Respuestas', 'Participación'],
        rows: data.trend.map((item) => [item.periodName, score(item.averageScore), String(item.responseCount), percent(item.participation)]),
        bars: data.trend.filter((item) => item.averageScore !== null).map((item) => ({ label: item.periodName, value: item.averageScore ?? 0, maximum: 10 })),
      },
      { title: 'Campus, programas y grupos publicables', columns: ['Ámbito', 'Nombre', 'Promedio', 'Respuestas'],
        rows: (data.breakdown ?? []).map((item) => [scope(item.scope), item.label, score(item.averageScore), String(item.responseCount)]),
      },
      { title: 'Reactivos oficiales agregados', columns: ['#', 'Reactivo', 'Promedio', 'Respuestas'],
        rows: (data.questions ?? []).map((item) => [String(item.order), item.text, score(item.averageScore), String(item.responseCount)]),
      },
      { title: 'Docentes publicables', columns: ['Docente', 'Promedio', 'Respuestas', 'Clasificación'],
        rows: (data.ranking ?? []).map((item) => [item.name, score(item.averageScore), String(item.responseCount), teacherClassificationLabel(classifyTeacherScore(item.averageScore, item.responseCount))]),
      },
      { title: 'Nota institucional', columns: [], rows: [], note: data.ranking ? pdfClassificationDisclaimer : undefined },
      { title: 'Indicadores de RRHH', columns: ['Docente', 'Categoría', 'Promedio'],
        rows: (data.hr ?? []).map((item) => [item.name, item.category, score(item.averageScore)]),
        note: data.hr?.length ? 'Categorías descriptivas; no representan decisiones laborales automáticas.' : undefined,
      },
    ].filter((section) => section.rows.length > 0 || section.note),
  }
}
