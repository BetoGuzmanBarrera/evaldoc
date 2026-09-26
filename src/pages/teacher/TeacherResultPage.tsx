import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DimensionBars } from '../../components/charts/DimensionBars'
import { TeacherLayout } from '../../components/layout/TeacherLayout'
import { TeacherPrivacyNotice } from '../../components/teacher/TeacherPrivacyNotice'
import { teacherResults } from '../../data/mock/teacherResults'

export function TeacherResultPage() {
  const { id } = useParams<{ id: string }>()
  const [demoMessage, setDemoMessage] = useState('')
  const result = teacherResults.find((item) => item.id === id)
  if (!result) return <TeacherLayout active="results" title="Detalle de resultados" subtitle="Materia no encontrada"><div className="surface teacher-missing"><h2>No encontramos resultados para esta materia.</h2><Link className="button button-primary" to="/teacher">Volver al panel</Link></div></TeacherLayout>

  const actions = <><button className="button button-outline" type="button" onClick={() => setDemoMessage('La exportación estará disponible en una próxima versión.')}>Exportar</button><button className="button button-primary" type="button" onClick={() => setDemoMessage('La generación de reportes estará disponible en una próxima versión.')}>Generar reporte</button></>

  return <TeacherLayout active="results" title="Detalle de resultados" subtitle={`${result.subject} · Grupo ${result.group}`} actions={actions}>
    <div className="teacher-content teacher-result-content">
      {demoMessage && <p className="form-note" role="status">{demoMessage}</p>}
      <div className="surface teacher-filters" aria-label="Filtros de resultados">
        <label><span className="sr-only">Periodo</span><select defaultValue="current"><option value="current">Periodo: Ene–Jun 2025</option></select></label>
        <label><span className="sr-only">Grupo</span><select defaultValue={result.group}><option value={result.group}>Grupo: {result.group}</option></select></label>
        <label><span className="sr-only">Comparar con</span><select defaultValue="previous"><option value="previous">Comparar con: Anterior</option></select></label>
      </div>
      <div className="teacher-insight-grid">
        <section className="surface teacher-average-card" aria-label="Promedio general"><h2>PROMEDIO GENERAL</h2><strong>{result.averageScore.toFixed(1)}</strong><p>de 10.0 · {result.responseCount} respuestas</p></section>
        <section className="teacher-insight-card"><p>HALLAZGO PRINCIPAL</p><h2>{result.insightTitle}</h2><span>{result.insightText}</span></section>
      </div>
      <DimensionBars title="Resultados por dimensión / 10" dimensions={result.dimensions} />
      <TeacherPrivacyNotice />
    </div>
  </TeacherLayout>
}
