import { useCallback } from 'react'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { InstitutionCard } from '../../components/ui/InstitutionCard'
import { InstitutionalFeedback } from '../../components/ui/InstitutionalFeedback'
import { MetricCard } from '../../components/ui/MetricCard'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import { loadInstitutionOverview, type InstitutionOverview } from '../../lib/institutionalDashboards'
import { useAuth } from '../../hooks/useAuth'

const columns: DataColumn<InstitutionOverview>[] = [
  { label: 'Institución', render: (row) => row.shortName },
  { label: 'Campus', render: (row) => row.campusCount },
  { label: 'Programas', render: (row) => row.programCount },
  { label: 'Docentes', render: (row) => row.teacherCount },
  { label: 'Estudiantes', render: (row) => row.studentCount },
  { label: 'Evaluaciones', render: (row) => row.completed },
  { label: 'Promedio / 10', render: (row) => row.averageScore === null ? 'Protegido' : row.averageScore.toFixed(1) },
  { label: 'Participación', render: (row) => row.participation.toFixed(1) + '%' },
]

export function InstitutionsPage() {
  const { roles } = useAuth()
  const role = roles.includes('admin') ? 'admin' : roles.includes('hr') ? 'hr' : 'coordinator'
  const loader = useCallback(() => loadInstitutionOverview(), [])
  const { data, loading, error, reload } = useInstitutionalData('own-institution', loader)

  return <InstitutionalLayout role={role} active="institutions" title="Instituciones" subtitle="Resumen de tu institución" period="Todos los periodos">
    <div className="institutional-content">
      <InstitutionalFeedback loading={loading} error={error} onRetry={reload} />
      {data && <>
        <div className="metric-grid institutional-metrics" aria-label="Resumen de la institución">
          <MetricCard label="Estudiantes" value={data.studentCount} caption="Roles estudiantiles" />
          <MetricCard label="Docentes" value={data.teacherCount} caption="Roles docentes" />
          <MetricCard label="Evaluaciones" value={data.completed} caption={data.pending + ' pendientes de ' + data.expected + ' esperadas'} />
          <MetricCard label="Participación" value={data.participation.toFixed(1) + '%'} caption="Cobertura institucional" />
        </div>
        <section aria-labelledby="institutions-title"><h2 className="institutional-section-title" id="institutions-title">Tu institución</h2>
          <div className="institution-card-grid"><InstitutionCard institution={data} /></div>
        </section>
        <DataTable title="Resumen institucional" columns={columns} rows={[data]} getRowKey={(row) => row.id} minWidth={820} />
        {data.averageScore === null && <p className="institutional-privacy-note">El promedio aparecerá cuando exista al menos una asignación con cinco evaluaciones completas.</p>}
      </>}
    </div>
  </InstitutionalLayout>
}
