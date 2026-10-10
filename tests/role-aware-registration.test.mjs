import assert from 'node:assert/strict'
import { test } from 'node:test'
import { homeForIdentity } from '../src/auth/types.ts'
import { pendingRequestMessage } from '../src/lib/pendingRequestMessage.ts'
import { availableSubjects, registrationCatalogEmptyMessage, registrationLabels, registrationMetadata, validAcademicSelection } from '../src/lib/registrationForm.ts'

const programs = [
  { id: 'program-a', institution_id: 'ipn', name: 'Programa A', code: 'A' },
  { id: 'program-b', institution_id: 'unam', name: 'Programa B', code: 'B' },
]
const subjects = [
  { id: 'subject-a1', institution_id: 'ipn', program_id: 'program-a', name: 'Materia A1', code: 'A1' },
  { id: 'subject-a2', institution_id: 'ipn', program_id: 'program-a', name: 'Materia A2', code: 'A2' },
  { id: 'subject-b', institution_id: 'unam', program_id: 'program-b', name: 'Materia B', code: 'B' },
]

test('selector cambia las etiquetas y datos de estudiante y docente', () => {
  assert.equal(registrationLabels('student').identifier, 'Número de cuenta')
  assert.equal(registrationLabels('teacher').identifier, 'Número de empleado')
  assert.equal(registrationLabels('teacher').subjects, 'Materias que impartes')
  assert.equal(availableSubjects(subjects, 'student', 'program-a').length, 2)
  assert.equal(availableSubjects(subjects, 'teacher', '').length, 3)
})

test('metadata guarda solo una solicitud y soporta varias materias', () => {
  const student = registrationMetadata('student', 'ipn', 'Ana', '123', 'program-a', ['subject-a1', 'subject-a2'])
  assert.equal(student.requested_role, 'student')
  assert.equal(student.requested_program_id, 'program-a')
  assert.deepEqual(student.requested_subject_ids, ['subject-a1', 'subject-a2'])
  assert.equal('role' in student, false)
  const teacher = registrationMetadata('teacher', 'ipn', 'Laura', 'EMP-1', '', ['subject-a1'])
  assert.equal(teacher.requested_role, 'teacher')
  assert.equal('requested_program_id' in teacher, false)
  assert.equal('role' in teacher, false)
})

test('selección estudiantil valida programa, materias, institución y duplicados', () => {
  assert.equal(validAcademicSelection('student', 'ipn', 'program-a', ['subject-a1', 'subject-a2'], programs, subjects), true)
  assert.equal(validAcademicSelection('student', 'ipn', 'program-b', ['subject-a1'], programs, subjects), false)
  assert.equal(validAcademicSelection('student', 'ipn', 'program-a', ['subject-b'], programs, subjects), false)
  assert.equal(validAcademicSelection('student', 'ipn', 'program-a', [], programs, subjects), false)
  assert.equal(validAcademicSelection('student', 'ipn', 'program-a', ['subject-a1', 'subject-a1'], programs, subjects), false)
})

test('docente puede solicitar varias materias de su institución, no de otra', () => {
  assert.equal(validAcademicSelection('teacher', 'ipn', '', ['subject-a1', 'subject-a2'], programs, subjects), true)
  assert.equal(validAcademicSelection('teacher', 'ipn', '', ['subject-b'], programs, subjects), false)
})

test('pending sin rol navega a su estado; cuentas antiguas activas mantienen sus rutas', () => {
  const profile = { status: 'pending' }
  assert.equal(homeForIdentity(profile, []), '/pending')
  assert.equal(homeForIdentity({ status: 'active' }, ['student']), '/student')
  assert.equal(homeForIdentity({ status: 'active' }, ['teacher']), '/teacher')
})
test('pending muestra el tipo solicitado y rechazo sin activar acceso', () => {
  assert.match(pendingRequestMessage('student', false, 'IPN').description, /estudiante/)
  assert.match(pendingRequestMessage('teacher', false, 'Universidad Anáhuac').description, /docente.*Universidad Anáhuac/)
  assert.match(pendingRequestMessage('teacher', true, 'Universidad Anáhuac').heading, /rechazada/)
})

test('institución sin catálogo conserva estado vacío y bloquea solicitudes académicas', () => {
  assert.equal(registrationCatalogEmptyMessage('student', [], []), 'Esta institución aún no tiene oferta académica configurada.')
  assert.equal(registrationCatalogEmptyMessage('teacher', [], []), 'Esta institución aún no tiene materias configuradas.')
  assert.equal(validAcademicSelection('student', 'ipn', '', [], [], []), false)
  assert.equal(validAcademicSelection('teacher', 'ipn', '', [], [], []), false)
})

test('coordinador solicita sin programa ni materias y nunca recibe rol por metadata', () => {
  assert.equal(registrationLabels('coordinator').identifier, 'Número de empleado')
  assert.equal(registrationLabels('coordinator').note, 'Tu institución deberá validar tu solicitud de coordinación.')
  assert.deepEqual(availableSubjects(subjects, 'coordinator', ''), [])
  assert.equal(validAcademicSelection('coordinator', 'ipn', '', [], [], []), true)
  assert.equal(validAcademicSelection('coordinator', 'ipn', 'program-a', [], programs, subjects), false)
  assert.equal(validAcademicSelection('coordinator', 'ipn', '', ['subject-a1'], programs, subjects), false)
  assert.equal(validAcademicSelection('coordinator', '', '', [], [], []), false)
  const metadata = registrationMetadata('coordinator', 'ipn', 'Rosa', 'EMP-2', '', [])
  assert.equal(metadata.requested_role, 'coordinator')
  assert.equal('requested_program_id' in metadata, false)
  assert.equal('requested_subject_ids' in metadata, false)
  assert.equal('role' in metadata, false)
  assert.match(pendingRequestMessage('coordinator', false, 'IPN').heading, /coordinación/)
  assert.equal(homeForIdentity({ status: 'pending' }, []), '/pending')
})
