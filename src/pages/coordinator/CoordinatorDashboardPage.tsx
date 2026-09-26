import { useState } from 'react'
import { ParticipationChart } from '../../components/charts/ParticipationChart'
import { ScoreRing } from '../../components/charts/ScoreRing'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { FilterBar } from '../../components/ui/FilterBar'
import { MetricCard } from '../../components/ui/MetricCard'
import { coordinatorDashboard } from '../../data/mock/coordinatorDashboard'
import type { CoordinatorDashboardData } from '../../types'

type RankedTeacher = CoordinatorDashboardData['topTeachers'][number]
const columns: DataColumn<RankedTeacher>[] = [
  { label: 'Pos.', render: (teacher) => teacher.rank },
  { label: 'Docente', render: (teacher) => teacher.name },
  { label: 'Institución', render: (teacher) => teacher.institution },
  { label: 'Promedio / 10', render: (teacher) => teacher.score.toFixed(1) },
  { label: 'Respuestas', render: (teacher) => teacher.responses },
]

export function CoordinatorDashboardPage() {
  const data = coordinatorDashboard
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [demoMessage, setDemoMessage] = useState('')
  const institution = data.institutions.find((item) => item.id === filters.institution)
  const chartPoints = institution ? [institution] : data.institutions
  const teachers = institution ? data.topTeachers.filter((teacher) => teacher.institution === institution.label) : data.topTeachers
  const actions = <div className="institutional-action-buttons">
    <button className="button button-outline" type="button" onClick={() => setDemoMessage('La exportación estará disponible en una próxima versión.')}>Exportar</button>
    <button className="button button-primary" type="button" onClick={() => setDemoMessage('La generación de reportes estará disponible en una próxima versión.')}>Generar reporte</button>
  </div>

  return <InstitutionalLayout role="coordinator" title="Panel de Coordinación" subtitle="Monitoreo de participación y desempeño institucional" period={data.period} actions={actions}>
    <div className="institutional-content">
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <FilterBar filters={data.filters} values={filters} onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))} />
      <div className="metric-grid institutional-metrics" aria-label="Resumen de coordinación">
        <MetricCard label="Participación general" value={data.participation + '%'} caption="↑ 6% vs. anterior" />
        <MetricCard label="Evaluaciones realizadas" value={data.evaluations.toLocaleString('en-US')} caption="+182 esta semana" />
        <MetricCard label="Estudiantes activos" value={data.activeStudents} caption="94% con acceso" />
        <MetricCard label="Docentes evaluados" value={data.evaluatedTeachers} caption="87% de cobertura" />
      </div>
      <div className="institutional-chart-grid">
        <ParticipationChart points={chartPoints} />
        <ScoreRing score={data.averageScore} />
      </div>
      <DataTable title="Top docentes evaluados" columns={columns} rows={teachers} getRowKey={(teacher) => teacher.id} minWidth={660} />
    </div>
  </InstitutionalLayout>
}
