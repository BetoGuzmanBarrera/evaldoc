export function ResponseChart({ favorable }: { favorable: number }) {
  return <section className="surface teacher-response-panel" aria-label="Distribución de respuestas">
    <h2>Distribución de respuestas</h2>
    <div className="teacher-donut" role="img" aria-label={`${favorable}% de respuestas Excelente o Bueno; ${100 - favorable}% en otras categorías`}><span /></div>
    <p>{favorable}% Excelente / Bueno</p>
  </section>
}
