import { TrendChart } from '../../components/charts/TrendChart'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { MetricCard } from '../../components/ui/MetricCard'
import { PdfDownloadButton } from '../../components/ui/PdfDownloadButton'
import { useAuth } from '../../hooks/useAuth'
import { useTeacherOverview } from '../../hooks/useTeacherResults'

export function TeacherHistoryPage() {
  const { profile } = useAuth()
  const { history, breakdown, loading, error, reload } = useTeacherOverview()
  const current = history[0]
  const previous = history.slice(1).find((period) => period.averageScore !== null)
  const change = current?.averageScore !== null && current && previous?.averageScore !== null && previous
    ? current.averageScore - previous.averageScore
    : null
  const ordered = [...breakdown].sort((a, b) => a.score - b.score)
  const lowest = ordered[0]
  const highest = ordered[ordered.length - 1]
  const hasSpread = Boolean(highest && lowest && highest.score > lowest.score)
  const trend = history.filter((period) => period.averageScore !== null).slice(0, 5).reverse()
    .map((period) => ({ period: period.name, score: period.averageScore ?? 0 }))

  return <TeacherLayout active="history" title="Histórico de resultados"
    subtitle="Comparativo por periodo académico" period={current?.name}
    actions={<PdfDownloadButton request={{ kind: 'teacherHistory', institution: profile?.institution_short_name ?? 'Institución' }} />}>
    <div className="teacher-content teacher-history">
      {loading ? <LoadingSkeleton /> : error
        ? <div className="surface teacher-load-error" role="alert"><p>No pudimos cargar el histórico.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div>
        : history.length === 0
          ? <EmptyState title="Sin periodos registrados" message="El histórico aparecerá cuando tu institución registre asignaciones docentes." />
          : <>
            <div className="metric-grid teacher-metric-grid" aria-label="Resumen histórico">
              <MetricCard label="Promedio actual" value={current?.averageScore === null || !current ? '— / 10' : current.averageScore.toFixed(1) + ' / 10'} caption={current?.name ?? 'Periodo académico'} />
              <MetricCard label="Variación" value={change === null ? '—' : (change >= 0 ? '+' : '') + change.toFixed(1)} caption="vs. periodo anterior publicable" />
              <MetricCard label="Mejor reactivo" value={hasSpread ? highest.label : 'Sin diferencia'} caption={highest ? highest.score.toFixed(1) + ' / 10' : 'Sin desglose'} />
              <MetricCard label="Área de oportunidad" value={hasSpread ? lowest.label : 'Sin diferencia'} caption={lowest ? lowest.score.toFixed(1) + ' / 10' : 'Sin desglose'} tone="warning" />
            </div>
            <section className="teacher-history-highlight" aria-label="Tendencia histórica"><h2>Comparación de periodos</h2><p>{change === null ? 'La comparación aparecerá cuando existan dos periodos con resultados publicables.' : 'Cambio frente al periodo anterior: ' + (change >= 0 ? '+' : '') + change.toFixed(1) + ' puntos.'}</p></section>
            {trend.length ? <TrendChart title="Comparativo de promedios / 10" points={trend} />
              : <EmptyState title="Sin promedios publicables" message="El histórico conserva los periodos, pero oculta los promedios de grupos con menos de cinco respuestas." />}
            <section className="surface teacher-history-panel">
              <h2>Periodos académicos / 10</h2>
              <div className="teacher-history-scroll" role="region" aria-label="Tabla comparativa de periodos; desplazable horizontalmente" tabIndex={0}>
                <table><caption className="sr-only">Resultados agregados por periodo en escala de 0 a 10</caption><thead><tr><th scope="col">Periodo</th><th scope="col">Promedio</th><th scope="col">Respuestas</th><th scope="col">Respuestas publicables</th></tr></thead><tbody>{history.map((period) => <tr key={period.id}><th scope="row">{period.name}</th><td>{period.averageScore === null ? 'Protegido' : period.averageScore.toFixed(1) + ' / 10'}</td><td>{period.responseCount}</td><td>{period.publishedResponses}</td></tr>)}</tbody></table>
              </div>
            </section>
          </>}
      <TeacherPrivacyNotice />
    </div>
  </TeacherLayout>
}
