export function ResponseChart({ favorable }: { favorable: number }) {
  return <section className="surface teacher-response-panel" aria-label="Distribución de respuestas">
    <h2>Distribución de respuestas</h2>
    <div className="teacher-donut" role="img" aria-label={`${favorable}% de respuestas Bueno o Excelente; ${100 - favorable}% en otras categorías`} style={{ background: `conic-gradient(var(--primary) ${favorable}%, #E8EEF6 0)` }}><span /></div>
    <p>{favorable}% Bueno / Excelente</p>
  </section>
}
