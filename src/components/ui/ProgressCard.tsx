export function ProgressCard({ progress, pending, deadline }: { progress: number; pending: number; deadline: string }) {
  return <section className="surface progress-card" aria-label="Progreso de evaluaciones"><div className="section-between"><h2>Progreso de evaluaciones</h2><strong>{progress}% completado</strong></div><div className="progress-track" role="progressbar" aria-label="Evaluaciones completadas" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><p>Completa {pending} evaluaciones antes del {deadline}.</p></section>
}
