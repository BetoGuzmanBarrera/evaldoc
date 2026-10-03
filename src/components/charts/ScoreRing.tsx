export function ScoreRing({ score }: { score: number | null }) {
  return <section className="surface institutional-score-panel" aria-label="Calificación promedio">
    <h2>Calificación promedio / 10</h2>
    <div className={'institutional-score-ring' + (score === null ? ' is-empty' : '')} role="img" aria-label={score === null ? 'Sin resultados publicables' : score.toFixed(1) + ' de 10'}><span /></div>
    <strong>{score === null ? '— / 10' : score.toFixed(1) + ' / 10'}</strong>
  </section>
}
