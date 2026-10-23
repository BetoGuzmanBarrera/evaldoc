import { supabase } from './supabase'

interface EnrollmentRow {
  enrollment_id: string
  subject_name: string
  subject_code: string
  group_code: string
  period_name: string
  program_name: string | null
}

export interface StudentEnrollment {
  id: string
  subjectName: string
  subjectCode: string
  groupCode: string
  periodName: string
  programName: string | null
}

export async function loadStudentEnrollments(): Promise<StudentEnrollment[]> {
  const { data, error } = await supabase.rpc('my_student_enrollments')
  if (error || !Array.isArray(data)) throw new Error('student_enrollments_load_failed')
  return (data as EnrollmentRow[]).map((row) => ({
    id: row.enrollment_id,
    subjectName: row.subject_name,
    subjectCode: row.subject_code,
    groupCode: row.group_code,
    periodName: row.period_name,
    programName: row.program_name,
  }))
}
