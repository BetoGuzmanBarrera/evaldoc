export interface AnalyticsChartPoint {
  id: string
  label: string
  score: number | null
  responseCount: number
}

export function AnalyticsTrendChart({ title, points }: { title: string; points: AnalyticsChartPoint[] }) {
  return <section className="surface analytics-trend-panel" aria-label={title}>
    <h2>{title}</h2>
    {points.length === 0 ? <p className="analytics-chart-empty">No hay periodos académicos disponibles.</p> :
      <div className="analytics-trend-scroll" role="region" aria-label={title + ', gráfica desplazable'} tabIndex={0}>
        <ol className="analytics-trend-bars" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(112px, 1fr))` }}>
          {points.map((point) => <li key={point.id}>
            <strong>{point.score === null ? '—' : `${point.score.toFixed(1)} / 10`}</strong>
            <div className="analytics-trend-column">
              {point.score !== null && <span style={{ height: `${point.score * 10}%` }} aria-hidden="true" />}
            </div>
            <span className="analytics-trend-label">{point.label}</span>
            <small>{point.score === null ? 'Sin resultados publicables' : `${point.responseCount} respuestas`}</small>
          </li>)}
        </ol>
      </div>}
  </section>
}
