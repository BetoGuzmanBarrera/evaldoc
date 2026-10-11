import type { RegistrationCampus, RegistrationProgram, RegistrationSubject } from './registrationCatalog'

export type RequestedRole = 'student' | 'teacher' | 'coordinator'

export function registrationLabels(role: RequestedRole) {
  if (role === 'coordinator') {
    return {
      identifier: 'Número de empleado',
      subjects: '',
      note: 'Tu institución deberá validar tu solicitud de coordinación.',
    }
  }
  return role === 'teacher'
    ? {
      identifier: 'Número de empleado',
      subjects: 'Materias que impartes',
      note: 'Tu institución verificará tu cuenta, materias y grupos antes de habilitar el acceso docente.',
    }
    : {
      identifier: 'Número de cuenta',
      subjects: 'Materias del periodo',
      note: 'Las materias seleccionadas serán verificadas por tu institución antes de habilitar tus evaluaciones.',
    }
}

export function availablePrograms(programs: RegistrationProgram[], campusId: string) {
  return programs.filter((program) => program.campus_id === campusId)
}

export function availableSubjects(
  subjects: RegistrationSubject[], programs: RegistrationProgram[],
  role: RequestedRole, campusId: string, programId: string,
): RegistrationSubject[] {
  if (role === 'coordinator') return []
  const programIds = new Set(availablePrograms(programs, campusId).map((item) => item.id))
  return subjects.filter((subject) => programIds.has(subject.program_id)
    && (role === 'teacher' || subject.program_id === programId))
}

export function registrationCatalogEmptyMessage(
  role: RequestedRole, campuses: RegistrationCampus[],
  programs: RegistrationProgram[], subjects: RegistrationSubject[],
  campusId: string, programId: string,
): string | null {
  if (role === 'coordinator') return null
  if (campuses.length === 0) return 'Esta institución aún no tiene campus configurados.'
  if (campusId && availablePrograms(programs, campusId).length === 0) {
    return 'Este campus aún no tiene carreras configuradas.'
  }
  if (role === 'student' && programId
    && availableSubjects(subjects, programs, role, campusId, programId).length === 0) {
    return 'Esta carrera aún no tiene materias configuradas.'
  }
  if (role === 'teacher' && campusId
    && availableSubjects(subjects, programs, role, campusId, '').length === 0) {
    return 'Este campus aún no tiene materias configuradas.'
  }
  return null
}

export function validAcademicSelection(
  role: RequestedRole, institutionId: string, campusId: string,
  programId: string, subjectIds: string[],
  campuses: RegistrationCampus[], programs: RegistrationProgram[],
  subjects: RegistrationSubject[],
): boolean {
  if (role === 'coordinator') {
    return Boolean(institutionId) && !campusId && !programId && subjectIds.length === 0
  }
  if (!campuses.some((item) => item.id === campusId
    && item.institution_id === institutionId)) return false
  if (role === 'student' && !availablePrograms(programs, campusId)
    .some((item) => item.id === programId && item.institution_id === institutionId)) return false
  const available = availableSubjects(subjects, programs, role, campusId, programId)
  return subjectIds.length > 0
    && subjectIds.length <= 30
    && new Set(subjectIds).size === subjectIds.length
    && subjectIds.every((id) => available.some((item) => item.id === id
      && item.institution_id === institutionId))
}

export function registrationMetadata(
  role: RequestedRole, institutionId: string, fullName: string,
  identifier: string, campusId: string, programId: string, subjectIds: string[],
) {
  return {
    institution_id: institutionId,
    full_name: fullName,
    institutional_identifier: identifier,
    requested_role: role,
    ...(role !== 'coordinator' ? { requested_campus_id: campusId } : {}),
    ...(role === 'student' ? { requested_program_id: programId } : {}),
    ...(role !== 'coordinator' ? { requested_subject_ids: subjectIds } : {}),
  }
}
