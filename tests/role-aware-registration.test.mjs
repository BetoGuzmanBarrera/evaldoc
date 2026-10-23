import assert from 'node:assert/strict'
import { test } from 'node:test'
import { homeForIdentity } from '../src/auth/types.ts'
import { pendingRequestMessage } from '../src/lib/pendingRequestMessage.ts'
import {
  availablePrograms, registrationCatalogEmptyMessage,
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
const valid = (role, institution, campus, program, catalog = programs) =>
  validAcademicSelection(role, institution, campus, program, campuses, catalog)

test('estudiante solicita campus y carrera propios sin escoger materias', () => {
  assert.deepEqual(availablePrograms(programs, 'ipn-norte').map((item) => item.id), ['program-a'])
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-a'), true)
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-b'), false)
  assert.equal(valid('student', 'ipn', 'ipn-norte', 'program-c'), false)
  assert.equal(valid('student', 'ipn', 'ipn-sur', 'program-a'), false)
  assert.equal(valid('student', 'ipn', 'ipn-sur', 'program-b'), true)
  assert.equal(validAcademicSelection('student', 'ipn', '', '', [], []), false)
})

test('docente solo necesita campus de su institución y no depende de materias', () => {
  assert.equal(valid('teacher', 'ipn', 'ipn-norte', '', []), true)
  assert.equal(valid('teacher', 'ipn', 'ipn-sur', '', []), true)
  assert.equal(valid('teacher', 'ipn', 'unam', '', []), false)
  assert.equal(valid('teacher', 'ipn', 'ipn-norte', 'program-a', []), false)
})

test('estados vacíos bloquean solo campus o carrera obligatorios', () => {
  assert.equal(registrationCatalogEmptyMessage('student', [], [], ''), 'Esta institución aún no tiene campus configurados.')
  assert.equal(registrationCatalogEmptyMessage('student', campuses, [], 'ipn-norte'), 'Este campus aún no tiene carreras configuradas.')
  assert.equal(registrationCatalogEmptyMessage('student', campuses, programs, 'ipn-norte'), null)
  assert.equal(registrationCatalogEmptyMessage('teacher', campuses, [], 'ipn-norte'), null)
})

test('metadata de alta no incluye materias ni concede roles', () => {
  assert.equal(registrationLabels('student').identifier, 'Número de cuenta')
  assert.match(registrationLabels('teacher').note, /Coordinación/)
  const student = registrationMetadata('student', 'ipn', 'Ana', '123', 'ipn-norte', 'program-a')
  assert.equal(student.requested_campus_id, 'ipn-norte')
  assert.equal(student.requested_program_id, 'program-a')
  assert.equal('requested_subject_ids' in student, false)
  assert.equal('role' in student, false)
  const teacher = registrationMetadata('teacher', 'ipn', 'Laura', 'EMP-1', 'ipn-norte', '')
  assert.equal(teacher.requested_campus_id, 'ipn-norte')
  assert.equal('requested_program_id' in teacher, false)
  assert.equal('requested_subject_ids' in teacher, false)
})

test('coordinador continúa solicitando solo institución', () => {
  assert.equal(registrationLabels('coordinator').note,
    'Tu institución deberá validar tu solicitud de coordinación.')
  assert.equal(valid('coordinator', 'ipn', '', ''), true)
  assert.equal(valid('coordinator', 'ipn', 'ipn-norte', ''), false)
  const metadata = registrationMetadata('coordinator', 'ipn', 'Rosa', 'EMP-2', '', '')
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
