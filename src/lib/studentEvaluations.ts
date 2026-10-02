import type { Rating, SurveyQuestionData } from '../types'
import { supabase } from './supabase'

interface EvaluationRow {
  assignment_id: string
  window_id: string
  evaluation_id: string | null
  status: 'pending' | 'completed'
  subject_name: string
  teacher_name: string
  group_code: string
  period_name: string
  program_name: string
  closes_at: string
  submitted_at: string | null
  template_id: string
  can_submit: boolean
}

interface QuestionRow {
  id: string
  dimension: string
  prompt: string
  position: number
  question_type: 'scale' | 'text'
  required: boolean
  active: boolean
}

export interface StudentEvaluation {
  id: string
  assignmentId: string
  windowId: string
  evaluationId: string | null
  status: 'pending' | 'completed'
  subjectName: string
  teacherName: string
  groupCode: string
  periodName: string
  programName: string
  closesAt: string
  submittedAt: string | null
  templateId: string
  canSubmit: boolean
}

export type SubmissionFailure =
  | 'already_submitted'
  | 'window_closed'
  | 'session_expired'
  | 'evaluation_unavailable'
  | 'invalid_answers'
  | 'questionnaire_unavailable'
  | 'network'

export class StudentEvaluationError extends Error {
  readonly kind: SubmissionFailure

  constructor(kind: SubmissionFailure) {
    super(kind)
    this.kind = kind
  }
}

const allowedRatings: readonly number[] = [0, 2.5, 5, 7.5, 10]

export function evaluationRouteId(assignmentId: string, windowId: string): string {
  return assignmentId + '.' + windowId
}

export async function loadStudentEvaluations(): Promise<StudentEvaluation[]> {
  const { data, error } = await supabase.rpc('my_student_evaluations')
  if (error || !Array.isArray(data)) throw new Error('student_evaluations_load_failed')
  const rows = data as EvaluationRow[]
  return rows.map((row) => ({
    id: evaluationRouteId(row.assignment_id, row.window_id),
    assignmentId: row.assignment_id,
    windowId: row.window_id,
    evaluationId: row.evaluation_id,
    status: row.status,
    subjectName: row.subject_name,
    teacherName: row.teacher_name,
    groupCode: row.group_code,
    periodName: row.period_name,
    programName: row.program_name,
    closesAt: row.closes_at,
    submittedAt: row.submitted_at,
    templateId: row.template_id,
    canSubmit: row.can_submit,
  }))
}

export async function loadSurveyQuestions(templateId: string): Promise<SurveyQuestionData[]> {
  const { data, error } = await supabase
    .from('survey_questions')
    .select('id,dimension,prompt,position,question_type,required,active')
    .eq('survey_template_id', templateId)
    .eq('active', true)
    .order('position', { ascending: true })
  if (error || !data) throw new Error('survey_questions_load_failed')
  const rows = data as QuestionRow[]
  if (rows.length !== 15 || rows.some((row) => row.question_type !== 'scale' || !row.required)) {
    throw new StudentEvaluationError('questionnaire_unavailable')
  }
  return rows.map((row) => ({
    id: row.id,
    dimension: row.dimension.toUpperCase(),
    text: row.prompt,
  }))
}

function mapSubmissionError(message: string): SubmissionFailure {
  if (/jwt expired|invalid jwt|pgrst301|pgrst302/i.test(message)) return 'session_expired'
  if (message.includes('already_submitted')) return 'already_submitted'
  if (message.includes('window_closed')) return 'window_closed'
  if (message.includes('session_expired')) return 'session_expired'
  if (message.includes('evaluation_unavailable')) return 'evaluation_unavailable'
  if (message.includes('invalid_answers')) return 'invalid_answers'
  if (message.includes('questionnaire_unavailable')) return 'questionnaire_unavailable'
  return 'network'
}

export function submissionMessage(kind: SubmissionFailure): string {
  switch (kind) {
    case 'already_submitted': return 'Esta evaluación ya fue contestada.'
    case 'window_closed': return 'La ventana de evaluación ya está cerrada.'
    case 'session_expired': return 'Tu sesión expiró. Inicia sesión de nuevo.'
    case 'evaluation_unavailable': return 'Esta evaluación no está disponible para tu cuenta.'
    case 'invalid_answers': return 'Revisa que todos los reactivos tengan una respuesta válida.'
    case 'questionnaire_unavailable': return 'El cuestionario no está disponible por el momento.'
    case 'network': return 'No pudimos enviar la evaluación. Inténtalo de nuevo.'
  }
}

export async function submitStudentEvaluation(
  evaluation: StudentEvaluation,
  questions: SurveyQuestionData[],
  answers: Record<string, Rating>,
): Promise<string> {
  if (questions.length !== 15 || questions.some((question) =>
    answers[question.id] === undefined || !allowedRatings.includes(answers[question.id])
  )) {
    throw new StudentEvaluationError('invalid_answers')
  }
  const payload = questions.map((question) => ({
    question_id: question.id,
    value: answers[question.id],
  }))
  try {
    const { data, error } = await supabase.rpc('submit_evaluation', {
      p_assignment_id: evaluation.assignmentId,
      p_window_id: evaluation.windowId,
      p_answers: payload,
    })
    if (error) throw new StudentEvaluationError(mapSubmissionError(error.message))
    if (typeof data !== 'string') throw new StudentEvaluationError('network')
    return data
  } catch (error) {
    if (error instanceof StudentEvaluationError) throw error
    throw new StudentEvaluationError('network')
  }
}

export function formatEvaluationDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(new Date(value))
}
