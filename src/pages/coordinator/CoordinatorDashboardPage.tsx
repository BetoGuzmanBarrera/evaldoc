import { useCallback, useState } from 'react'
import { ParticipationChart } from '../../components/charts/ParticipationChart'
import { ScoreRing } from '../../components/charts/ScoreRing'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { FilterBar } from '../../components/ui/FilterBar'
import { InstitutionalFeedback } from '../../components/ui/InstitutionalFeedback'
import { MetricCard } from '../../components/ui/MetricCard'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import {
  loadInstitutionalOptions, loadParticipation, loadRanking, loadScoreSummary,
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
const scopes: { id: ParticipationScope; label: string }[] = [
  { id: 'campus', label: 'Campus' }, { id: 'program', label: 'Programa' },
  { id: 'group', label: 'Grupo' }, { id: 'period', label: 'Periodo' },
]

export function CoordinatorDashboardPage() {
  const [filters, setFilters] = useState<InstitutionalFilters>({})
  const [scope, setScope] = useState<ParticipationScope>('campus')
  const [demoMessage, setDemoMessage] = useState('')
  const loader = useCallback(async () => {
    const [options, participation, ranking, scores] = await Promise.all([
      loadInstitutionalOptions(), loadParticipation(filters), loadRanking(filters), loadScoreSummary(filters),
    ])
    return { options, participation, ranking, scores }
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
    <button className="button button-outline" type="button" onClick={() => setDemoMessage('La exportación estará disponible en una próxima versión.')}>Exportar</button>
    <button className="button button-primary" type="button" onClick={() => setDemoMessage('La generación de reportes estará disponible en una próxima versión.')}>Generar reporte</button>
  </div>

  return <InstitutionalLayout role="coordinator" title="Panel de Coordinación" subtitle="Monitoreo de participación y desempeño institucional" period={periodName} actions={actions}>
    <div className="institutional-content">
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <InstitutionalFeedback loading={loading} error={error} onRetry={reload} />
      {data && <>
        <FilterBar filters={dashboardFilters} values={{ campus: filters.campus ?? '', program: filters.program ?? '', group: filters.group ?? '', period: filters.period ?? '' }} onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value || undefined, ...(id === 'campus' ? { program: undefined, group: undefined } : id === 'program' || id === 'period' ? { group: undefined } : {}) }))} />
        <div className="metric-grid institutional-metrics" aria-label="Resumen de coordinación">
          <MetricCard label="Participación general" value={(total?.participation ?? 0).toFixed(1) + '%'} caption={(total?.expected ?? 0) + (total?.expected === 1 ? ' evaluación esperada' : ' evaluaciones esperadas')} />
          <MetricCard label="Evaluaciones realizadas" value={total?.completed ?? 0} caption={(total?.pending ?? 0) + ' pendientes'} />
          <MetricCard label="Estudiantes esperados" value={total?.students ?? 0} caption="Con obligaciones en el filtro" />
          <MetricCard label="Docentes con resultados" value={data.scores.teacherCount} caption="Asignaciones publicables" />
        </div>
        {total?.expected === 0 && <EmptyState title="Periodo sin evaluaciones" message="No hay obligaciones registradas para los filtros seleccionados." />}
        <div className="institutional-chart-grid">
          <div className="institutional-chart-with-filter"><label>Desglose por <select value={scope} onChange={(event) => setScope(event.target.value as ParticipationScope)}>{scopes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            {chartRows.length ? <ParticipationChart title={'Participación por ' + (scopes.find((item) => item.id === scope)?.label.toLowerCase() ?? scope)} points={chartRows.map((row) => ({ id: row.id ?? row.label, label: row.label, participation: row.participation }))} />
              : <EmptyState title="Sin desglose" message="No hay registros en esta categoría para los filtros seleccionados." />}
          </div>
          <ScoreRing score={data.scores.averageScore} />
        </div>
        {data.scores.averageScore === null && total && total.completed > 0 && <p className="institutional-privacy-note">Resultados insuficientes: los promedios requieren cinco evaluaciones completas por asignación.</p>}
        <DataTable title="Participación por campus, programa, grupo y periodo" columns={participationColumns} rows={data.participation.filter((row) => row.scope !== 'total')} getRowKey={(row) => row.scope + ':' + row.id} minWidth={680} />
        <DataTable title="Ranking docente institucional" columns={rankingColumns} rows={data.ranking} getRowKey={(teacher) => teacher.id} emptyMessage="No hay docentes con resultados publicables para estos filtros." minWidth={660} />
      </>}
    </div>
  </InstitutionalLayout>
}
