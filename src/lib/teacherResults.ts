import { supabase } from './supabase'

interface AssignmentRow {
  assignment_id: string
  period_id: string
  period_name: string
  period_starts_at: string
  subject_name: string
  group_code: string
  response_count: number
  average_score: number | null
  favorable_percent: number | null
  question_scores: unknown
  published: boolean
}

interface HistoryRow {
  period_id: string
  period_name: string
  period_starts_at: string
  response_count: number
  published_responses: number
  assignment_count: number
  average_score: number | null
  favorable_percent: number | null
}

interface BreakdownRow {
  question_position: number
  label: string
  score: number
  response_count: number
}

export interface TeacherQuestionScore {
  id: string
  position: number
  label: string
  score: number
}

export interface TeacherAssignmentResult {
  id: string
  periodId: string
  periodName: string
  periodStartsAt: string
  subjectName: string
  groupCode: string
  responseCount: number
  averageScore: number | null
  favorablePercent: number | null
  questions: TeacherQuestionScore[]
  published: boolean
}

export interface TeacherPeriodResult {
  id: string
  name: string
  startsAt: string
  responseCount: number
  publishedResponses: number
  assignmentCount: number
  averageScore: number | null
  favorablePercent: number | null
}

function toQuestionScores(value: unknown): TeacherQuestionScore[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    if (typeof row.id !== 'string' || typeof row.label !== 'string'
      || typeof row.position !== 'number' || typeof row.score !== 'number') return []
    return [{ id: row.id, label: row.label, position: row.position, score: row.score }]
  })
}

export async function loadTeacherAssignments(assignmentId: string | null = null): Promise<TeacherAssignmentResult[]> {
  const { data, error } = await supabase.rpc('teacher_assignment_results', { p_assignment_id: assignmentId })
  if (error || !Array.isArray(data)) throw new Error('teacher_assignments_load_failed')
  return (data as AssignmentRow[]).map((row) => ({
    id: row.assignment_id,
    periodId: row.period_id,
    periodName: row.period_name,
    periodStartsAt: row.period_starts_at,
    subjectName: row.subject_name,
    groupCode: row.group_code,
    responseCount: Number(row.response_count),
    averageScore: row.average_score === null ? null : Number(row.average_score),
    favorablePercent: row.favorable_percent === null ? null : Number(row.favorable_percent),
    questions: toQuestionScores(row.question_scores),
    published: row.published,
  }))
}

export async function loadTeacherHistory(): Promise<TeacherPeriodResult[]> {
  const { data, error } = await supabase.rpc('teacher_results_history')
  if (error || !Array.isArray(data)) throw new Error('teacher_history_load_failed')
  return (data as HistoryRow[]).map((row) => ({
    id: row.period_id,
    name: row.period_name,
    startsAt: row.period_starts_at,
    responseCount: Number(row.response_count),
    publishedResponses: Number(row.published_responses),
    assignmentCount: Number(row.assignment_count),
    averageScore: row.average_score === null ? null : Number(row.average_score),
    favorablePercent: row.favorable_percent === null ? null : Number(row.favorable_percent),
  }))
}

export async function loadTeacherPeriodBreakdown(periodId: string): Promise<TeacherQuestionScore[]> {
  const { data, error } = await supabase.rpc('teacher_period_breakdown', { p_period_id: periodId })
  if (error || !Array.isArray(data)) throw new Error('teacher_breakdown_load_failed')
  return (data as BreakdownRow[]).map((row) => ({
    id: String(row.question_position) + ':' + row.label,
    position: row.question_position,
    label: row.label,
    score: Number(row.score),
  }))
}

export function isUuid(value: string | undefined): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
