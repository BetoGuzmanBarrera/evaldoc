import { useCallback, useState } from 'react'
import { Info } from 'lucide-react'
import { AnalyticsTrendChart } from '../../components/charts/AnalyticsTrendChart'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { FilterBar } from '../../components/ui/FilterBar'
import { InstitutionalFeedback } from '../../components/ui/InstitutionalFeedback'
import { MetricCard } from '../../components/ui/MetricCard'
import { PeriodComparisonCard } from '../../components/ui/AnalyticsInsights'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import {
  loadAnalyticsOverview, loadAnalyticsTrend, loadPeriodComparison, loadTeacherTrends,
} from '../../lib/institutionalAnalytics'
import {
  loadHrMetrics, loadInstitutionalOptions,
  type HrCategory, type HrTeacherRow,
} from '../../lib/institutionalDashboards'
import type { DashboardFilter } from '../../types'

const categories: { label: HrCategory; tone: string; range: string }[] = [
  { label: 'Excelente', tone: 'green', range: '9.0–10.0' },
  { label: 'Bueno', tone: 'blue', range: '8.0–8.9' },
  { label: 'Suficiente', tone: 'yellow', range: '7.0–7.9' },
  { label: 'No Suficiente', tone: 'red', range: '0.0–6.9' },
]
const columns: DataColumn<HrTeacherRow>[] = [
  { label: 'Docente', render: (teacher) => teacher.name },
  { label: 'Promedio / 10', render: (teacher) => teacher.averageScore.toFixed(1) },
  { label: 'Categoría', render: (teacher) => teacher.category },
  { label: 'Indicador del proyecto', render: (teacher) => teacher.recommendation },
  { label: 'Máximo de materias', render: (teacher) => teacher.maximumSubjects },
  { label: 'Materias evaluadas', render: (teacher) => teacher.subjectCount },
  { label: 'Respuestas', render: (teacher) => teacher.responseCount },
]

export function HrDashboardPage() {
  const [period, setPeriod] = useState('')
  const [campus, setCampus] = useState('')
  const [category, setCategory] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const loader = useCallback(async () => {
    const [options, teachers, overview, trend, comparison] = await Promise.all([
      loadInstitutionalOptions(), loadHrMetrics(period || null, campus || null),
      loadAnalyticsOverview({ period, campus }), loadAnalyticsTrend({ campus }),
      loadPeriodComparison({ period, campus }),
    ])
    return { options, teachers, overview, trend, comparison }
  }, [period, campus])
  const { data, loading, error, reload } = useInstitutionalData(`${period}:${campus}`, loader)
  const teacherTrendLoader = useCallback(() => teacherId ? loadTeacherTrends(teacherId, { campus }) : Promise.resolve([]), [teacherId, campus])
  const teacherTrend = useInstitutionalData(`teacher:${teacherId}:${campus}`, teacherTrendLoader)
  const teachers = data?.teachers.filter((teacher) => !category || teacher.category === category) ?? []
  const filters: DashboardFilter[] = [
    { id: 'campus', label: 'Campus', options: (data?.options ?? []).filter((item) => item.scope === 'campus').map((item) => ({ value: item.id, label: item.label })) },
    { id: 'category', label: 'Categoría', options: categories.map((item) => ({ value: item.label, label: item.label })) },
    { id: 'period', label: 'Periodo', options: (data?.options ?? []).filter((item) => item.scope === 'period').map((item) => ({ value: item.id, label: item.label })) },
  ]
  const periodName = data?.options.find((item) => item.id === period)?.label ?? 'Todos los periodos'

  return <InstitutionalLayout role="hr" title="Recursos Humanos" subtitle="Indicadores consolidados para acompañamiento docente" period={periodName}>
    <div className="institutional-content">
      <InstitutionalFeedback loading={loading} error={error} onRetry={reload} />
      {data && <>
        <section className="surface hr-overview" aria-label="Resumen de recursos humanos">
          <FilterBar embedded filters={filters} values={{ campus, category, period }} onChange={(id, value) => {
            if (id === 'campus') { setCampus(value); setTeacherId('') }
            if (id === 'category') setCategory(value)
            if (id === 'period') { setPeriod(value); setTeacherId('') }
          }} />
          <div className="metric-grid institutional-metrics" aria-label="Indicadores principales">
            <MetricCard label="Docentes evaluados" value={data.teachers.length} caption="Con resultados publicables" />
            <MetricCard label="Promedio institucional" value={data.overview.averageScore === null ? '— / 10' : data.overview.averageScore.toFixed(1) + ' / 10'} caption="Solo asignaciones publicables" />
            <MetricCard label="Respuestas publicables" value={data.overview.responseCount} caption="En el filtro seleccionado" />
            <MetricCard label="Docentes destacados" value={data.teachers.filter((teacher) => teacher.category === 'Excelente').length} caption="Categoría Excelente" />
          </div>
          <div className="hr-category-grid" aria-label="Docentes por categoría">{categories.map((item) => <div className={'hr-category hr-category-' + item.tone} key={item.label}>
            <span className="hr-category-dot" aria-hidden="true" /><div><strong>{data.teachers.filter((teacher) => teacher.category === item.label).length}</strong><span>{item.label} · {item.range}</span></div>
          </div>)}</div>
        </section>
        <div className="analytics-panels">
          <AnalyticsTrendChart title="Evolución del promedio institucional" points={data.trend.map((row) => ({ id: row.periodId, label: row.periodName, score: row.averageScore, responseCount: row.responseCount }))} />
          <PeriodComparisonCard comparison={data.comparison} />
        </div>
        {data.teachers.length === 0 && <EmptyState title="Resultados insuficientes" message="No hay docentes con asignaciones que alcancen cinco evaluaciones completas en este filtro." />}
        <DataTable title="Ranking e indicadores docentes" columns={columns} rows={teachers} getRowKey={(teacher) => teacher.id} emptyMessage="No hay docentes de esta categoría para los filtros seleccionados." minWidth={940} />
        {data.teachers.length > 0 && <label className="analytics-teacher-picker">Tendencia de un docente
          <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="">Seleccionar docente</option>
            {data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </label>}
        {teacherId && <>
          <InstitutionalFeedback loading={teacherTrend.loading} error={teacherTrend.error} onRetry={teacherTrend.reload} />
          {teacherTrend.data && <AnalyticsTrendChart title="Tendencia docente por periodo" points={teacherTrend.data.map((row) => ({ id: row.periodId, label: row.periodName, score: row.averageScore, responseCount: row.responseCount }))} />}
        </>}
        <p className="hr-disclaimer"><Info size={18} aria-hidden="true" /> Estas categorías son indicadores definidos por el proyecto, derivados del promedio en escala 0–10. No representan decisiones laborales automáticas.</p>
      </>}
    </div>
  </InstitutionalLayout>
}
