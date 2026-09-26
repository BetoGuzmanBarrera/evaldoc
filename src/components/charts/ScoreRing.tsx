export function ScoreRing({ score }: { score: number }) {
  return <section className="surface institutional-score-panel" aria-label="Calificación promedio">
    <h2>Calificación promedio / 10</h2>
    <div className="institutional-score-ring" role="img" aria-label={score.toFixed(1) + ' de 10'}><span /></div>
    <strong>{score.toFixed(1)} / 10</strong>
  </section>
}
