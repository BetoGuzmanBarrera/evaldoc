import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { StudentLayout } from '../../components/layout/StudentLayout'
import { EvaluationCard } from '../../components/evaluation/EvaluationCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { evaluations } from '../../data/mock/evaluations'
import { getEvaluationDetails } from '../../lib/evaluation'
import { useEvaluationProgress } from '../../hooks/useEvaluationProgress'

type Tab = 'pending' | 'completed' | 'all'
const referencePendingIds = new Set(['matematicas', 'bases-datos', 'sistemas'])

export function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const { isCompleted, total, completed, pending } = useEvaluationProgress()
  const visible = evaluations.filter((item) => tab === 'all' || (tab === 'completed' ? isCompleted(item.id) : !isCompleted(item.id) && referencePendingIds.has(item.id)))
  return <StudentLayout title="Mis evaluaciones" subtitle="Consulta y completa tus encuestas disponibles"><div className="evaluations-content"><div className="evaluation-tabs" role="tablist" aria-label="Filtrar evaluaciones"><button type="button" role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pendientes ({pending})</button><button type="button" role="tab" aria-selected={tab === 'completed'} className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>Completadas ({completed})</button><button type="button" role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Todas ({total})</button></div><div className="privacy-alert"><ShieldCheck size={20} aria-hidden="true" /><p>Tus respuestas no serán visibles individualmente por el docente. Todas las evaluaciones son anónimas.</p></div>{visible.length === 0 ? <EmptyState title="No hay evaluaciones aquí" message="Consulta las otras pestañas para ver tus encuestas." /> : <div className="evaluation-grid">{visible.map((item) => { const details = getEvaluationDetails(item.id); return details ? <EvaluationCard key={item.id} evaluation={item} subject={details.subject} teacher={details.teacher} completed={isCompleted(item.id)} /> : null })}</div>}</div></StudentLayout>
}
