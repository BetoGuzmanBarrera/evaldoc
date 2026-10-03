import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  loadTeacherAssignments,
  loadTeacherHistory,
  loadTeacherPeriodBreakdown,
  type TeacherAssignmentResult,
  type TeacherPeriodResult,
  type TeacherQuestionScore,
} from '../lib/teacherResults'

interface TeacherOverview {
  assignments: TeacherAssignmentResult[]
  history: TeacherPeriodResult[]
  breakdown: TeacherQuestionScore[]
}

const emptyOverview: TeacherOverview = { assignments: [], history: [], breakdown: [] }

export function useTeacherOverview() {
  const { user } = useAuth()
  const [data, setData] = useState<TeacherOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [assignments, history] = await Promise.all([
          loadTeacherAssignments(), loadTeacherHistory(),
        ])
        const period = history[0]
        const breakdown = period && period.averageScore !== null
          ? await loadTeacherPeriodBreakdown(period.id)
          : []
        if (!active) return
        setData({ assignments, history, breakdown })
        setError(false)
      } catch {
        if (!active) return
        setData(emptyOverview)
        setError(true)
      } finally {
        if (active) {
          setLoadedFor(user?.id ?? null)
          setLoading(false)
        }
      }
    }
    void load()
    return () => { active = false }
  }, [user?.id, revision])

  const reload = () => {
    setLoading(true)
    setError(false)
    setRevision((current) => current + 1)
  }

  const current = loadedFor === user?.id
  return { ...(current ? data : emptyOverview), loading: loading || !current, error: current && error, reload }
}

export function useTeacherAssignment(assignmentId: string | null) {
  const { user } = useAuth()
  const [result, setResult] = useState<TeacherAssignmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const requestKey = `${user?.id ?? ''}:${assignmentId ?? ''}`

  useEffect(() => {
    if (!assignmentId) return
    let active = true
    loadTeacherAssignments(assignmentId).then((rows) => {
      if (!active) return
      setResult(rows[0] ?? null)
      setError(false)
      setLoading(false)
      setLoadedFor(requestKey)
    }).catch(() => {
      if (!active) return
      setResult(null)
      setError(true)
      setLoading(false)
      setLoadedFor(requestKey)
    })
    return () => { active = false }
  }, [assignmentId, user?.id, revision, requestKey])

  const reload = () => {
    setLoading(true)
    setError(false)
    setRevision((current) => current + 1)
  }

  const current = loadedFor === requestKey
  return {
    result: current ? result : null,
    loading: Boolean(assignmentId) && (loading || !current),
    error: current && error,
    reload,
  }
}
