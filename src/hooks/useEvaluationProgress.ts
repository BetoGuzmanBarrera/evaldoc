import { evaluations } from '../data/mock/evaluations'
import { getCompletedIds } from '../lib/evaluation'

export function useEvaluationProgress() {
  const newlyCompleted = getCompletedIds()
  const isCompleted = (id: string) => evaluations.find((item) => item.id === id)?.status === 'completed' || newlyCompleted.includes(id)
  const completed = evaluations.filter((item) => isCompleted(item.id)).length
  return { isCompleted, total: evaluations.length, completed, pending: evaluations.length - completed, progress: Math.floor(completed / evaluations.length * 100) }
}
