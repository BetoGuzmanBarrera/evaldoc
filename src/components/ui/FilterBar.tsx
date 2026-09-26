import type { DashboardFilter } from '../../types'

export function FilterBar({ filters, values, onChange, embedded = false }: {
  filters: DashboardFilter[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  embedded?: boolean
}) {
  return <div className={embedded ? 'institutional-filters institutional-filters-embedded' : 'surface institutional-filters'} role="group" aria-label="Filtros del panel">
    {filters.map((filter) => <label key={filter.id}>
      <span className="sr-only">{filter.label}</span>
      <select value={values[filter.id] ?? ''} onChange={(event) => onChange(filter.id, event.target.value)} aria-label={filter.label}>
        <option value="">{filter.label}</option>
        {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>)}
  </div>
}
