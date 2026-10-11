import { publicRegistrationClient } from './publicRegistrationClient'

export interface RegistrationInstitution {
  id: string
  name: string
  short_name: string
}

export async function getRegistrationInstitutions(): Promise<RegistrationInstitution[]> {
  const { data, error } = await publicRegistrationClient.from('institutions')
    .select('id,name,short_name')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return (data ?? []) as RegistrationInstitution[]
}