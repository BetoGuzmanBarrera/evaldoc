import type { PeriodComparison } from '../../lib/institutionalAnalytics'

function signed(value: number, suffix = '') {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}${suffix}`
}

export function PeriodComparisonCard({ comparison }: { comparison: PeriodComparison | null }) {
  return <section className="surface analytics-comparison" aria-label="Comparación entre periodos">
    <h2>Comparación entre periodos</h2>
    {!comparison ? <p>No hay un periodo académico disponible para comparar.</p> : !comparison.previousPeriodId ?
      <p>No existe un periodo anterior para esta selección. Aún no hay una comparativa válida.</p> : <>
        <div className="analytics-comparison-values">
          <div><span>{comparison.currentPeriodName}</span><strong>{comparison.currentScore === null ? '—' : comparison.currentScore.toFixed(1)} / 10</strong></div>
          <div><span>{comparison.previousPeriodName}</span><strong>{comparison.previousScore === null ? '—' : comparison.previousScore.toFixed(1)} / 10</strong></div>
        </div>
        {comparison.absoluteChange === null ?
          <p>Resultados insuficientes para proteger el anonimato en uno de los periodos.</p> :
          <p className="analytics-change">Variación: <strong>{signed(comparison.absoluteChange)} puntos</strong>
            {comparison.percentageChange !== null && <> · {signed(comparison.percentageChange, '%')}</>}
          </p>}
      </>}
  </section>
}

export interface ScoredName { label: string; score: number }

function names(items: ScoredName[]) {
  if (items.length <= 3) return items.map((item) => item.label).join(', ')
  return `${items.slice(0, 3).map((item) => item.label).join(', ')} y ${items.length - 3} más`
}

export function AnalyticsExtremes({ title, items }: { title: string; items: ScoredName[] }) {
  if (items.length === 0) return null
  const high = Math.max(...items.map((item) => item.score))
  const low = Math.min(...items.map((item) => item.score))
  const leaders = items.filter((item) => item.score === high)
  const opportunities = items.filter((item) => item.score === low)
  return <section className="surface analytics-extremes" aria-label={title}>
    <h2>{title}</h2>
    {items.length === 1 ? <p>Único resultado publicable: {items[0].label}, {high.toFixed(1)} / 10.</p> : high === low ?
      <p>Empate entre todos los resultados publicables: {items.length} elementos con {high.toFixed(1)} / 10.</p> :
      <div className="analytics-extreme-grid">
        <p><span>Promedio mayor{leaders.length > 1 ? ' · empate' : ''}</span><strong>{high.toFixed(1)} / 10</strong>{names(leaders)}</p>
        <p><span>Promedio menor{opportunities.length > 1 ? ' · empate' : ''}</span><strong>{low.toFixed(1)} / 10</strong>{names(opportunities)}</p>
      </div>}
  </section>
}
