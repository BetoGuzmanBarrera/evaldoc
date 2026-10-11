import { supabase } from './supabase'
import { AcademicActionError, classifyAcademicErrorCode, hasIncompleteAcademicSelection } from './academicActionErrors'

export interface AcademicCampus { id: string; name: string; active: boolean }
export interface AcademicProgram { id: string; campus_id: string; name: string; active: boolean }
export interface AcademicSubject { id: string; program_id: string; name: string; code: string; active: boolean }
export interface AcademicPeriod { id: string; name: string; starts_at: string; ends_at: string; active: boolean }
export interface AcademicGroup { id: string; subject_id: string; period_id: string; code: string; active: boolean }
export interface AcademicPerson { id: string; name: string }
export interface AcademicAssignment { id: string; group_id: string; teacher_id: string }
export interface AcademicEnrollment { id: string; group_id: string; student_id: string }

export interface AcademicSnapshot {
  campuses: AcademicCampus[]
  programs: AcademicProgram[]
  subjects: AcademicSubject[]
  periods: AcademicPeriod[]
  groups: AcademicGroup[]
  teachers: AcademicPerson[]
  students: AcademicPerson[]
  assignments: AcademicAssignment[]
  enrollments: AcademicEnrollment[]
}

export async function loadAcademicSnapshot(): Promise<AcademicSnapshot> {
  const { data, error } = await supabase.rpc('coordinator_academic_snapshot')
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('academic_snapshot_unavailable')
  }
  return data as AcademicSnapshot
}

export type AcademicAction =
  | { kind: 'period'; name: string; startsAt: string; endsAt: string }
  | { kind: 'subject-create'; programId: string; name: string; code: string }
  | { kind: 'subject-update'; subjectId: string; name: string; code: string; active: boolean }
  | { kind: 'group-create'; subjectId: string; periodId: string; code: string }
  | { kind: 'group-active'; groupId: string; active: boolean }
  | { kind: 'assign'; groupId: string; teacherId: string }
  | { kind: 'enroll'; groupId: string; studentId: string }

export async function performAcademicAction(action: AcademicAction): Promise<void> {
  if (hasIncompleteAcademicSelection(Object.values(action))) {
    throw new AcademicActionError('incomplete')
  }
  const request = (() => {
    switch (action.kind) {
      case 'period':
        return supabase.rpc('coordinator_create_period', {
          p_name: action.name, p_starts_at: action.startsAt, p_ends_at: action.endsAt,
        })
      case 'subject-create':
        return supabase.rpc('coordinator_create_subject', {
          p_program_id: action.programId, p_name: action.name, p_code: action.code,
        })
      case 'subject-update':
        return supabase.rpc('coordinator_update_subject', {
          p_subject_id: action.subjectId, p_name: action.name,
          p_code: action.code, p_active: action.active,
        })
      case 'group-create':
        return supabase.rpc('coordinator_create_group', {
          p_subject_id: action.subjectId, p_period_id: action.periodId, p_code: action.code,
        })
      case 'group-active':
        return supabase.rpc('coordinator_set_group_active', {
          p_group_id: action.groupId, p_active: action.active,
        })
      case 'assign':
        return supabase.rpc('coordinator_assign_teacher', {
          p_group_id: action.groupId, p_teacher_id: action.teacherId,
        })
      case 'enroll':
        return supabase.rpc('coordinator_enroll_student', {
          p_group_id: action.groupId, p_student_id: action.studentId,
        })
    }
  })()
  const { error } = await request
  if (error) throw new AcademicActionError(classifyAcademicErrorCode(error.code))
}
