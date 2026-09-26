import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { MetricCard } from '../../components/ui/MetricCard'
import { adminDashboard } from '../../data/mock/adminDashboard'
import type { AdminUser } from '../../types'

const columns: DataColumn<AdminUser>[] = [
  { label: 'Nombre', render: (user) => user.name },
  { label: 'Correo', render: (user) => user.email },
  { label: 'Institución', render: (user) => user.institution },
  { label: 'Rol', render: (user) => user.role },
  { label: 'Estado', render: (user) => user.status },
  { label: 'Último acceso', render: (user) => user.lastAccess },
]

export function AdminDashboardPage() {
  const data = adminDashboard
  const [query, setQuery] = useState('')
  const [demoMessage, setDemoMessage] = useState('')
  const search = query.trim().toLocaleLowerCase('es-MX')
  const users = data.sampleUsers.filter((user) => [user.name, user.email, user.institution, user.role].some((value) => value.toLocaleLowerCase('es-MX').includes(search)))

  return <InstitutionalLayout role="admin" title="Administración" subtitle="Gestión integral de la plataforma EvalDoc" period={data.period}>
    <div className="institutional-content">
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Buscar usuarios, instituciones o grupos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuarios, instituciones o grupos" type="search" /></label>
        <button className="button button-primary" type="button" onClick={() => setDemoMessage('La creación de usuarios estará disponible en una próxima versión.')}><Plus size={17} aria-hidden="true" /> Agregar usuario</button>
      </div>
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <div className="metric-grid institutional-metrics" aria-label="Resumen de administración">
        <MetricCard label="Usuarios" value={data.users.toLocaleString('en-US')} caption="+124 este mes" />
        <MetricCard label="Instituciones" value={data.institutions} caption="Todos activos" />
        <MetricCard label="Docentes" value={data.teachers} caption="92% verificados" />
        <MetricCard label="Alumnos" value={data.students.toLocaleString('en-US')} caption="89% activos" />
      </div>
      <DataTable title="Usuarios" columns={columns} rows={users} getRowKey={(user) => user.id} minWidth={920} />
      <div className="admin-pagination">
        <p>{query ? 'Mostrando ' + users.length + ' de ' + data.sampleUsers.length + ' usuarios de muestra' : 'Mostrando 1–5 de ' + data.users.toLocaleString('en-US') + ' usuarios'}</p>
        <nav aria-label="Paginación de usuarios">
          <button type="button" disabled aria-label="Página anterior">‹</button>
          <button type="button" className="active" aria-current="page" aria-label="Página 1">1</button>
          <button type="button" disabled aria-label="Página 2 no disponible">2</button>
          <button type="button" disabled aria-label="Página 3 no disponible">3</button>
          <span aria-hidden="true">…</span>
          <button type="button" disabled aria-label="Página siguiente no disponible">›</button>
        </nav>
      </div>
    </div>
  </InstitutionalLayout>
}
