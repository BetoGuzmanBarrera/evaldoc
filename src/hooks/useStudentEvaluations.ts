import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { loadStudentEvaluations, type StudentEvaluation } from '../lib/studentEvaluations'

export function useStudentEvaluations() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    loadStudentEvaluations().then((items) => {
      if (!active) return
      setEvaluations(items)
      setError(false)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setEvaluations([])
      setError(true)
      setLoading(false)
    })
    return () => { active = false }
  }, [user?.id, revision])

  const reload = () => {
    setLoading(true)
    setError(false)
    setRevision((current) => current + 1)
  }

  return { evaluations, loading, error, reload }
}
