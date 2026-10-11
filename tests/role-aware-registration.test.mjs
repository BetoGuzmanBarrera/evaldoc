import assert from 'node:assert/strict'
import { test } from 'node:test'
import { homeForIdentity } from '../src/auth/types.ts'
import { pendingRequestMessage } from '../src/lib/pendingRequestMessage.ts'
import {
  availablePrograms, availableSubjects, registrationCatalogEmptyMessage,
  registrationLabels, registrationMetadata, validAcademicSelection,
} from '../src/lib/registrationForm.ts'

const campuses = [
  { id: 'ipn-norte', institution_id: 'ipn', name: 'Norte' },
  { id: 'ipn-sur', institution_id: 'ipn', name: 'Sur' },
  { id: 'unam', institution_id: 'unam', name: 'UNAM' },
]
const programs = [
  { id: 'program-a', institution_id: 'ipn', campus_id: 'ipn-norte', name: 'Programa A', code: 'A' },
  { id: 'program-b', institution_id: 'ipn', campus_id: 'ipn-sur', name: 'Programa B', code: 'B' },
  { id: 'program-c', institution_id: 'unam', campus_id: 'unam', name: 'Programa C', code: 'C' },
]
const subjects = [
  { id: 'subject-a1', institution_id: 'ipn', program_id: 'program-a', name: 'Materia A1', code: 'A1' },
  { id: 'subject-a2', institution_id: 'ipn', program_id: 'program-a', name: 'Materia A2', code: 'A2' },
  { id: 'subject-b', institution_id: 'ipn', program_id: 'program-b', name: 'Materia B', code: 'B' },
  { id: 'subject-c', institution_id: 'unam', program_id: 'program-c', name: 'Materia C', code: 'C' },
]
const valid = (role, institution, campus, program, ids) =>
  validAcademicSelection(role, institution, campus, program, ids, campuses, programs, subjects)

test('institución → campus → carrera → materia nunca cruza campus ni institución', () => {
  assert.deepEqual(availablePrograms(programs, 'ipn-norte').map((item) => item.id), ['program-a'])
  assert.deepEqual(availableSubjects(subjects, programs, 'student', 'ipn-norte', 'program-a')
    .map((item) => item.id), ['subject-a1', 'subject-a2'])
  assert.deepEqual(availableSubjects(subjects, programs, 'teacher', 'ipn-norte', '')
    .map((item) => item.id), ['subject-a1', 'subject-a2'])
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-a', ['subject-a1']), true)
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-b', ['subject-b']), false)
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-a', ['subject-b']), false)
  assert.equal(valid('teacher', 'ipn', 'ipn-norte', '', ['subject-b']), false)
  assert.equal(valid('teacher', 'ipn', 'ipn-norte', '', ['subject-c']), false)
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-a', ['subject-a1', 'subject-a1']), false)
})

test('cambio de campus y carrera limpia selecciones incompatibles', () => {
  assert.equal(valid('student', 'ipn', 'ipn-sur', 'program-a', ['subject-a1']), false)
  assert.equal(valid('student', 'ipn', 'ipn-sur', 'program-b', ['subject-a1']), false)
  assert.equal(valid('student', 'ipn', 'ipn-sur', 'program-b', ['subject-b']), true)
})

test('estados vacíos respetan el nivel del catálogo', () => {
  assert.equal(registrationCatalogEmptyMessage('student', [], [], [], '', ''),
    'Esta institución aún no tiene campus configurados.')
  assert.equal(registrationCatalogEmptyMessage('student', campuses, [], [], 'ipn-norte', ''),
    'Este campus aún no tiene carreras configuradas.')
  assert.equal(registrationCatalogEmptyMessage('student', campuses, programs, [], 'ipn-norte', 'program-a'),
    'Esta carrera aún no tiene materias configuradas.')
  assert.equal(registrationCatalogEmptyMessage('teacher', campuses, programs, [], 'ipn-norte', ''),
    'Este campus aún no tiene materias configuradas.')
  assert.equal(validAcademicSelection('student', 'ipn', '', '', [], [], [], []), false)
})

test('estudiante y docente envían campus y solo datos de solicitud', () => {
  assert.equal(registrationLabels('student').identifier, 'Número de cuenta')
  assert.equal(registrationLabels('teacher').subjects, 'Materias que impartes')
  const student = registrationMetadata('student', 'ipn', 'Ana', '123',
    'ipn-norte', 'program-a', ['subject-a1'])
  assert.equal(student.requested_campus_id, 'ipn-norte')
  assert.equal(student.requested_program_id, 'program-a')
  assert.deepEqual(student.requested_subject_ids, ['subject-a1'])
  assert.equal('role' in student, false)
  const teacher = registrationMetadata('teacher', 'ipn', 'Laura', 'EMP-1',
    'ipn-norte', '', ['subject-a1'])
  assert.equal(teacher.requested_campus_id, 'ipn-norte')
  assert.equal('requested_program_id' in teacher, false)
})

test('coordinador continúa solicitando solo institución', () => {
  assert.equal(registrationLabels('coordinator').note,
    'Tu institución deberá validar tu solicitud de coordinación.')
  assert.equal(valid('coordinator', 'ipn', '', '', []), true)
  assert.equal(valid('coordinator', 'ipn', 'ipn-norte', '', []), false)
  assert.deepEqual(availableSubjects(subjects, programs, 'coordinator', '', ''), [])
  const metadata = registrationMetadata('coordinator', 'ipn', 'Rosa', 'EMP-2', '', '', [])
  assert.equal('requested_campus_id' in metadata, false)
  assert.equal('requested_program_id' in metadata, false)
  assert.equal('requested_subject_ids' in metadata, false)
  assert.match(pendingRequestMessage('coordinator', false, 'IPN').heading, /coordinación/)
})

test('pending y rutas existentes conservan comportamiento', () => {
  assert.equal(homeForIdentity({ status: 'pending' }, []), '/pending')
  assert.equal(homeForIdentity({ status: 'active' }, ['student']), '/student')
  assert.equal(homeForIdentity({ status: 'active' }, ['teacher']), '/teacher')
  assert.match(pendingRequestMessage('student', false, 'IPN').description, /estudiante/)
  assert.match(pendingRequestMessage('teacher', true, 'Anáhuac').heading, /rechazada/)
})
