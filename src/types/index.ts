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

export interface DimensionScore {
  id: string
  label: string
  score: number
  opportunity?: boolean
}

export interface TrendPoint {
  period: string
  score: number
}

export interface TeacherDashboardData {
  teacherId: string
  name: string
  period: string
  averageScore: number
  averageChange: number
  responseCount: number
  newResponses: number
  participation: number
  subjectsEvaluated: number
  favorableResponses: number
  trend: TrendPoint[]
  dimensions: DimensionScore[]
}

export interface TeacherResultData {
  id: string
  subject: string
  group: string
  period: string
  averageScore: number
  responseCount: number
  insightTitle: string
  insightText: string
  dimensions: DimensionScore[]
}

export type HistoryDimension = 'dominio' | 'claridad' | 'puntualidad' | 'feedback' | 'tecnologia' | 'respeto'

export interface TeacherHistoryPeriod {
  id: string
  label: string
  averageScore: number
  scores: Record<HistoryDimension, number>
}

export interface TeacherHistoryData {
  period: string
  currentAverage: number
  variation: number
  bestDimension: { label: string; score: number }
  opportunity: { label: string; score: number }
  dimensions: { id: HistoryDimension; label: string }[]
  periods: TeacherHistoryPeriod[]
  trendMessage: string
}
