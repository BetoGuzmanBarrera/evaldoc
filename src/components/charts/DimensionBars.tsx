import type { DimensionScore } from '../../types'

export function DimensionBars({ title, dimensions }: { title: string; dimensions: DimensionScore[] }) {
  return <section className="surface teacher-dimensions-panel" aria-label={title}>
    <h2>{title}</h2>
    <ul className="teacher-dimension-list">{dimensions.map((dimension) => <li className="teacher-dimension-row" key={dimension.id}>
      <span className="teacher-dimension-label" title={dimension.label}>{dimension.label}</span>
      <span className="teacher-dimension-track" role="meter" aria-label={`${dimension.label}: ${dimension.score.toFixed(1)} de 10`} aria-valuenow={dimension.score} aria-valuemin={0} aria-valuemax={10}>
        <span className={dimension.opportunity ? 'is-opportunity' : ''} style={{ width: `${dimension.score * 10}%` }} />
      </span>
      <strong>{dimension.score.toFixed(1)}</strong>
    </li>)}</ul>
  </section>
}
