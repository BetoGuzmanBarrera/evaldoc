import { DimensionBars } from '../../components/charts/DimensionBars'
import { ResponseChart } from '../../components/charts/ResponseChart'
import { TrendChart } from '../../components/charts/TrendChart'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { MetricCard } from '../../components/ui/MetricCard'
import { teacherDashboard } from '../../data/mock/teacherDashboard'

export function TeacherDashboardPage() {
  const data = teacherDashboard
  return <TeacherLayout active="home" title="Panel de Docente" subtitle={data.name}>
    <div className="teacher-content teacher-dashboard">
      <div className="metric-grid teacher-metric-grid" aria-label="Resumen del periodo">
        <MetricCard label="Calificación promedio" value={`${data.averageScore.toFixed(1)} / 10`} caption={`↑ ${data.averageChange.toFixed(1)} vs. anterior`} />
        <MetricCard label="Total de respuestas" value={data.responseCount} caption={`+${data.newResponses} este periodo`} />
        <MetricCard label="Participación" value={`${data.participation}%`} caption="Meta superada" />
        <MetricCard label="Materias evaluadas" value={data.subjectsEvaluated} caption="Cobertura completa" />
      </div>
      <div className="teacher-chart-grid">
        <TrendChart title="Evolución de calificación / 10" points={data.trend} />
        <ResponseChart favorable={data.favorableResponses} />
      </div>
      <div className="teacher-lower-grid">
        <DimensionBars title="Resultados por dimensión / 10" dimensions={data.dimensions} />
        <TeacherPrivacyNotice featured />
      </div>
    </div>
  </TeacherLayout>
}
