import { Link } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { MetricCard } from '../../components/ui/MetricCard'
import { ProgressCard } from '../../components/ui/ProgressCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { studentDashboard } from '../../data/mock/studentDashboard'
import { evaluations } from '../../data/mock/evaluations'
import { getEvaluationDetails } from '../../lib/evaluation'
import { useEvaluationProgress } from '../../hooks/useEvaluationProgress'
import { useAuth } from '../../hooks/useAuth'

export function StudentDashboardPage() {
  const { profile } = useAuth()
  const { total, completed, pending, progress, isCompleted } = useEvaluationProgress()
  return <StudentLayout title={`Bienvenido, ${profile?.full_name.split(' ')[0] ?? 'estudiante'}`} subtitle={`${profile?.institution_short_name ?? 'Institución'} · ${studentDashboard.program}`}><div className="dashboard-content"><div className="metric-grid"><MetricCard label="Total de evaluaciones" value={total} caption="Ciclo actual" /><MetricCard label="Realizadas" value={completed} caption={`${completed} enviadas`} /><MetricCard label="Pendientes" value={pending} caption="Requieren atención" tone="danger" /><MetricCard label="Avance" value={`${progress}%`} caption="Meta: 100%" tone="warning" /></div><ProgressCard progress={progress} pending={pending} deadline={studentDashboard.deadline} /><section className="surface subjects-panel"><div className="subjects-panel-header section-between"><h2>Mis materias</h2><Link to="/student/evaluations">Ver todas</Link></div><div className="subjects-table"><div className="subject-row subject-head"><span>Materia</span><span>Profesor</span><span>Estado</span><span>Acción</span></div>{evaluations.slice(0, 4).map((item) => { const details = getEvaluationDetails(item.id); if (!details) return null; const done = isCompleted(item.id); return <div className="subject-row" key={item.id}><strong>{details.subject.name}</strong><span>{details.teacher.shortName}</span><StatusBadge status={done ? 'completed' : 'pending'} /><div>{done ? <span className="subject-dash">—</span> : <Link className="button button-primary button-small" to={`/student/evaluations/${item.id}`}>Evaluar</Link>}</div></div> })}</div></section></div></StudentLayout>
}
