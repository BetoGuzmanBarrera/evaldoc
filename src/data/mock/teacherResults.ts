import type { TeacherResultData } from '../../types'

export const teacherResults: TeacherResultData[] = [
  {
    id: '1',
    subject: 'Matemáticas Aplicadas',
    group: '4BV1',
    period: 'Enero–Junio 2025',
    averageScore: 9.4,
    responseCount: 32,
    insightTitle: 'Claridad y dominio destacan este periodo',
    insightText: 'La valoración en claridad aumentó 0.6 puntos. Retroalimentación continúa como principal área de oportunidad.',
    dimensions: [
      { id: 'dominio', label: 'Dominio de la materia', score: 9.6 },
      { id: 'planeacion', label: 'Planeación de clases', score: 8.8 },
      { id: 'claridad', label: 'Claridad en las explicaciones', score: 9.2 },
      { id: 'participacion', label: 'Fomento de la participación', score: 8.2 },
      { id: 'retroalimentacion', label: 'Retroalimentación', score: 7.6, opportunity: true },
      { id: 'tecnologia', label: 'Uso de tecnología', score: 8.4 },
      { id: 'respeto', label: 'Trato respetuoso', score: 9.8 },
    ],
  },
]
