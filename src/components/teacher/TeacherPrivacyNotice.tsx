import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TeacherPrivacyNotice({ featured = false }: { featured?: boolean }) {
  if (!featured) return <p className="teacher-privacy-compact"><ShieldCheck size={18} aria-hidden="true" /> Resultados agregados. La identidad de los estudiantes permanece anónima.</p>
  return <aside className="teacher-privacy-featured" aria-label="Privacidad de resultados">
    <ShieldCheck size={25} aria-hidden="true" />
    <h2>Resultados agregados.</h2>
    <p>La identidad de los estudiantes permanece anónima. Nunca mostramos respuestas individuales.</p>
    <Link className="button button-primary" to="/teacher/results/1">Ver detalles</Link>
  </aside>
}
