import { publicRegistrationClient } from './publicRegistrationClient'

export interface RegistrationProgram {
  id: string
  institution_id: string
  name: string
  code: string
}

export interface RegistrationSubject {
  id: string
  institution_id: string
  program_id: string | null
  name: string
  code: string
}

export async function loadRegistrationCatalog(institutionId: string): Promise<{
  programs: RegistrationProgram[]
  subjects: RegistrationSubject[]
}> {
  const [programs, subjects] = await Promise.all([
    publicRegistrationClient.from('programs').select('id,institution_id,name,code')
      .eq('institution_id', institutionId).eq('active', true).order('name'),
    publicRegistrationClient.from('subjects').select('id,institution_id,program_id,name,code')
      .eq('institution_id', institutionId).eq('active', true).order('name'),
  ])
  if (programs.error || subjects.error) throw new Error('registration_catalog_unavailable')
  return {
    programs: (programs.data ?? []) as RegistrationProgram[],
    subjects: (subjects.data ?? []) as RegistrationSubject[],
  }
}