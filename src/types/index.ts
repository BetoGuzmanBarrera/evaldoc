export interface Institution { id: string; name: string; shortName: string }
export interface Teacher { id: string; name: string; shortName: string }
export interface Subject { id: string; name: string; teacherId: string; group: string }
export type EvaluationStatus = 'pending' | 'completed'
export interface Evaluation { id: string; subjectId: string; status: EvaluationStatus; dueDate: string }
export type Rating = 0 | 2.5 | 5 | 7.5 | 10
export interface SurveyQuestionData { id: string; dimension: string; text: string }
export interface StudentDashboardData {
  name: string; institutionId: string; program: string; period: string
  total: number; completed: number; pending: number; progress: number; deadline: string
}
