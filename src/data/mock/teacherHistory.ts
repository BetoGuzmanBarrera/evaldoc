import type { TeacherHistoryData } from '../../types'

export const teacherHistory: TeacherHistoryData = {
  period: 'Enero–Junio 2025',
  currentAverage: 9.2,
  variation: 0.4,
  bestDimension: { label: 'Respeto', score: 9.8 },
  opportunity: { label: 'Retroalimentación', score: 7.6 },
  dimensions: [
    { id: 'dominio', label: 'Dominio' },
    { id: 'claridad', label: 'Claridad' },
    { id: 'puntualidad', label: 'Puntualidad' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'tecnologia', label: 'Tecnología' },
    { id: 'respeto', label: 'Respeto' },
  ],
  periods: [
    {
      id: 'EJ24', label: 'Enero–Junio 2024', averageScore: 8.2,
      scores: { dominio: 8.8, claridad: 7.8, puntualidad: 8.9, feedback: 7.0, tecnologia: 7.5, respeto: 9.1 },
    },
    {
      id: 'AD24', label: 'Agosto–Diciembre 2024', averageScore: 8.8,
      scores: { dominio: 9.1, claridad: 8.3, puntualidad: 9.3, feedback: 7.3, tecnologia: 8.0, respeto: 9.5 },
    },
    {
      id: 'EJ25', label: 'Enero–Junio 2025', averageScore: 9.2,
      scores: { dominio: 9.6, claridad: 9.2, puntualidad: 9.6, feedback: 7.6, tecnologia: 8.4, respeto: 9.8 },
    },
  ],
  trendMessage: 'Tendencia positiva sostenida: +1.0 puntos acumulados durante los últimos tres periodos.',
}
