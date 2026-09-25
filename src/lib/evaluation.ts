import { evaluations } from '../data/mock/evaluations'
import { subjects } from '../data/mock/subjects'
import { teachers } from '../data/mock/teachers'

export function getEvaluationDetails(id: string) {
  const evaluation = evaluations.find((item) => item.id === id)
  const subject = subjects.find((item) => item.id === evaluation?.subjectId)
  const teacher = teachers.find((item) => item.id === subject?.teacherId)
  return evaluation && subject && teacher ? { evaluation, subject, teacher } : null
}

const storageKey = 'evaldoc-demo-completed'

export function getCompletedIds(): string[] {
  try {
    const stored = window.localStorage.getItem(storageKey)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

export function markCompleted(id: string): void {
  const ids = getCompletedIds()
  if (!ids.includes(id)) window.localStorage.setItem(storageKey, JSON.stringify([...ids, id]))
}
