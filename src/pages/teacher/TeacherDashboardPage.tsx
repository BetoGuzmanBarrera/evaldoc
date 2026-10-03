import { Link } from 'react-router-dom'
import { DimensionBars } from '../../components/charts/DimensionBars'
import { ResponseChart } from '../../components/charts/ResponseChart'
import { TrendChart } from '../../components/charts/TrendChart'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { MetricCard } from '../../components/ui/MetricCard'
import { PdfDownloadButton } from '../../components/ui/PdfDownloadButton'
import { useAuth } from '../../hooks/useAuth'
import { useTeacherOverview } from '../../hooks/useTeacherResults'

const dashboardPositions = new Set([1, 3, 7, 10, 12])

export function TeacherDashboardPage() {
  const { profile } = useAuth()
  const { assignments, history, breakdown, loading, error, reload } = useTeacherOverview()
  const current = history[0]
  const previous = history.slice(1).find((period) => period.averageScore !== null)
  const currentAssignments = assignments.filter((item) => item.periodId === current?.id)
  const evaluated = currentAssignments.filter((item) => item.responseCount > 0).length
  const published = currentAssignments.filter((item) => item.published).length
  const change = current?.averageScore !== null && current && previous?.averageScore !== null && previous
    ? current.averageScore - previous.averageScore
    : null
  const trend = history.filter((period) => period.averageScore !== null).slice(0, 5).reverse()
    .map((period) => ({ period: period.name, score: period.averageScore ?? 0 }))
  const selectedQuestions = breakdown.filter((item) => dashboardPositions.has(item.position))
  const lowestScore = selectedQuestions.length ? Math.min(...selectedQuestions.map((item) => item.score)) : null
  const highestScore = selectedQuestions.length ? Math.max(...selectedQuestions.map((item) => item.score)) : null
  const opportunityId = lowestScore !== highestScore
    ? selectedQuestions.find((item) => item.score === lowestScore)?.id
    : null
  const dimensions = selectedQuestions.map((item) => ({
    id: item.id, label: item.label, score: item.score, opportunity: item.id === opportunityId,
  }))

  return <TeacherLayout active="home" title="Panel de Docente"
    subtitle={profile?.full_name ?? 'Docente'} period={current?.name}>
    <div className="teacher-content teacher-dashboard">
      {loading ? <LoadingSkeleton /> : error
        ? <div className="surface teacher-load-error" role="alert"><p>No pudimos cargar tus resultados.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div>
        : assignments.length === 0
          ? <EmptyState title="Sin asignaciones docentes" message="Tus materias y resultados aparecerán aquí cuando tu institución registre asignaciones." />
          : <>
            <div className="metric-grid teacher-metric-grid" aria-label="Resumen del periodo">
              <MetricCard label="Calificación promedio" value={current?.averageScore === null || !current ? '— / 10' : current.averageScore.toFixed(1) + ' / 10'} caption={change === null ? 'Sin comparativo publicable' : (change >= 0 ? '+' : '') + change.toFixed(1) + ' vs. anterior'} />
              <MetricCard label="Total de respuestas" value={current?.responseCount ?? 0} caption={current?.name ?? 'Periodo académico'} />
              <MetricCard label="Asignaciones evaluadas" value={evaluated} caption="Con evaluaciones recibidas" />
              <MetricCard label="Resultados publicables" value={published} caption="Mínimo 5 respuestas por asignación" />
            </div>
            <div className="teacher-chart-grid">
              {trend.length ? <TrendChart title="Evolución de calificación / 10" points={trend} />
                : <EmptyState title="Sin tendencia publicable" message="Los promedios aparecerán al reunir cinco respuestas completas por asignación." />}
              {current?.favorablePercent !== null && current
                ? <ResponseChart favorable={Math.round(current.favorablePercent)} />
                : <EmptyState title="Distribución protegida" message="Se mostrarán porcentajes cuando haya resultados suficientes." />}
            </div>
            <div className="teacher-lower-grid">
              {dimensions.length === 5
                ? <DimensionBars title="Resultados por dimensión / 10" dimensions={dimensions} />
                : <EmptyState title="Sin desglose publicable" message="El desglose necesita al menos cinco respuestas de una misma plantilla por asignación." />}
              <TeacherPrivacyNotice featured detailsId={assignments.find((item) => item.published)?.id ?? assignments[0]?.id} />
            </div>
            <section className="surface teacher-assignments-panel" id="assignments">
              <h2>Mis asignaciones</h2>
              <div className="teacher-assignment-list">{assignments.map((item) => <article key={item.id} className="teacher-assignment-item">
                <div><strong>{item.subjectName}</strong><p>Grupo {item.groupCode} · {item.periodName}</p></div>
                <span>{item.responseCount} {item.responseCount === 1 ? 'respuesta' : 'respuestas'}</span>
                <div className="teacher-assignment-actions"><Link className="button button-outline button-small" to={'/teacher/results/' + item.id}>Ver resultados</Link><PdfDownloadButton request={{ kind: 'teacher', assignmentId: item.id, teacherName: profile?.full_name ?? 'Docente', institution: profile?.institution_short_name ?? 'Institución' }} className="button button-outline button-small" /></div>
              </article>)}</div>
            </section>
          </>}
      {(loading || error || assignments.length === 0) && <TeacherPrivacyNotice />}
    </div>
  </TeacherLayout>
}
