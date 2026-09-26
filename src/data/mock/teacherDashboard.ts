import type { TeacherDashboardData } from '../../types'

export const teacherDashboard: TeacherDashboardData = {
  teacherId: 'carlos',
  name: 'Dr. Carlos Méndez López',
  period: 'Enero–Junio 2025',
  averageScore: 9.2,
  averageChange: 0.4,
  responseCount: 89,
  newResponses: 14,
  participation: 92,
  subjectsEvaluated: 5,
  favorableResponses: 76,
  trend: [
    { period: 'EJ23', score: 7.6 },
    { period: 'AD23', score: 8.0 },
    { period: 'EJ24', score: 8.2 },
    { period: 'AD24', score: 8.8 },
    { period: 'EJ25', score: 9.2 },
  ],
  dimensions: [
    { id: 'dominio', label: 'Dominio', score: 9.2 },
    { id: 'claridad', label: 'Claridad', score: 8.6 },
    { id: 'puntualidad', label: 'Puntualidad', score: 9.6 },
    { id: 'retroalimentacion', label: 'Retroalimentación', score: 8.0, opportunity: true },
    { id: 'tecnologia', label: 'Tecnología', score: 8.4 },
  ],
}
