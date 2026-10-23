import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { loadStudentEnrollments, type StudentEnrollment } from '../lib/studentEnrollments'

export function useStudentEnrollments() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    loadStudentEnrollments().then((items) => {
      if (!active) return
      setEnrollments(items)
      setError(false)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setEnrollments([])
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

  return { enrollments, loading, error, reload }
}
