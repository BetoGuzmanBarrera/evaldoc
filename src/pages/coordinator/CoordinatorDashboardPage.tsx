import { useCallback, useState } from 'react'
import { PendingRequestsPanel } from '../../components/admin/PendingRequestsPanel'
import { ParticipationChart } from '../../components/charts/ParticipationChart'
import { AnalyticsTrendChart } from '../../components/charts/AnalyticsTrendChart'
import { ScoreRing } from '../../components/charts/ScoreRing'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { FilterBar } from '../../components/ui/FilterBar'
import { InstitutionalFeedback } from '../../components/ui/InstitutionalFeedback'
import { MetricCard } from '../../components/ui/MetricCard'
import { PdfDownloadButton } from '../../components/ui/PdfDownloadButton'
import { AnalyticsExtremes, PeriodComparisonCard } from '../../components/ui/AnalyticsInsights'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import { useAuth } from '../../hooks/useAuth'
import {
  loadAnalyticsBreakdown, loadAnalyticsOverview, loadAnalyticsTrend,
  loadPeriodComparison, loadQuestionAnalytics,
  type AnalyticsBreakdownRow, type QuestionAnalyticsRow,
} from '../../lib/institutionalAnalytics'
import {
  loadInstitutionalOptions, loadParticipation, loadRanking,
  type InstitutionalFilters, type ParticipationRow, type ParticipationScope,
  type TeacherRankingRow,
} from '../../lib/institutionalDashboards'
import type { DashboardFilter } from '../../types'

const rankingColumns: DataColumn<TeacherRankingRow>[] = [
  { label: 'Docente', render: (teacher) => teacher.name },
  { label: 'Promedio / 10', render: (teacher) => teacher.averageScore.toFixed(1) },
  { label: 'Respuestas publicables', render: (teacher) => teacher.responseCount },
  { label: 'Asignaciones', render: (teacher) => teacher.assignmentCount },
]
const participationColumns: DataColumn<ParticipationRow>[] = [
  { label: 'Ámbito', render: (row) => ({ campus: 'Campus', program: 'Programa', group: 'Grupo', period: 'Periodo', total: 'Total' })[row.scope] },
  { label: 'Nombre', render: (row) => row.label },
  { label: 'Esperadas', render: (row) => row.expected },
  { label: 'Realizadas', render: (row) => row.completed },
  { label: 'Pendientes', render: (row) => row.pending },
  { label: 'Avance', render: (row) => row.participation.toFixed(1) + '%' },
]
const breakdownColumns: DataColumn<AnalyticsBreakdownRow>[] = [
  { label: 'Ámbito', render: (row) => ({ campus: 'Campus', program: 'Programa', group: 'Grupo' })[row.scope] },
  { label: 'Nombre', render: (row) => row.label },
  { label: 'Promedio / 10', render: (row) => row.averageScore.toFixed(1) },
  { label: 'Respuestas publicables', render: (row) => row.responseCount },
  { label: 'Docentes', render: (row) => row.teacherCount },
]
const questionColumns: DataColumn<QuestionAnalyticsRow>[] = [
  { label: 'Reactivo oficial', render: (row) => `${row.order}. ${row.text}` },
  { label: 'Promedio / 10', render: (row) => row.averageScore.toFixed(1) },
  { label: 'Evaluaciones consideradas', render: (row) => row.responseCount },
]
const scopes: { id: ParticipationScope; label: string }[] = [
  { id: 'campus', label: 'Campus' }, { id: 'program', label: 'Programa' },
  { id: 'group', label: 'Grupo' }, { id: 'period', label: 'Periodo' },
]

