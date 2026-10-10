import type { RequestedRole } from './registrationForm'

export function pendingRequestMessage(
  requestedRole: RequestedRole,
  rejected: boolean,
  institutionName: string,
): { heading: string; description: string } {
  if (rejected) {
    return {
      heading: 'Tu solicitud fue rechazada',
      description: `Contacta a ${institutionName} para conocer los siguientes pasos.`,
    }
  }
  if (requestedRole === 'coordinator') {
    return {
      heading: 'Tu solicitud de coordinación está pendiente',
      description: `Tu institución deberá validar tu solicitud de coordinación. Institución: ${institutionName}.`,
    }
  }
  if (requestedRole === 'teacher') {
    return {
      heading: 'Tu solicitud de cuenta docente está pendiente',
      description: `Tu solicitud de cuenta docente está pendiente de validación por ${institutionName}.`,
    }
  }
  return {
    heading: 'Tu cuenta de estudiante está pendiente de validación',
    description: `Tu cuenta de estudiante está pendiente de validación institucional por ${institutionName}.`,
  }
}
