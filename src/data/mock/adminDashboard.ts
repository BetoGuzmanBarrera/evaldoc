import type { AdminDashboardData } from '../../types'

export const adminDashboard: AdminDashboardData = {
  period: 'Enero–Junio 2025',
  users: 8432,
  institutions: 7,
  teachers: 486,
  students: 7621,
  sampleUsers: [
    { id: 'alberto', name: 'Alberto Guzman', email: 'alberto@ipn.mx', institution: 'IPN', role: 'Alumno', status: 'Activo', lastAccess: 'Hoy, 09:42' },
    { id: 'carlos', name: 'Carlos Méndez', email: 'cmendez@ipn.mx', institution: 'IPN', role: 'Docente', status: 'Activo', lastAccess: 'Ayer, 18:20' },
    { id: 'laura', name: 'Laura Sánchez', email: 'laura@uvm.mx', institution: 'UVM', role: 'Docente', status: 'Activo', lastAccess: '24 jun' },
    { id: 'mariana', name: 'Mariana Ortiz', email: 'mortiz@unam.mx', institution: 'UNAM', role: 'Coordinación', status: 'Activo', lastAccess: '23 jun' },
    { id: 'eduardo', name: 'Eduardo Peña', email: 'epena@tec.mx', institution: 'Tec', role: 'Administrador', status: 'Inactivo', lastAccess: '12 jun' },
  ],
}