export function CoordinatorDashboardPage() {
  const { profile } = useAuth()
  const [filters, setFilters] = useState<InstitutionalFilters>({})
  const [scope, setScope] = useState<ParticipationScope>('campus')
  const loader = useCallback(async () => {
    const [options, participation, ranking, overview, trend, comparison, breakdown, questions] = await Promise.all([
      loadInstitutionalOptions(), loadParticipation(filters), loadRanking(filters),
      loadAnalyticsOverview(filters), loadAnalyticsTrend(filters),
      loadPeriodComparison(filters), loadAnalyticsBreakdown(filters), loadQuestionAnalytics(filters),
    ])
    return { options, participation, ranking, overview, trend, comparison, breakdown, questions }
  }, [filters])
  const { data, loading, error, reload } = useInstitutionalData(JSON.stringify(filters), loader)
  const total = data?.participation.find((row) => row.scope === 'total')
  const chartRows = data?.participation.filter((row) => row.scope === scope) ?? []
  const options = data?.options ?? []
  const dashboardFilters: DashboardFilter[] = [
    { id: 'campus', label: 'Campus', options: options.filter((item) => item.scope === 'campus').map((item) => ({ value: item.id, label: item.label })) },
    { id: 'program', label: 'Programa / carrera', options: options.filter((item) => item.scope === 'program' && (!filters.campus || item.parentId === filters.campus)).map((item) => ({ value: item.id, label: item.label })) },
    { id: 'group', label: 'Grupo', options: options.filter((item) => item.scope === 'group' && (!filters.program || item.parentId === filters.program) && (!filters.period || item.periodId === filters.period)).map((item) => ({ value: item.id, label: item.label })) },
    { id: 'period', label: 'Periodo académico', options: options.filter((item) => item.scope === 'period').map((item) => ({ value: item.id, label: item.label })) },
  ]
  const periodName = options.find((item) => item.id === filters.period)?.label ?? 'Todos los periodos'
  const actions = <div className="institutional-action-buttons">
    <PdfDownloadButton request={{ kind: 'progress', role: 'coordinator', filters }} label="Avance PDF" />
    <PdfDownloadButton request={{ kind: 'participation', role: 'coordinator', filters }} label="Participación PDF" />
    <PdfDownloadButton request={{ kind: 'history', role: 'coordinator', filters }} label="Histórico PDF" />
    <PdfDownloadButton request={{ kind: 'executive', role: 'coordinator', filters }} label="Informe PDF" className="button button-primary" />
  </div>

  return <InstitutionalLayout role="coordinator" title="Panel de Coordinación" subtitle={`Responsable académico de ${profile?.institution_name ?? 'tu institución'}`} period={periodName} actions={actions}>
    <div className="institutional-content">
      <PendingRequestsPanel role="coordinator" onChanged={reload} />
      <InstitutionalFeedback loading={loading} error={error} onRetry={reload} />
      {data && <>
        <FilterBar filters={dashboardFilters} values={{ campus: filters.campus ?? '', program: filters.program ?? '', group: filters.group ?? '', period: filters.period ?? '' }} onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value || undefined, ...(id === 'campus' ? { program: undefined, group: undefined } : id === 'program' || id === 'period' ? { group: undefined } : {}) }))} />
        <div className="metric-grid institutional-metrics" aria-label="Resumen de coordinación">
          <MetricCard label="Participación general" value={(total?.participation ?? 0).toFixed(1) + '%'} caption={(total?.expected ?? 0) + (total?.expected === 1 ? ' evaluación esperada' : ' evaluaciones esperadas')} />
          <MetricCard label="Evaluaciones realizadas" value={total?.completed ?? 0} caption={(total?.pending ?? 0) + ' pendientes'} />
          <MetricCard label="Estudiantes esperados" value={total?.students ?? 0} caption="Con obligaciones en el filtro" />
          <MetricCard label="Docentes con resultados" value={data.overview.teacherCount} caption="Asignaciones publicables" />
        </div>
        {total?.expected === 0 && <EmptyState title="Periodo sin evaluaciones" message="No hay obligaciones registradas para los filtros seleccionados." />}
        <div className="institutional-chart-grid">
          <div className="institutional-chart-with-filter"><label>Desglose por <select value={scope} onChange={(event) => setScope(event.target.value as ParticipationScope)}>{scopes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            {chartRows.length ? <ParticipationChart title={'Participación por ' + (scopes.find((item) => item.id === scope)?.label.toLowerCase() ?? scope)} points={chartRows.map((row) => ({ id: row.id ?? row.label, label: row.label, participation: row.participation }))} />
              : <EmptyState title="Sin desglose" message="No hay registros en esta categoría para los filtros seleccionados." />}
          </div>
          <ScoreRing score={data.overview.averageScore} />
        </div>
        {data.overview.averageScore === null && total && total.completed > 0 && <p className="institutional-privacy-note">Resultados insuficientes para proteger el anonimato: los promedios requieren cinco evaluaciones completas por asignación.</p>}
        <div className="analytics-panels">
          <AnalyticsTrendChart title="Tendencia institucional por periodo" points={data.trend.map((row) => ({ id: row.periodId, label: row.periodName, score: row.averageScore, responseCount: row.responseCount }))} />
          <PeriodComparisonCard comparison={data.comparison} />
        </div>
        <DataTable title="Promedio por campus, programa y grupo" columns={breakdownColumns} rows={data.breakdown} getRowKey={(row) => row.scope + ':' + row.id} emptyMessage="Resultados insuficientes para proteger el anonimato en este filtro." minWidth={720} />
        <AnalyticsExtremes title="Docentes con promedios extremos" items={data.ranking.map((teacher) => ({ label: teacher.name, score: teacher.averageScore }))} />
        <DataTable title="Participación por campus, programa, grupo y periodo" columns={participationColumns} rows={data.participation.filter((row) => row.scope !== 'total')} getRowKey={(row) => row.scope + ':' + row.id} minWidth={680} />
        <DataTable title="Ranking docente institucional" columns={rankingColumns} rows={data.ranking} getRowKey={(teacher) => teacher.id} emptyMessage="No hay docentes con resultados publicables para estos filtros." minWidth={660} />
        <AnalyticsExtremes title="Reactivos con mayor y menor promedio" items={data.questions.map((question) => ({ label: question.text, score: question.averageScore }))} />
        <DataTable title="Promedio por reactivo oficial" columns={questionColumns} rows={data.questions} getRowKey={(row) => String(row.order) + ':' + row.text} emptyMessage="Resultados insuficientes para proteger el anonimato en este filtro." minWidth={760} />
      </>}
    </div>
  </InstitutionalLayout>
}
