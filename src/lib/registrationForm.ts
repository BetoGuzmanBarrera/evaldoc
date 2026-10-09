import type { RegistrationProgram, RegistrationSubject } from './registrationCatalog'

export type RequestedRole = 'student' | 'teacher'

export function registrationLabels(role: RequestedRole) {
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

export function registrationCatalogEmptyMessage(
  role: RequestedRole,
  programs: RegistrationProgram[],
  subjects: RegistrationSubject[],
): string | null {
  if (role === 'student' && programs.length === 0) {
    return 'Esta institución aún no tiene oferta académica configurada.'
  }
  if (role === 'teacher' && subjects.length === 0) {
    return 'Esta institución aún no tiene materias configuradas.'
  }
  return null
}

export function availableSubjects(
  subjects: RegistrationSubject[], role: RequestedRole, programId: string,
): RegistrationSubject[] {
  if (role === 'teacher') return subjects
  return subjects.filter((subject) => subject.program_id === null || subject.program_id === programId)
}

export function validAcademicSelection(
  role: RequestedRole,
  institutionId: string,
  programId: string,
  subjectIds: string[],
  programs: RegistrationProgram[],
  subjects: RegistrationSubject[],
): boolean {
  if (role === 'student' && !programs.some((item) => item.id === programId && item.institution_id === institutionId)) return false
  const available = availableSubjects(subjects, role, programId)
  return subjectIds.length > 0
    && subjectIds.length <= 30
    && new Set(subjectIds).size === subjectIds.length
    && subjectIds.every((id) => available.some((item) => item.id === id && item.institution_id === institutionId))
}

export function registrationMetadata(
  role: RequestedRole,
  institutionId: string,
  fullName: string,
  identifier: string,
  programId: string,
  subjectIds: string[],
) {
  return {
    institution_id: institutionId,
    full_name: fullName,
    institutional_identifier: identifier,
    requested_role: role,
    ...(role === 'student' ? { requested_program_id: programId } : {}),
    requested_subject_ids: subjectIds,
  }
}