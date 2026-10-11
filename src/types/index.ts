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

export interface DashboardFilterOption { value: string; label: string }
export interface DashboardFilter { id: string; label: string; options: DashboardFilterOption[] }

export interface CoordinatorDashboardData {
  period: string
  participation: number
  evaluations: number
  activeStudents: number
  evaluatedTeachers: number
  averageScore: number
  filters: DashboardFilter[]
  institutions: { id: string; label: string; participation: number }[]
  topTeachers: { id: string; rank: number; name: string; institution: string; score: number; responses: number }[]
}

export type TeacherCategory = 'Excelente' | 'Bueno' | 'Suficiente' | 'No suficiente'
export interface HrDashboardData {
  period: string
  evaluatedTeachers: number
  institutionalAverage: number
  improvingTeachers: number
  outstandingTeachers: number
  filters: DashboardFilter[]
  categories: { label: TeacherCategory; count: number; tone: 'green' | 'blue' | 'yellow' | 'red' }[]
  teachers: { id: string; name: string; institution: string; score: number; category: TeacherCategory; trend: string; subjects: number }[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  institution: string
  role: 'Alumno' | 'Docente' | 'Coordinación' | 'Administrador'
  status: 'Activo' | 'Inactivo'
  lastAccess: string
}
export interface AdminDashboardData {
  period: string
  users: number
  institutions: number
  teachers: number
  students: number
  sampleUsers: AdminUser[]
}

export interface InstitutionOverview {
  id: string
  name: string
  shortName: string
  campuses: number
  participation: number
  teachers: number
  students: number
  evaluations: number
  averageScore: number
}
export interface InstitutionsDashboardData {
  period: string
  students: number
  teachers: number
  evaluations: number
  averageParticipation: number
  institutions: InstitutionOverview[]
}
