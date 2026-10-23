import { publicRegistrationClient } from './publicRegistrationClient'

export interface RegistrationCampus {
  id: string
  institution_id: string
  name: string
}

export interface RegistrationProgram {
  id: string
  institution_id: string
  campus_id: string
  name: string
  code: string
}

export interface RegistrationCatalog {
  campuses: RegistrationCampus[]
  programs: RegistrationProgram[]
}

export async function loadRegistrationCatalog(institutionId: string): Promise<RegistrationCatalog> {
  const [campuses, programs] = await Promise.all([
    publicRegistrationClient.from('campuses').select('id,institution_id,name')
      .eq('institution_id', institutionId).eq('active', true).order('name'),
    publicRegistrationClient.from('programs').select('id,institution_id,campus_id,name,code')
      .eq('institution_id', institutionId).eq('active', true)
      .eq('catalog_visible', true).order('name'),
  ])
  if (campuses.error || programs.error) {
    throw new Error('registration_catalog_unavailable')
  }
  return {
    campuses: (campuses.data ?? []) as RegistrationCampus[],
    programs: (programs.data ?? []) as RegistrationProgram[],
  }
}
