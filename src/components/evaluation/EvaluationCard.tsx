import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatEvaluationDate, type StudentEvaluation } from '../../lib/studentEvaluations'
import { StatusBadge } from '../ui/StatusBadge'

export function EvaluationCard({ evaluation }: { evaluation: StudentEvaluation }) {
  const completed = evaluation.status === 'completed'
  const dateText = completed && evaluation.submittedAt
    ? 'Enviada ' + formatEvaluationDate(evaluation.submittedAt)
    : 'Vence ' + formatEvaluationDate(evaluation.closesAt)
  return <article className="surface evaluation-card">
    <div className="evaluation-card-top">
      <span className="course-icon"><BookOpen size={23} aria-hidden="true" /></span>
      <StatusBadge status={completed ? 'completed' : 'pending'} />
    </div>
    <h2>{evaluation.subjectName}</h2>
    <p className="card-teacher">{evaluation.teacherName}</p>
    <div className="card-meta">Grupo {evaluation.groupCode} · {evaluation.periodName} · {dateText}</div>
    {completed
      ? <span className="card-done">Evaluación realizada</span>
      : evaluation.canSubmit
        ? <Link className="button button-primary card-action" to={'/student/evaluations/' + evaluation.id}>Comenzar evaluación</Link>
        : <span className="card-done card-unavailable">Ventana cerrada o no disponible</span>}
  </article>
}
