import type { HrDashboardData } from '../../types'

export const hrDashboard: HrDashboardData = {
  period: 'Enero–Junio 2025',
  evaluatedTeachers: 128,
  institutionalAverage: 8.6,
  improvingTeachers: 74,
  outstandingTeachers: 21,
  filters: [
    { id: 'institution', label: 'Institución', options: [
      { value: 'ipn', label: 'IPN' }, { value: 'unam', label: 'UNAM' },
      { value: 'uvm', label: 'UVM' }, { value: 'tec', label: 'Tec' },
    ] },
    { id: 'campus', label: 'Campus', options: [{ value: 'all', label: 'Todos los campus' }] },
    { id: 'category', label: 'Categoría', options: [
      { value: 'Excelente', label: 'Excelente' }, { value: 'Bueno', label: 'Bueno' },
      { value: 'Suficiente', label: 'Suficiente' }, { value: 'No suficiente', label: 'No suficiente' },
    ] },
    { id: 'period', label: 'Periodo', options: [{ value: '2025-1', label: 'Ene–Jun 2025' }] },
  ],
  categories: [
    { label: 'Excelente', count: 21, tone: 'green' },
    { label: 'Bueno', count: 64, tone: 'blue' },
    { label: 'Suficiente', count: 35, tone: 'yellow' },
    { label: 'No suficiente', count: 8, tone: 'red' },
  ],
  teachers: [
    { id: 'ana', name: 'Dra. Ana Valdés', institution: 'UNAM', score: 9.8, category: 'Excelente', trend: '↑ 0.4', subjects: 4 },
    { id: 'carlos', name: 'Dr. Carlos Méndez', institution: 'IPN', score: 9.6, category: 'Excelente', trend: '↑ 0.2', subjects: 5 },
    { id: 'laura', name: 'Mtra. Laura Sánchez', institution: 'UVM', score: 9.0, category: 'Bueno', trend: '→ estable', subjects: 3 },
    { id: 'ricardo', name: 'Ing. Ricardo Torres', institution: 'Tec', score: 7.8, category: 'Suficiente', trend: '↓ 0.2', subjects: 4 },
  ],
}
