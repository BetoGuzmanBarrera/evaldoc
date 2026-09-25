import { useState } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { ConfirmationModal } from '../../components/evaluation/ConfirmationModal'
import { SurveyQuestion } from '../../components/evaluation/SurveyQuestion'
import { surveyQuestions } from '../../data/mock/surveyQuestions'
import { studentDashboard } from '../../data/mock/studentDashboard'
import { getEvaluationDetails, getCompletedIds, markCompleted } from '../../lib/evaluation'
import type { Rating } from '../../types'

export function SurveyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Rating>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const details = getEvaluationDetails(id ?? '')
  if (!details) return <main className="simple-state"><Brand /><h1>Evaluación no encontrada</h1><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main>
  if (details.evaluation.status === 'completed' || getCompletedIds().includes(details.evaluation.id)) return <main className="simple-state"><Brand /><h1>Esta evaluación ya fue completada</h1><Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link></main>
  const question = surveyQuestions[index]
  const next = () => { if (answers[question.id] === undefined) { setError('Selecciona una respuesta para continuar.'); return }; setError(''); if (index === surveyQuestions.length - 1) setShowConfirm(true); else setIndex(index + 1) }
  const confirm = () => { markCompleted(details.evaluation.id); navigate(`/student/evaluations/${details.evaluation.id}/success`, { replace: true }) }
  return <div className="survey-page"><header className="survey-topbar"><Brand /><Link to="/student/evaluations">Salir de la evaluación</Link></header><main className="survey-content"><nav className="survey-breadcrumb" aria-label="Ruta de navegación"><Link to="/student/evaluations">Mis evaluaciones</Link><span>/</span><span>Evaluación docente</span></nav><h1 className="survey-title">Evaluación docente</h1><section className="surface teacher-summary"><span className="teacher-avatar" aria-hidden="true" /><div className="teacher-info"><h2>{details.teacher.name}</h2><p>{details.subject.name} · Grupo {details.subject.group} · {studentDashboard.period} · IPN</p></div><span className="anonymous-badge"><LockKeyhole size={16} aria-hidden="true" /> Evaluación anónima</span></section><SurveyQuestion question={question} number={index + 1} total={surveyQuestions.length} value={answers[question.id]} onChange={(value) => { setAnswers({ ...answers, [question.id]: value }); setError('') }}><div className="survey-nav"><button className="button button-outline" type="button" disabled={index === 0} onClick={() => { setIndex(index - 1); setError('') }}><ArrowLeft size={17} aria-hidden="true" /> Anterior</button><button className="button button-primary" type="button" onClick={next}>{index === surveyQuestions.length - 1 ? 'Enviar evaluación' : 'Siguiente'} <ArrowRight size={17} aria-hidden="true" /></button></div></SurveyQuestion>{error && <p className="form-error survey-error" role="alert">{error}</p>}<p className="survey-privacy"><ShieldCheck size={16} aria-hidden="true" /> Información protegida. El docente solo verá resultados agregados.</p></main>{showConfirm && <ConfirmationModal onCancel={() => setShowConfirm(false)} onConfirm={confirm} />}</div>
}
