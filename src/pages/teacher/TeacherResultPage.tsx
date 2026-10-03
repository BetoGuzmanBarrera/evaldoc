import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DimensionBars } from '../../components/charts/DimensionBars'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { useTeacherAssignment } from '../../hooks/useTeacherResults'
import { isUuid } from '../../lib/teacherResults'

export function TeacherResultPage() {
  const { id } = useParams<{ id: string }>()
  const [demoMessage, setDemoMessage] = useState('')
  const { result, loading, error, reload } = useTeacherAssignment(isUuid(id) ? id : null)

  if (loading) return <TeacherLayout active="results" title="Detalle de resultados" subtitle="Cargando asignación"><div className="teacher-content"><LoadingSkeleton /><TeacherPrivacyNotice /></div></TeacherLayout>
  if (error) return <TeacherLayout active="results" title="Detalle de resultados" subtitle="Resultados no disponibles"><div className="teacher-content"><div className="surface teacher-load-error" role="alert"><p>No pudimos cargar los resultados.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div><TeacherPrivacyNotice /></div></TeacherLayout>
  if (!result) return <TeacherLayout active="results" title="Detalle de resultados" subtitle="Materia no encontrada"><div className="teacher-content"><div className="surface teacher-missing"><h2>No encontramos resultados para esta asignación.</h2><Link className="button button-primary" to="/teacher#assignments">Volver a mis asignaciones</Link></div><TeacherPrivacyNotice /></div></TeacherLayout>

  const actions = <><button className="button button-outline" type="button" onClick={() => setDemoMessage('La exportación estará disponible en una próxima versión.')}>Exportar</button><button className="button button-primary" type="button" onClick={() => setDemoMessage('La generación de reportes estará disponible en una próxima versión.')}>Generar reporte</button></>
  const ordered = [...result.questions].sort((a, b) => a.score - b.score)
  const lowest = ordered[0]
  const highest = ordered[ordered.length - 1]
  const hasSpread = Boolean(highest && lowest && highest.score > lowest.score)
  const dimensions = result.questions.map((item) => ({
    id: item.id, label: item.label, score: item.score, opportunity: hasSpread && item.id === lowest?.id,
  }))

  return <TeacherLayout active="results" title="Detalle de resultados"
    subtitle={result.subjectName + ' · Grupo ' + result.groupCode}
    period={result.periodName} actions={actions}>
    <div className="teacher-content teacher-result-content">
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <div className="surface teacher-filters" aria-label="Contexto de resultados">
        <div className="teacher-filter-value">Periodo: {result.periodName}</div>
        <div className="teacher-filter-value">Grupo: {result.groupCode}</div>
        <Link className="teacher-filter-value teacher-filter-link" to="/teacher/history">Comparar periodos</Link>
      </div>
      <div className="teacher-insight-grid">
        <section className="surface teacher-average-card" aria-label="Promedio general"><h2>PROMEDIO GENERAL</h2><strong>{result.averageScore === null ? '—' : result.averageScore.toFixed(1)}</strong><p>de 10.0 · {result.responseCount} {result.responseCount === 1 ? 'respuesta' : 'respuestas'}</p></section>
        <section className="teacher-insight-card"><p>HALLAZGO PRINCIPAL</p>
          <h2>{hasSpread ? highest.label + ' destaca este periodo' : highest ? 'Valoración uniforme entre los reactivos' : 'Resultados protegidos'}</h2>
          <span>{hasSpread ? lowest.label + ' tiene el menor promedio entre los reactivos publicados.' : highest ? 'Los reactivos publicados tienen el mismo promedio.' : 'Se necesitan cinco evaluaciones completas de esta asignación para mostrar promedios y desglose.'}</span>
        </section>
      </div>
      {dimensions.length === 15
        ? <DimensionBars title="Resultados por reactivo / 10" dimensions={dimensions} />
        : <EmptyState title={result.responseCount === 0 ? 'Sin evaluaciones recibidas' : 'Desglose no disponible'} message={result.published ? 'Las respuestas utilizan distintas versiones de plantilla y no se combinan por reactivo.' : 'Los promedios se publican al reunir cinco evaluaciones completas de esta asignación.'} />}
      <TeacherPrivacyNotice />
    </div>
  </TeacherLayout>
}
