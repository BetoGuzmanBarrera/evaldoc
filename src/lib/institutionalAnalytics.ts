import { supabase } from './supabase'
import { assertRows, type InstitutionalFilters } from './institutionalDashboards'

export interface AnalyticsOverview {
  averageScore: number | null
  responseCount: number
  teacherCount: number
  expected: number
  completed: number
  pending: number
  participation: number
}

export interface AnalyticsTrendPoint extends AnalyticsOverview {
  periodId: string
  periodName: string
  startsAt: string
}

export interface PeriodComparison {
  currentPeriodId: string
  currentPeriodName: string
  previousPeriodId: string | null
  previousPeriodName: string | null
  currentScore: number | null
  previousScore: number | null
  absoluteChange: number | null
  percentageChange: number | null
  currentParticipation: number
  previousParticipation: number | null
}

export interface AnalyticsBreakdownRow {
  scope: 'campus' | 'program' | 'group'
  id: string | null
  label: string
  averageScore: number
  responseCount: number
  teacherCount: number
  assignmentCount: number
}

export interface QuestionAnalyticsRow {
  order: number
  text: string
  averageScore: number
  responseCount: number
}

export interface TeacherTrendRow {
  teacherId: string
  teacherName: string
  periodId: string
  periodName: string
  startsAt: string
  averageScore: number
  responseCount: number
  assignmentCount: number
}

function filterArgs(filters: InstitutionalFilters) {
  return {
    p_period_id: filters.period || null,
    p_campus_id: filters.campus || null,
    p_program_id: filters.program || null,
    p_group_id: filters.group || null,
  }
}

function numberOrNull(value: unknown): number | null {
  return value === null ? null : Number(value)
}

export async function loadAnalyticsOverview(filters: InstitutionalFilters = {}): Promise<AnalyticsOverview> {
  const { data, error } = await supabase.rpc('institution_analytics_overview', filterArgs(filters))
  const row = assertRows(data, error)[0]
  if (!row) throw new Error('analytics_overview_missing')
  return {
    averageScore: numberOrNull(row.average_score), responseCount: Number(row.response_count),
    teacherCount: Number(row.teacher_count), expected: Number(row.expected),
    completed: Number(row.completed), pending: Number(row.pending),
    participation: Number(row.participation),
  }
}

export async function loadAnalyticsTrend(filters: Omit<InstitutionalFilters, 'period'> = {}): Promise<AnalyticsTrendPoint[]> {
  const { data, error } = await supabase.rpc('institution_analytics_trend', {
    p_campus_id: filters.campus || null,
    p_program_id: filters.program || null,
    p_group_id: filters.group || null,
  })
  return assertRows(data, error).map((row) => ({
    periodId: row.period_id as string, periodName: row.period_name as string,
    startsAt: row.starts_at as string, averageScore: numberOrNull(row.average_score),
    responseCount: Number(row.response_count), teacherCount: Number(row.teacher_count),
    expected: Number(row.expected), completed: Number(row.completed),
    pending: Number(row.pending), participation: Number(row.participation),
  }))
}

export async function loadPeriodComparison(filters: InstitutionalFilters = {}): Promise<PeriodComparison | null> {
  const { data, error } = await supabase.rpc('institution_analytics_comparison', filterArgs(filters))
  const row = assertRows(data, error)[0]
  if (!row) return null
  return {
    currentPeriodId: row.current_period_id as string,
    currentPeriodName: row.current_period_name as string,
    previousPeriodId: row.previous_period_id as string | null,
    previousPeriodName: row.previous_period_name as string | null,
    currentScore: numberOrNull(row.current_score),
    previousScore: numberOrNull(row.previous_score),
    absoluteChange: numberOrNull(row.absolute_change),
    percentageChange: numberOrNull(row.percentage_change),
    currentParticipation: Number(row.current_participation),
    previousParticipation: numberOrNull(row.previous_participation),
  }
}

export async function loadAnalyticsBreakdown(filters: InstitutionalFilters = {}): Promise<AnalyticsBreakdownRow[]> {
  const { data, error } = await supabase.rpc('institution_analytics_breakdown', filterArgs(filters))
  return assertRows(data, error).map((row) => ({
    scope: row.scope as AnalyticsBreakdownRow['scope'], id: row.scope_id as string | null,
    label: row.label as string, averageScore: Number(row.average_score),
    responseCount: Number(row.response_count), teacherCount: Number(row.teacher_count),
    assignmentCount: Number(row.assignment_count),
  }))
}

export async function loadQuestionAnalytics(filters: InstitutionalFilters = {}): Promise<QuestionAnalyticsRow[]> {
  const { data, error } = await supabase.rpc('institution_question_analytics', filterArgs(filters))
  return assertRows(data, error).map((row) => ({
    order: Number(row.question_order), text: row.question_text as string,
    averageScore: Number(row.average_score), responseCount: Number(row.response_count),
  }))
}

export async function loadTeacherTrends(teacherId: string, filters: Omit<InstitutionalFilters, 'period'> = {}): Promise<TeacherTrendRow[]> {
  const { data, error } = await supabase.rpc('institution_teacher_trends', {
    p_teacher_id: teacherId,
    p_campus_id: filters.campus || null,
    p_program_id: filters.program || null,
    p_group_id: filters.group || null,
  })
  return assertRows(data, error).map((row) => ({
    teacherId: row.teacher_id as string, teacherName: row.teacher_name as string,
    periodId: row.period_id as string, periodName: row.period_name as string,
    startsAt: row.starts_at as string, averageScore: Number(row.average_score),
    responseCount: Number(row.response_count), assignmentCount: Number(row.assignment_count),
  }))
}
