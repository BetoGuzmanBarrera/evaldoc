import { useCallback, useDeferredValue, useState } from 'react'
import { Search } from 'lucide-react'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { InstitutionalFeedback } from '../../components/ui/InstitutionalFeedback'
import { MetricCard } from '../../components/ui/MetricCard'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import { loadAdminSummary, loadAdminUsers, type AdminUserRow } from '../../lib/institutionalDashboards'

const roleNames: Record<string, string> = {
  student: 'Alumno', teacher: 'Docente', coordinator: 'Coordinación',
  hr: 'Recursos Humanos', admin: 'Administración',
}
const statusNames = { pending: 'Pendiente', active: 'Activo', inactive: 'Inactivo' }
const columns: DataColumn<AdminUserRow>[] = [
  { label: 'Nombre', render: (user) => user.name },
  { label: 'Correo', render: (user) => user.email },
  { label: 'Roles', render: (user) => user.roles.length ? user.roles.map((role) => roleNames[role] ?? role).join(', ') : 'Sin rol' },
  { label: 'Estado', render: (user) => statusNames[user.status] },
]

export function AdminDashboardPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const summaryLoader = useCallback(() => loadAdminSummary(), [])
  const usersLoader = useCallback(() => loadAdminUsers(deferredQuery || null), [deferredQuery])
  const summary = useInstitutionalData('admin-summary', summaryLoader)
  const users = useInstitutionalData('admin-users:' + deferredQuery, usersLoader)
  const counts = summary.data

  return <InstitutionalLayout role="admin" title="Administración" subtitle="Estructura y usuarios de tu institución" period="Todos los periodos">
    <div className="institutional-content">
      <InstitutionalFeedback loading={summary.loading} error={summary.error} onRetry={summary.reload} />
      {counts && <>
        <div className="metric-grid institutional-metrics" aria-label="Resumen de administración">
          <MetricCard label="Usuarios" value={counts.userCount} caption="Perfiles de esta institución" />
          <MetricCard label="Docentes" value={counts.teacherCount} caption="Roles asignados" />
          <MetricCard label="Alumnos" value={counts.studentCount} caption="Roles asignados" />
          <MetricCard label="Campus" value={counts.campusCount} caption={counts.programCount + (counts.programCount === 1 ? ' programa' : ' programas')} />
        </div>
        <div className="institutional-admin-details">
          <section className="surface institutional-count-panel"><h2>Estados de perfiles</h2><dl>
            <div><dt>Pendientes</dt><dd>{counts.pendingCount}</dd></div>
            <div><dt>Activos</dt><dd>{counts.activeCount}</dd></div>
            <div><dt>Inactivos</dt><dd>{counts.inactiveCount}</dd></div>
          </dl></section>
          <section className="surface institutional-count-panel"><h2>Roles asignados</h2><dl>
            <div><dt>Alumnos</dt><dd>{counts.studentCount}</dd></div>
            <div><dt>Docentes</dt><dd>{counts.teacherCount}</dd></div>
            <div><dt>Coordinación</dt><dd>{counts.coordinatorCount}</dd></div>
            <div><dt>Recursos Humanos</dt><dd>{counts.hrCount}</dd></div>
            <div><dt>Administración</dt><dd>{counts.adminCount}</dd></div>
          </dl></section>
          <section className="surface institutional-count-panel"><h2>Estructura académica</h2><dl>
            <div><dt>Campus</dt><dd>{counts.campusCount}</dd></div>
            <div><dt>Programas</dt><dd>{counts.programCount}</dd></div>
            <div><dt>Materias</dt><dd>{counts.subjectCount}</dd></div>
            <div><dt>Grupos</dt><dd>{counts.groupCount}</dd></div>
            <div><dt>Periodos</dt><dd>{counts.periodCount}</dd></div>
          </dl></section>
        </div>
        <div className="admin-toolbar"><label className="admin-search"><Search size={19} aria-hidden="true" />
          <span className="sr-only">Buscar usuarios de tu institución</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder="Buscar usuarios de tu institución" type="search" />
        </label><span className="institutional-readonly-note">Consulta de solo lectura</span></div>
        <InstitutionalFeedback loading={users.loading} error={users.error} onRetry={users.reload} />
        {users.data && <><DataTable title="Usuarios de tu institución" columns={columns} rows={users.data} getRowKey={(user) => user.id} emptyMessage="No hay usuarios que coincidan con la búsqueda." minWidth={800} />
          <p className="institutional-readonly-note">Se muestran hasta 100 perfiles por búsqueda. Las altas y los cambios de rol requieren un flujo administrativo seguro.</p></>}
      </>}
    </div>
  </InstitutionalLayout>
}
