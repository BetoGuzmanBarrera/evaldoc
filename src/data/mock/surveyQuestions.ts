import type { SurveyQuestionData } from '../../types'

// Textos oficiales autorizados; el flujo autenticado obtiene las preguntas
// versionadas desde Supabase, no de esta lista local.
export const surveyQuestions: SurveyQuestionData[] = [
  { id: 'q1', dimension: 'DOMINIO DE LA MATERIA', text: 'Dominio de la materia' },
  { id: 'q2', dimension: 'PLANEACIÓN DE CLASES', text: 'Planeación de clases' },
  { id: 'q3', dimension: 'CLARIDAD EN LAS EXPLICACIONES', text: 'Claridad en las explicaciones' },
  { id: 'q4', dimension: 'FOMENTO DE LA PARTICIPACIÓN', text: 'Fomento de la participación' },
  { id: 'q5', dimension: 'USO DE RECURSOS DIDÁCTICOS', text: 'Uso de recursos didácticos' },
  { id: 'q6', dimension: 'RESOLUCIÓN DE DUDAS', text: 'Resolución de dudas' },
  { id: 'q7', dimension: 'PUNTUALIDAD', text: 'Puntualidad' },
  { id: 'q8', dimension: 'ASISTENCIA', text: 'Asistencia' },
  { id: 'q9', dimension: 'CUMPLIMIENTO DEL PROGRAMA', text: 'Cumplimiento del programa' },
  { id: 'q10', dimension: 'RETROALIMENTACIÓN', text: 'Retroalimentación' },
  { id: 'q11', dimension: 'EVALUACIÓN OBJETIVA', text: 'Evaluación objetiva' },
  { id: 'q12', dimension: 'USO DE TECNOLOGÍA', text: 'Uso de tecnología' },
  { id: 'q13', dimension: 'TRATO RESPETUOSO', text: 'Trato respetuoso' },
  { id: 'q14', dimension: 'MOTIVACIÓN AL APRENDIZAJE', text: 'Motivación al aprendizaje' },
  { id: 'q15', dimension: 'SATISFACCIÓN GENERAL', text: 'Satisfacción general' },
]
