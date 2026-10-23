import type { RegistrationCampus, RegistrationProgram } from './registrationCatalog'

export type RequestedRole = 'student' | 'teacher' | 'coordinator'

export function registrationLabels(role: RequestedRole) {
  if (role === 'coordinator') {
    return {
      identifier: 'Número de empleado',
      note: 'Tu institución deberá validar tu solicitud de coordinación.',
    }
  }
  return role === 'teacher'
    ? {
      identifier: 'Número de empleado',
      note: 'Coordinación te asignará materias y grupos después de aprobar tu cuenta.',
    }
    : {
      identifier: 'Número de cuenta',
      note: 'Coordinación te inscribirá en grupos reales después de aprobar tu cuenta.',
    }
}

export function availablePrograms(programs: RegistrationProgram[], campusId: string) {
  return programs.filter((program) => program.campus_id === campusId)
}

export function registrationCatalogEmptyMessage(
  role: RequestedRole, campuses: RegistrationCampus[],
  programs: RegistrationProgram[], campusId: string,
): string | null {
  if (role === 'coordinator') return null
  if (campuses.length === 0) return 'Esta institución aún no tiene campus configurados.'
  if (role === 'student' && campusId && availablePrograms(programs, campusId).length === 0) {
    return 'Este campus aún no tiene carreras configuradas.'
  }
  return null
}

export function validAcademicSelection(
  role: RequestedRole, institutionId: string, campusId: string,
  programId: string, campuses: RegistrationCampus[], programs: RegistrationProgram[],
): boolean {
  if (role === 'coordinator') {
    return Boolean(institutionId) && !campusId && !programId
  }
  if (!campuses.some((item) => item.id === campusId
    && item.institution_id === institutionId)) return false
  if (role === 'teacher') return !programId
  return availablePrograms(programs, campusId)
    .some((item) => item.id === programId && item.institution_id === institutionId)
}

export function registrationMetadata(
  role: RequestedRole, institutionId: string, fullName: string,
  identifier: string, campusId: string, programId: string,
) {
  return {
    institution_id: institutionId,
    full_name: fullName,
    institutional_identifier: identifier,
    requested_role: role,
    ...(role !== 'coordinator' ? { requested_campus_id: campusId } : {}),
    ...(role === 'student' ? { requested_program_id: programId } : {}),
  }
}
