import type { ReactNode } from 'react'

export interface DataColumn<Row> {
  label: string
  render: (row: Row) => ReactNode
}

export function DataTable<Row>({ title, columns, rows, getRowKey, emptyMessage = 'No hay resultados para los filtros seleccionados.', minWidth = 760 }: {
  title: string
  columns: DataColumn<Row>[]
  rows: Row[]
  getRowKey: (row: Row) => string
  emptyMessage?: string
  minWidth?: number
}) {
  return <section className="surface institutional-table-panel">
    <h2>{title}</h2>
    <div className="institutional-table-scroll" role="region" aria-label={title + ', tabla desplazable horizontalmente'} tabIndex={0}>
      <table style={{ minWidth }}>
        <caption className="sr-only">{title}</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column.label}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={getRowKey(row)}>{columns.map((column, index) => index === 0
          ? <th scope="row" key={column.label}>{column.render(row)}</th>
          : <td key={column.label}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {rows.length === 0 && <p className="institutional-empty">{emptyMessage}</p>}
  </section>
}
