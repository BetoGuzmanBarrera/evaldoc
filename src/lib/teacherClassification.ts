export type TeacherClassification = 'contratable' | 'intermedio' | 'no_contratable' | 'protected' | 'unavailable'

export const minimumPublishableResponses = 5

export const classificationDisclaimer = 'Este resultado funciona como indicador de apoyo para la toma de decisiones institucionales y no determina automáticamente una decisión laboral.'
export const pdfClassificationDisclaimer = 'La clasificación presentada funciona como un indicador de apoyo para la toma de decisiones institucionales y no determina automáticamente una decisión laboral.'

const labels: Record<TeacherClassification, string> = {
  contratable: 'Contratable',
  intermedio: 'Intermedio',
  no_contratable: 'No contratable',
  protected: 'Resultado protegido',
  unavailable: 'Clasificación no disponible',
}

export function classifyTeacherScore(average: number | null, publishableResponseCount: number): TeacherClassification {
  if (!Number.isFinite(publishableResponseCount) || publishableResponseCount < 0 || !Number.isInteger(publishableResponseCount)) return 'unavailable'
  if (publishableResponseCount < minimumPublishableResponses) return 'protected'
  if (average === null || !Number.isFinite(average) || average < 0 || average > 10) return 'unavailable'
  if (average >= 8) return 'contratable'
  if (average >= 6) return 'intermedio'
  return 'no_contratable'
}

export function teacherClassificationLabel(classification: TeacherClassification): string {
  return labels[classification]
}
