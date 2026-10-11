export interface ParticipationPoint { id: string; label: string; participation: number }

export function ParticipationChart({ points, title = 'Participación' }: { points: ParticipationPoint[]; title?: string }) {
  return <section className="surface institutional-participation-panel" aria-label={title}>
    <h2>{title}</h2>
    <ol className="institutional-bar-list" style={{ gridTemplateColumns: 'repeat(' + points.length + ', minmax(0, 1fr))', minWidth: Math.max(points.length * 72, 250) }}>
      {points.map((point, index) => <li key={point.id}>
        <div className="institutional-bar-column">
          <span className={'institutional-bar ' + (index === 0 ? 'is-highlighted' : '')} style={{ height: point.participation + '%' }} aria-hidden="true" />
        </div>
        <span className="institutional-bar-label">{point.label}<span className="sr-only">: {point.participation}% de participación</span></span>
      </li>)}
    </ol>
  </section>
}
