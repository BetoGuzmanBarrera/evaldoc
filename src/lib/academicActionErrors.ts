export type AcademicFailure =
  | 'duplicate'
  | 'incomplete'
  | 'permission'
  | 'incompatible'
  | 'unavailable'

export class AcademicActionError extends Error {
  readonly reason: AcademicFailure

  constructor(reason: AcademicFailure) {
    super(reason)
    this.reason = reason
  }
}

export function hasIncompleteAcademicSelection(values: readonly unknown[]): boolean {
  return values.some((value) =>
    value == null || (typeof value === 'string' && value.trim().length === 0))
}

export function classifyAcademicErrorCode(code: string | undefined): AcademicFailure {
  switch (code) {
    case '23505':
      return 'duplicate'
    case '23502':
    case '22P02':
      return 'incomplete'
    case '42501':
    case 'PGRST301':
    case 'PGRST302':
      return 'permission'
    case '23503':
    case '23514':
    case '22023':
      return 'incompatible'
    default:
      return 'unavailable'
  }
}

export function academicActionErrorMessage(error: unknown): string {
  const reason = error instanceof AcademicActionError ? error.reason : 'unavailable'
  switch (reason) {
    case 'duplicate':
      return 'Ya existe un registro con esos datos.'
    case 'incomplete':
      return 'Completa todos los datos antes de guardar.'
    case 'permission':
      return 'No tienes permisos para realizar esta operación. Vuelve a iniciar sesión si es necesario.'
    case 'incompatible':
      return 'La selección no es compatible con la estructura académica autorizada.'
    case 'unavailable':
      return 'No pudimos guardar el cambio. Inténtalo de nuevo.'
  }
}
