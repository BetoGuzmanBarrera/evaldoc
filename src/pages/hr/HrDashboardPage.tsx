import { useState } from 'react'
import { Info } from 'lucide-react'
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout'
import { DataTable, type DataColumn } from '../../components/ui/DataTable'
import { FilterBar } from '../../components/ui/FilterBar'
import { MetricCard } from '../../components/ui/MetricCard'
import { hrDashboard } from '../../data/mock/hrDashboard'
import type { HrDashboardData } from '../../types'

type HrTeacher = HrDashboardData['teachers'][number]

export function HrDashboardPage() {
  const data = hrDashboard
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [demoMessage, setDemoMessage] = useState('')
  const institution = data.filters[0].options.find((item) => item.value === filters.institution)?.label
  const teachers = data.teachers.filter((teacher) => (!institution || teacher.institution === institution) && (!filters.category || teacher.category === filters.category))
  const columns: DataColumn<HrTeacher>[] = [
    { label: 'Docente', render: (teacher) => teacher.name },
    { label: 'Promedio / 10', render: (teacher) => teacher.score.toFixed(1) },
    { label: 'Categoría', render: (teacher) => teacher.category },
    { label: 'Tendencia', render: (teacher) => teacher.trend },
    { label: 'Materias', render: (teacher) => teacher.subjects },
    { label: 'Histórico', render: (teacher) => <button className="institutional-text-button" type="button" onClick={() => setDemoMessage('El histórico de ' + teacher.name + ' estará disponible en una próxima versión.')} aria-label={'Ver histórico de ' + teacher.name}>Ver</button> },
  ]

  return <InstitutionalLayout role="hr" title="Recursos Humanos" subtitle="Indicadores consolidados para acompañamiento docente" period={data.period}>
    <div className="institutional-content">
      <section className="surface hr-overview" aria-label="Resumen de recursos humanos">
        <FilterBar embedded filters={data.filters} values={filters} onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))} />
        <div className="metric-grid institutional-metrics" aria-label="Indicadores principales">
          <MetricCard label="Docentes evaluados" value={data.evaluatedTeachers} caption="87% de cobertura" />
          <MetricCard label="Promedio institucional" value={data.institutionalAverage.toFixed(1) + ' / 10'} caption="↑ 0.2 este periodo" />
          <MetricCard label="Docentes con mejora" value={data.improvingTeachers} caption="58% del total" />
          <MetricCard label="Docentes destacados" value={data.outstandingTeachers} caption="16% del total" />
        </div>
        <div className="hr-category-grid" aria-label="Docentes por categoría">
          {data.categories.map((category) => <div className={'hr-category hr-category-' + category.tone} key={category.label}>
            <span className="hr-category-dot" aria-hidden="true" /><div><strong>{category.count}</strong><span>{category.label}</span></div>
          </div>)}
        </div>
      </section>
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <DataTable title="Indicadores docentes" columns={columns} rows={teachers} getRowKey={(teacher) => teacher.id} minWidth={800} />
      <p className="hr-disclaimer"><Info size={18} aria-hidden="true" /> Estos indicadores son herramientas de apoyo y contexto; no representan decisiones laborales automáticas.</p>
    </div>
  </InstitutionalLayout>
}
