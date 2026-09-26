import { TrendChart } from '../../components/charts/TrendChart'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { MetricCard } from '../../components/ui/MetricCard'
import { teacherHistory } from '../../data/mock/teacherHistory'

export function TeacherHistoryPage() {
  const data = teacherHistory
  const trend = data.periods.map((item) => ({ period: item.id, score: item.averageScore }))
  return <TeacherLayout active="history" title="Histórico de resultados" subtitle="Comparativo de los últimos tres periodos">
    <div className="teacher-content teacher-history">
      <div className="metric-grid teacher-metric-grid" aria-label="Resumen histórico">
        <MetricCard label="Promedio actual" value={`${data.currentAverage.toFixed(1)} / 10`} caption={data.period} />
        <MetricCard label="Variación" value={`+${data.variation.toFixed(1)}`} caption="vs. periodo anterior" />
        <MetricCard label="Mejor dimensión" value={data.bestDimension.label} caption={`${data.bestDimension.score.toFixed(1)} / 10`} />
        <MetricCard label="Área de oportunidad" value={data.opportunity.label} caption={`${data.opportunity.score.toFixed(1)} / 10`} tone="warning" />
      </div>
      <section className="teacher-history-highlight" aria-label="Tendencia histórica"><h2>Mejora continua</h2><p>{data.trendMessage}</p></section>
      <TrendChart title="Comparativo de promedios / 10" points={trend} />
      <section className="surface teacher-history-panel">
        <h2>Dimensiones por periodo / 10</h2>
        <div className="teacher-history-scroll" role="region" aria-label="Tabla comparativa de dimensiones; desplazable horizontalmente" tabIndex={0}>
          <table><caption className="sr-only">Resultados agregados de los últimos tres periodos en escala de 0 a 10</caption><thead><tr><th scope="col">Periodo</th><th scope="col">Promedio</th>{data.dimensions.map((dimension) => <th scope="col" key={dimension.id}>{dimension.label}</th>)}</tr></thead><tbody>{data.periods.map((period) => <tr key={period.id}><th scope="row">{period.label}</th><td>{period.averageScore.toFixed(1)}</td>{data.dimensions.map((dimension) => <td key={dimension.id}>{period.scores[dimension.id].toFixed(1)}</td>)}</tr>)}</tbody></table>
        </div>
      </section>
      <TeacherPrivacyNotice />
    </div>
  </TeacherLayout>
}
