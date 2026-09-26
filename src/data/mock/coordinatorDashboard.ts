import type { CoordinatorDashboardData } from '../../types'

export const coordinatorDashboard: CoordinatorDashboardData = {
  period: 'Enero–Junio 2025',
  participation: 68,
  evaluations: 1245,
  activeStudents: 320,
  evaluatedTeachers: 128,
  averageScore: 8.6,
  filters: [
    { id: 'institution', label: 'Institución', options: [
      { value: 'ipn', label: 'IPN' }, { value: 'unam', label: 'UNAM' }, { value: 'uvm', label: 'UVM' },
      { value: 'tec', label: 'Tec' }, { value: 'uam', label: 'UAM' }, { value: 'ibero', label: 'Ibero' },
      { value: 'anahuac', label: 'Anáhuac' },
    ] },
    { id: 'campus', label: 'Campus', options: [{ value: 'all', label: 'Todos los campus' }] },
    { id: 'career', label: 'Carrera', options: [{ value: 'all', label: 'Todas las carreras' }] },
    { id: 'group', label: 'Grupo', options: [{ value: 'all', label: 'Todos los grupos' }] },
    { id: 'period', label: 'Periodo académico', options: [{ value: '2025-1', label: 'Ene–Jun 2025' }] },
  ],
  institutions: [
    { id: 'ipn', label: 'IPN', participation: 78 },
    { id: 'unam', label: 'UNAM', participation: 67 },
    { id: 'uvm', label: 'UVM', participation: 56 },
    { id: 'tec', label: 'Tec', participation: 74 },
    { id: 'uam', label: 'UAM', participation: 62 },
    { id: 'ibero', label: 'Ibero', participation: 69 },
    { id: 'anahuac', label: 'Anáhuac', participation: 50 },
  ],
  topTeachers: [
    { id: 'ana', rank: 1, name: 'Dra. Ana Valdés', institution: 'UNAM', score: 9.8, responses: 106 },
    { id: 'carlos', rank: 2, name: 'Dr. Carlos Méndez', institution: 'IPN', score: 9.6, responses: 89 },
    { id: 'laura', rank: 3, name: 'Mtra. Laura Sánchez', institution: 'UVM', score: 9.4, responses: 76 },
  ],
}
