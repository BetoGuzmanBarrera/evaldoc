import { Link } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { MetricCard } from '../../components/ui/MetricCard'
import { ProgressCard } from '../../components/ui/ProgressCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { formatEvaluationDate } from '../../lib/studentEvaluations'
import { useStudentEvaluations } from '../../hooks/useStudentEvaluations'
import { useAuth } from '../../hooks/useAuth'

export function StudentDashboardPage() {
  const { profile } = useAuth()
  const { evaluations, loading, error, reload } = useStudentEvaluations()
  const total = evaluations.length
  const completed = evaluations.filter((item) => item.status === 'completed').length
  const pending = total - completed
  const progress = total === 0 ? 0 : Math.round(completed / total * 100)
  const nextDeadline = evaluations
    .filter((item) => item.status === 'pending' && item.canSubmit)
    .map((item) => item.closesAt)
    .sort()[0]
  const program = evaluations[0]?.programName ?? 'Programa académico'
  const period = evaluations[0]?.periodName ?? 'Periodo académico'
  const subtitle = (profile?.institution_short_name ?? 'Institución') + ' · ' + program

  return <StudentLayout
    title={'Bienvenido, ' + (profile?.full_name.split(' ')[0] ?? 'estudiante')}
    subtitle={subtitle}
    period={period}
  >
    <div className="dashboard-content">
      {loading ? <LoadingSkeleton /> : error
        ? <div className="simple-panel surface" role="alert"><p>No pudimos cargar tus evaluaciones.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div>
        : <>
          <div className="metric-grid">
            <MetricCard label="Total de evaluaciones" value={total} caption="Periodo disponible" />
            <MetricCard label="Realizadas" value={completed} caption={completed + ' enviadas'} />
            <MetricCard label="Pendientes" value={pending} caption="Requieren atención" tone="danger" />
            <MetricCard label="Avance" value={progress + '%'} caption="Meta: 100%" tone="warning" />
          </div>
          <ProgressCard
            progress={progress}
            pending={pending}
            deadline={nextDeadline ? formatEvaluationDate(nextDeadline) : undefined}
          />
          <section className="surface subjects-panel">
            <div className="subjects-panel-header section-between">
              <h2>Mis materias</h2><Link to="/student/evaluations">Ver todas</Link>
            </div>
            {total === 0
              ? <EmptyState title="Sin evaluaciones asignadas" message="Cuando tu institución habilite una encuesta, aparecerá aquí." />
              : <div className="subjects-table">
                <div className="subject-row subject-head"><span>Materia</span><span>Profesor</span><span>Estado</span><span>Acción</span></div>
                {evaluations.slice(0, 4).map((item) => <div className="subject-row" key={item.id}>
                  <strong>{item.subjectName}</strong>
                  <span>{item.teacherName}</span>
                  <StatusBadge status={item.status} />
                  <div>{item.status === 'pending' && item.canSubmit
                    ? <Link className="button button-primary button-small" to={'/student/evaluations/' + item.id}>Evaluar</Link>
                    : <span className="subject-dash">—</span>}</div>
                </div>)}
              </div>}
          </section>
        </>}
    </div>
  </StudentLayout>
}
