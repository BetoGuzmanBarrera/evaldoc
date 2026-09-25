import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Evaluation, Subject, Teacher } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
export function EvaluationCard({ evaluation, subject, teacher, completed }: { evaluation: Evaluation; subject: Subject; teacher: Teacher; completed: boolean }) {
  return <article className="surface evaluation-card"><div className="evaluation-card-top"><span className="course-icon"><BookOpen size={23} aria-hidden="true" /></span><StatusBadge status={completed ? 'completed' : 'pending'} /></div><h2>{subject.name}</h2><p className="card-teacher">{teacher.shortName}</p><div className="card-meta">Grupo {subject.group} · Vence {evaluation.dueDate}</div>{completed ? <span className="card-done">Evaluación realizada</span> : <Link className="button button-primary card-action" to={`/student/evaluations/${evaluation.id}`}>Comenzar evaluación</Link>}</article>
}
