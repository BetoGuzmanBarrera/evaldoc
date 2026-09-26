import type { TrendPoint } from '../../types'

export function TrendChart({ title, points }: { title: string; points: TrendPoint[] }) {
  return <section className="surface teacher-trend-panel" aria-label={title}>
    <h2>{title}</h2>
    <ol className="teacher-trend-bars">
      {points.map((point, index) => <li key={point.period}>
        <div className="teacher-trend-column"><span className={`teacher-trend-bar ${index === points.length - 1 ? 'is-current' : ''}`} style={{ height: `${Math.max(15, (point.score - 4.5) / 5.5 * 100)}%` }} aria-hidden="true" /></div>
        <span className="teacher-trend-label">{point.period}<span className="sr-only">: {point.score.toFixed(1)} de 10</span></span>
      </li>)}
    </ol>
  </section>
}
