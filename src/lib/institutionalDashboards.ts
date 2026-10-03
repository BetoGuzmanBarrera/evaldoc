import { supabase } from './supabase'

export type FilterScope = 'campus' | 'program' | 'group' | 'period'
export interface InstitutionalFilterOption {
  scope: FilterScope
  id: string
  label: string
  parentId: string | null
  periodId: string | null
}
export interface InstitutionalFilters {
  period?: string
  campus?: string
  program?: string
  group?: string
}
export type ParticipationScope = 'total' | FilterScope
export interface ParticipationRow {
  scope: ParticipationScope
  id: string | null
  label: string
  expected: number
  completed: number
  pending: number
  participation: number
  students: number
}
export interface TeacherRankingRow {
  id: string
  name: string
  averageScore: number
  responseCount: number
  assignmentCount: number
}
export interface ScoreSummary {
  averageScore: number | null
  responseCount: number
  teacherCount: number
}
export type HrCategory = 'Excelente' | 'Bueno' | 'Suficiente' | 'No Suficiente'
export interface HrTeacherRow extends TeacherRankingRow {
  subjectCount: number
  category: HrCategory
  recommendation: string
  maximumSubjects: number
}
export interface InstitutionOverview {
  id: string
  name: string
  shortName: string
  campusCount: number
  programCount: number
  subjectCount: number
  groupCount: number
  periodCount: number
  teacherCount: number
  studentCount: number
  expected: number
  completed: number
  pending: number
  participation: number
  averageScore: number | null
}
export interface AdminSummary {
  userCount: number
  pendingCount: number
  activeCount: number
  inactiveCount: number
  studentCount: number
  teacherCount: number
  coordinatorCount: number
  hrCount: number
  adminCount: number
  campusCount: number
  programCount: number
  subjectCount: number
  groupCount: number
  periodCount: number
}
export interface AdminUserRow {
  id: string
  name: string
  email: string
  status: 'pending' | 'active' | 'inactive'
  roles: string[]
}

export class InstitutionalAccessError extends Error {}

function assertRows(data: unknown, error: { code?: string } | null): Record<string, unknown>[] {
  if (error?.code === 'P0001' || error?.code === '42501') throw new InstitutionalAccessError('access_denied')
  if (error || !Array.isArray(data)) throw new Error('institutional_load_failed')
  return data as Record<string, unknown>[]
}

function args(filters: InstitutionalFilters) {
  return {
    p_period_id: filters.period || null,
    p_campus_id: filters.campus || null,
    p_program_id: filters.program || null,
    p_group_id: filters.group || null,
  }
}

export async function loadInstitutionalOptions(): Promise<InstitutionalFilterOption[]> {
  const { data, error } = await supabase.rpc('institutional_filter_options')
  return assertRows(data, error).map((row) => ({
    scope: row.scope as FilterScope,
    id: row.id as string,
    label: row.label as string,
    parentId: row.parent_id as string | null,
    periodId: row.period_id as string | null,
  }))
}

export async function loadParticipation(filters: InstitutionalFilters = {}): Promise<ParticipationRow[]> {
  const { data, error } = await supabase.rpc('institution_participation', args(filters))
  return assertRows(data, error).map((row) => ({
    scope: row.scope as ParticipationScope, id: row.scope_id as string | null,
    label: row.label as string, expected: Number(row.expected),
    completed: Number(row.completed), pending: Number(row.pending),
    participation: Number(row.participation), students: Number(row.students),
  }))
}

export async function loadRanking(filters: InstitutionalFilters = {}): Promise<TeacherRankingRow[]> {
  const { data, error } = await supabase.rpc('institution_teacher_ranking', args(filters))
  return assertRows(data, error).map((row) => ({
    id: row.teacher_id as string, name: row.teacher_name as string,
    averageScore: Number(row.average_score), responseCount: Number(row.response_count),
    assignmentCount: Number(row.assignment_count),
  }))
}

export async function loadScoreSummary(filters: InstitutionalFilters = {}): Promise<ScoreSummary> {
  const { data, error } = await supabase.rpc('institution_score_summary', args(filters))
  const row = assertRows(data, error)[0]
  if (!row) throw new Error('institutional_score_missing')
  return {
    averageScore: row.average_score === null ? null : Number(row.average_score),
    responseCount: Number(row.response_count), teacherCount: Number(row.teacher_count),
  }
}

export async function loadHrMetrics(periodId: string | null, campusId: string | null = null): Promise<HrTeacherRow[]> {
  const { data, error } = await supabase.rpc('hr_teacher_metrics', { p_period_id: periodId, p_campus_id: campusId })
  return assertRows(data, error).map((row) => ({
    id: row.teacher_id as string, name: row.teacher_name as string,
    averageScore: Number(row.average_score), responseCount: Number(row.response_count),
    assignmentCount: 0, subjectCount: Number(row.subject_count),
    category: row.category as HrCategory, recommendation: row.recommendation as string,
    maximumSubjects: Number(row.maximum_subjects),
  }))
}

export async function loadInstitutionOverview(): Promise<InstitutionOverview> {
  const { data, error } = await supabase.rpc('institution_overview')
  const row = assertRows(data, error)[0]
  if (!row) throw new Error('institution_overview_missing')
  return {
    id: row.institution_id as string, name: row.institution_name as string,
    shortName: row.short_name as string, campusCount: Number(row.campus_count),
    programCount: Number(row.program_count), subjectCount: Number(row.subject_count),
    groupCount: Number(row.group_count), periodCount: Number(row.period_count),
    teacherCount: Number(row.teacher_count), studentCount: Number(row.student_count),
    expected: Number(row.expected), completed: Number(row.completed),
    pending: Number(row.pending), participation: Number(row.participation),
    averageScore: row.average_score === null ? null : Number(row.average_score),
  }
}

export async function loadAdminSummary(): Promise<AdminSummary> {
  const { data, error } = await supabase.rpc('admin_institution_summary')
  const row = assertRows(data, error)[0]
  if (!row) throw new Error('admin_summary_missing')
  return {
    userCount: Number(row.user_count), pendingCount: Number(row.pending_count),
    activeCount: Number(row.active_count), inactiveCount: Number(row.inactive_count),
    studentCount: Number(row.student_count), teacherCount: Number(row.teacher_count),
    coordinatorCount: Number(row.coordinator_count), hrCount: Number(row.hr_count),
    adminCount: Number(row.admin_count), campusCount: Number(row.campus_count),
    programCount: Number(row.program_count), subjectCount: Number(row.subject_count),
    groupCount: Number(row.group_count), periodCount: Number(row.period_count),
  }
}

export async function loadAdminUsers(search: string | null = null): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_institution_users', { p_search: search })
  return assertRows(data, error).map((row) => ({
    id: row.profile_id as string, name: row.full_name as string,
    email: row.institutional_email as string,
    status: row.status as AdminUserRow['status'], roles: row.role_codes as string[],
  }))
}
