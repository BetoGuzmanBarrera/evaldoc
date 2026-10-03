import { loadAnalyticsBreakdown, loadAnalyticsOverview, loadAnalyticsTrend, loadQuestionAnalytics } from './institutionalAnalytics'
import { loadHrMetrics, loadInstitutionOverview, loadInstitutionalOptions, loadParticipation, loadRanking, type InstitutionalFilters } from './institutionalDashboards'
import { loadTeacherAssignments, loadTeacherHistory } from './teacherResults'
import { executiveReport, historyReport, participationReport, progressReport, teacherReport, type PdfReport } from './pdfReportModel'

type InstitutionalRole = 'coordinator' | 'hr' | 'admin'
type InstitutionalKind = 'progress' | 'participation' | 'history' | 'executive'

export type ReportRequest =
  | { kind: 'teacher'; assignmentId: string; teacherName: string; institution: string }
  | { kind: 'teacherHistory'; institution: string }
  | { kind: InstitutionalKind; role: InstitutionalRole; filters: InstitutionalFilters }

export async function loadPdfReport(request: ReportRequest): Promise<PdfReport> {
  const generatedAt = new Date()
  if (request.kind === 'teacher') {
    // The RPC checks auth.uid() and returns only the current teacher's assignment.
    const [assignments, history] = await Promise.all([
      loadTeacherAssignments(request.assignmentId), loadTeacherHistory(),
    ])
    const assignment = assignments.find((item) => item.id === request.assignmentId)
    if (!assignment) throw new Error('report_access_denied')
    return teacherReport({ institution: request.institution, period: assignment.periodName, generatedAt, filters: [] }, request.teacherName, assignment, history)
  }
  if (request.kind === 'teacherHistory') {
    const history = await loadTeacherHistory()
    return historyReport({ institution: request.institution, period: 'Todos los periodos', generatedAt, filters: [] },
      history.map((item) => ({ name: item.name, startsAt: item.startsAt, averageScore: item.averageScore, responseCount: item.publishedResponses })))
  }

  // Every institutional RPC resolves the institution and active role in PostgreSQL.
  const [institution, options] = await Promise.all([loadInstitutionOverview(), loadInstitutionalOptions()])
  const filters = request.filters
  const label = (id: string | undefined) => options.find((item) => item.id === id)?.label
  const period = label(filters.period) ?? 'Todos los periodos'
  const filterLabels = [
    filters.campus && `Campus: ${label(filters.campus) ?? 'Seleccionado'}`,
    filters.program && `Programa: ${label(filters.program) ?? 'Seleccionado'}`,
    filters.group && `Grupo: ${label(filters.group) ?? 'Seleccionado'}`,
    filters.period && `Periodo: ${period}`,
  ].filter((item): item is string => Boolean(item))
  const base = { institution: institution.name, period, generatedAt, filters: filterLabels }

  if (request.kind === 'progress') return progressReport(base, await loadParticipation(filters))
  if (request.kind === 'participation') return participationReport(base, await loadParticipation(filters))
  if (request.kind === 'history') {
    const trend = await loadAnalyticsTrend(filters)
    return historyReport({ ...base, period: 'Todos los periodos', filters: [
      ...filterLabels.filter((item) => !item.startsWith('Periodo:')),
      ...(filters.period ? [`Periodo de referencia: ${period}; la serie incluye todos los periodos`] : []),
    ] }, trend.map((item) => ({ name: item.periodName, startsAt: item.startsAt, averageScore: item.averageScore, responseCount: item.responseCount })))
  }

  const [overview, trend] = await Promise.all([loadAnalyticsOverview(filters), loadAnalyticsTrend(filters)])
  if (request.role === 'admin') return executiveReport(base, { overview, trend })
  const [breakdown, questions, ranking, hr] = await Promise.all([
    loadAnalyticsBreakdown(filters), loadQuestionAnalytics(filters), loadRanking(filters),
    request.role === 'hr' ? loadHrMetrics(filters.period ?? null, filters.campus ?? null) : Promise.resolve([]),
  ])
  return executiveReport(base, { overview, trend, breakdown, questions, ranking, hr })
}
