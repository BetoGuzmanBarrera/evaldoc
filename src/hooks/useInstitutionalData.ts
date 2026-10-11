import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { InstitutionalAccessError } from '../lib/institutionalDashboards'

interface Snapshot<T> {
  key: string
  data: T | null
  error: 'denied' | 'network' | null
}

export function useInstitutionalData<T>(key: string, loader: () => Promise<T>) {
  const { user } = useAuth()
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)
  const requestKey = `${user?.id ?? ''}:${key}:${revision}`

  useEffect(() => {
    let active = true
    loader().then((data) => {
      if (active) setSnapshot({ key: requestKey, data, error: null })
    }).catch((error: unknown) => {
      if (active) setSnapshot({
        key: requestKey, data: null,
        error: error instanceof InstitutionalAccessError ? 'denied' : 'network',
      })
    })
    return () => { active = false }
  }, [loader, requestKey])

  const current = snapshot?.key === requestKey
  return {
    data: current ? snapshot.data : null,
    error: current ? snapshot.error : null,
    loading: !current,
    reload: () => setRevision((value) => value + 1),
  }
}
