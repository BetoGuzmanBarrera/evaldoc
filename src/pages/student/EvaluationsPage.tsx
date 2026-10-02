import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { EvaluationCard } from '../../components/evaluation/EvaluationCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { useStudentEvaluations } from '../../hooks/useStudentEvaluations'

type Tab = 'pending' | 'completed' | 'all'

export function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const { evaluations, loading, error, reload } = useStudentEvaluations()
  const total = evaluations.length
  const completed = evaluations.filter((item) => item.status === 'completed').length
  const pending = total - completed
  const visible = evaluations.filter((item) =>
    tab === 'all' || (tab === 'completed' ? item.status === 'completed' : item.status === 'pending')
  )

  return <StudentLayout
    title="Mis evaluaciones"
    subtitle="Consulta y completa tus encuestas disponibles"
    period={evaluations[0]?.periodName}
  >
    <div className="evaluations-content">
      <div className="evaluation-tabs" role="tablist" aria-label="Filtrar evaluaciones">
        <button type="button" role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pendientes ({pending})</button>
        <button type="button" role="tab" aria-selected={tab === 'completed'} className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>Completadas ({completed})</button>
        <button type="button" role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Todas ({total})</button>
      </div>
      <div className="privacy-alert"><ShieldCheck size={20} aria-hidden="true" /><p>Tus respuestas no serán visibles individualmente por el docente. Todas las evaluaciones son anónimas.</p></div>
      {loading ? <LoadingSkeleton /> : error
        ? <div className="simple-panel surface" role="alert"><p>No pudimos cargar tus evaluaciones.</p><button className="button button-outline" type="button" onClick={reload}>Reintentar</button></div>
        : visible.length === 0
          ? <EmptyState
            title={tab === 'pending' ? 'No tienes evaluaciones pendientes' : 'No hay evaluaciones aquí'}
            message={tab === 'pending' ? 'Cuando se habiliten encuestas para tus materias, aparecerán aquí.' : 'Consulta las otras pestañas para ver tus encuestas.'}
          />
          : <div className="evaluation-grid">{visible.map((item) =>
            <EvaluationCard key={item.id} evaluation={item} />
          )}</div>}
    </div>
  </StudentLayout>
}
