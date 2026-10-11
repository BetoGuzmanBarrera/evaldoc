import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AcademicActionError, academicActionErrorMessage,
  classifyAcademicErrorCode, hasIncompleteAcademicSelection,
} from '../src/lib/academicActionErrors.ts'

test('errores académicos se clasifican sin revelar mensajes internos', () => {
  assert.equal(classifyAcademicErrorCode('23505'), 'duplicate')
  assert.equal(classifyAcademicErrorCode('23502'), 'incomplete')
  assert.equal(classifyAcademicErrorCode('42501'), 'permission')
  assert.equal(classifyAcademicErrorCode('23514'), 'incompatible')
  assert.equal(classifyAcademicErrorCode('23503'), 'incompatible')
  assert.equal(classifyAcademicErrorCode('22023'), 'incompatible')
  assert.equal(classifyAcademicErrorCode('unexpected'), 'unavailable')
  assert.match(academicActionErrorMessage(new AcademicActionError('duplicate')), /Ya existe/)
  assert.match(academicActionErrorMessage(new AcademicActionError('incomplete')), /Completa/)
  assert.match(academicActionErrorMessage(new AcademicActionError('permission')), /permisos/)
  assert.match(academicActionErrorMessage(new AcademicActionError('incompatible')), /compatible/)
  assert.equal(academicActionErrorMessage(new Error('secret PostgreSQL detail')),
    academicActionErrorMessage(new AcademicActionError('unavailable')))
})

test('una selección vacía se detecta antes de llamar la RPC', () => {
  assert.equal(hasIncompleteAcademicSelection(['assign', '', 'teacher-id']), true)
  assert.equal(hasIncompleteAcademicSelection(['period', '  ', '2026-10-01']), true)
  assert.equal(hasIncompleteAcademicSelection(['group-active', 'group-id', false]), false)
  assert.equal(hasIncompleteAcademicSelection(['enroll', 'group-id', 'student-id']), false)
})
