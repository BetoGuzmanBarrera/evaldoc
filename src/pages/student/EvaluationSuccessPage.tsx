import { CircleCheck, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
export function EvaluationSuccessPage() {
  return <div className="success-page"><header className="survey-topbar"><Brand /></header><main className="success-card surface"><span className="success-icon"><CircleCheck size={40} strokeWidth={2.5} aria-hidden="true" /></span><h1>Evaluación enviada correctamente</h1><p>Tus respuestas serán procesadas de forma anónima. El docente solo podrá consultar resultados agregados.</p><span className="success-privacy"><ShieldCheck size={17} aria-hidden="true" /> Información protegida</span><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main></div>
}
