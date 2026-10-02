import { supabase } from './supabase'

export interface RegistrationInstitution {
  id: string
  name: string
  short_name: string
}

let request: Promise<RegistrationInstitution[]> | null = null

export function getRegistrationInstitutions(): Promise<RegistrationInstitution[]> {
  if (request) return request
  const next = Promise.resolve(supabase.from('institutions')
      .select('id,name,short_name')
      .eq('active', true)
      .order('name'))
      .then(({ data, error }) => {
        if (error) throw error
        return (data ?? []) as RegistrationInstitution[]
      })
      .catch((error: unknown) => {
        request = null
        throw error
      })
  request = next
  return next
}
