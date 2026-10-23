import { Link } from 'react-router-dom'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { MetricCard } from '../../components/ui/MetricCard'
import { ProgressCard } from '../../components/ui/ProgressCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { formatEvaluationDate } from '../../lib/studentEvaluations'
import { useStudentEvaluations } from '../../hooks/useStudentEvaluations'
import { useStudentEnrollments } from '../../hooks/useStudentEnrollments'
import { useAuth } from '../../hooks/useAuth'

export function StudentDashboardPage() {
  const { profile } = useAuth()
  const evaluationState = useStudentEvaluations()
  const enrollmentState = useStudentEnrollments()
  const { evaluations, loading: evaluationsLoading, error: evaluationsError } = evaluationState
  const { enrollments, loading: enrollmentsLoading, error: enrollmentsError } = enrollmentState
  const total = evaluations.length
  const completed = evaluations.filter((item) => item.status === 'completed').length
  const pending = total - completed
  const progress = total === 0 ? 0 : Math.round(completed / total * 100)
  const nextDeadline = evaluations
    .filter((item) => item.status === 'pending' && item.canSubmit)
    .map((item) => item.closesAt)
    .sort()[0]
  const program = enrollments[0]?.programName ?? evaluations[0]?.programName ?? 'Programa académico'
  const period = enrollments[0]?.periodName ?? evaluations[0]?.periodName ?? 'Periodo académico'
  const subtitle = (profile?.institution_short_name ?? 'Institución') + ' · ' + program
  const loading = evaluationsLoading || enrollmentsLoading
  const error = evaluationsError || enrollmentsError
  const reload = () => { evaluationState.reload(); enrollmentState.reload() }

  return <StudentLayout
    title={'Bienvenido, ' + (profile?.full_name.split(' ')[0] ?? 'estudiante')}
    subtitle={subtitle}
    period={period}
  >
    <div className="dashboard-content">
      {loading ? <LoadingSkeleton /> : error
        ? <div className="simple-panel surface" role="alert"><p>No pudimos cargar tus datos académicos.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div>
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
              <h2>Mis materias inscritas</h2><Link to="/student/evaluations">Ver evaluaciones</Link>
            </div>
            {enrollments.length === 0
              ? <EmptyState title="Sin materias inscritas" message="Tu cuenta está aprobada. Coordinación registrará tus grupos y materias aquí." />
              : <div className="subjects-table">
                <div className="subject-row subject-head"><span>Materia</span><span>Grupo</span><span>Periodo</span><span>Carrera</span></div>
                {enrollments.map((item) => <div className="subject-row" key={item.id}>
                  <strong>{item.subjectName}</strong>
                  <span>{item.groupCode}</span>
                  <span>{item.periodName}</span>
                  <div>{item.programName ?? '—'}</div>
                </div>)}
              </div>}
          </section>
        </>}
    </div>
  </StudentLayout>
}
