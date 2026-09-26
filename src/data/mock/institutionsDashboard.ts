import type { InstitutionsDashboardData } from '../../types'

export const institutionsDashboard: InstitutionsDashboardData = {
  period: 'Enero–Junio 2025',
  students: 110700,
  teachers: 7580,
  evaluations: 78800,
  averageParticipation: 79,
  institutions: [
    { id: 'ipn', name: 'IPN', shortName: 'IPN', campuses: 8, participation: 78, teachers: 1240, students: 18400, evaluations: 12800, averageScore: 8.8 },
    { id: 'unam', name: 'UNAM', shortName: 'UNAM', campuses: 12, participation: 82, teachers: 1860, students: 25100, evaluations: 18200, averageScore: 9.0 },
    { id: 'uvm', name: 'UVM', shortName: 'UVM', campuses: 6, participation: 69, teachers: 920, students: 14200, evaluations: 9800, averageScore: 8.4 },
    { id: 'tec', name: 'Tecnológico de Monterrey', shortName: 'Tec de Monterrey', campuses: 9, participation: 88, teachers: 1430, students: 21700, evaluations: 16600, averageScore: 9.2 },
    { id: 'uam', name: 'UAM', shortName: 'UAM', campuses: 5, participation: 73, teachers: 840, students: 12900, evaluations: 8400, averageScore: 8.6 },
    { id: 'ibero', name: 'Ibero', shortName: 'Ibero', campuses: 4, participation: 80, teachers: 680, students: 9600, evaluations: 7000, averageScore: 8.9 },
    { id: 'anahuac', name: 'Anáhuac', shortName: 'Anáhuac', campuses: 4, participation: 83, teachers: 610, students: 8800, evaluations: 6000, averageScore: 8.7 },
  ],
}
