import type { EvaluationStatus } from '../../types'
export function StatusBadge({ status }: { status: EvaluationStatus }) {
  return <span className={`status-badge status-${status}`}>{status === 'completed' ? 'Completada' : 'Pendiente'}</span>
}
