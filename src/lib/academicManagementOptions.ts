import type { AcademicSnapshot } from './academicManagement'

export function programsForCampus(snapshot: AcademicSnapshot, campusId: string) {
  return snapshot.programs.filter((program) => program.campus_id === campusId && program.active)
}
export function subjectsForProgram(snapshot: AcademicSnapshot, programId: string) {
  return snapshot.subjects.filter((subject) => subject.program_id === programId && subject.active)
}
export function groupsForSubject(snapshot: AcademicSnapshot, subjectId: string) {
  return snapshot.groups.filter((group) => group.subject_id === subjectId && group.active)
}
