import { CircleCheck, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { useStudentEvaluations } from '../../hooks/useStudentEvaluations'

export function EvaluationSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const { evaluations, loading, error, reload } = useStudentEvaluations()
  const completed = evaluations.some((item) => item.id === id && item.status === 'completed' && item.evaluationId)

  if (loading) return <main className="simple-state" role="status"><Brand /><p>Confirmando el envío…</p></main>
  if (error) return <main className="simple-state" role="alert"><Brand /><h1>No pudimos confirmar el envío</h1><button className="button button-outline" type="button" onClick={reload}>Reintentar</button><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main>
  if (!completed) return <main className="simple-state"><Brand /><h1>Evaluación no enviada</h1><p>Consulta tus evaluaciones para revisar su estado.</p><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main>

  return <div className="success-page"><header className="survey-topbar"><Brand /></header><main className="success-card surface"><span className="success-icon"><CircleCheck size={40} strokeWidth={2.5} aria-hidden="true" /></span><h1>Evaluación enviada correctamente</h1><p>Tus respuestas serán procesadas de forma anónima. El docente solo podrá consultar resultados agregados.</p><span className="success-privacy"><ShieldCheck size={17} aria-hidden="true" /> Información protegida</span><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main></div>
}
