import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { InstitutionCard } from '../../components/ui/InstitutionCard'
import { MetricCard } from '../../components/ui/MetricCard'
import { institutionsDashboard } from '../../data/mock/institutionsDashboard'
import type { InstitutionOverview } from '../../types'

const formatNumber = (value: number) => value.toLocaleString('en-US')
const columns: DataColumn<InstitutionOverview>[] = [
  { label: 'Institución', render: (institution) => institution.shortName },
  { label: 'Docentes', render: (institution) => formatNumber(institution.teachers) },
  { label: 'Estudiantes', render: (institution) => formatNumber(institution.students) },
  { label: 'Evaluaciones', render: (institution) => formatNumber(institution.evaluations) },
  { label: 'Promedio / 10', render: (institution) => institution.averageScore.toFixed(1) },
  { label: 'Participación', render: (institution) => institution.participation + '%' },
]

export function InstitutionsPage() {
  const data = institutionsDashboard
  return <InstitutionalLayout role="admin" active="institutions" title="Instituciones" subtitle="Participación y desempeño de la red EvalDoc" period={data.period}>
    <div className="institutional-content">
      <div className="metric-grid institutional-metrics" aria-label="Resumen multiinstitución">
        <MetricCard label="Alumnos" value={(data.students / 1000).toFixed(1) + 'K'} caption="En la red EvalDoc" />
        <MetricCard label="Docentes" value={formatNumber(data.teachers)} caption="En 7 instituciones" />
        <MetricCard label="Evaluaciones" value={(data.evaluations / 1000).toFixed(1) + 'K'} caption="Registradas" />
        <MetricCard label="Participación promedio" value={data.averageParticipation + '%'} caption="Cobertura general" />
      </div>
      <section aria-labelledby="institutions-title"><h2 className="institutional-section-title" id="institutions-title">Instituciones participantes</h2>
        <div className="institution-card-grid">{data.institutions.map((institution) => <InstitutionCard key={institution.id} institution={institution} />)}</div>
      </section>
      <DataTable title="Resumen por institución" columns={columns} rows={data.institutions} getRowKey={(institution) => institution.id} minWidth={820} />
    </div>
  </InstitutionalLayout>
}
