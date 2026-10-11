import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classificationDisclaimer, classifyTeacherScore, teacherClassificationLabel } from '../src/lib/teacherClassification.ts'

test('rangos oficiales respetan los límites y decimales de 0 a 10', () => {
  for (const [score, expected] of [
    [10, 'contratable'], [8.7, 'contratable'], [8, 'contratable'],
    [7.99, 'intermedio'], [7.5, 'intermedio'], [6, 'intermedio'],
    [5.99, 'no_contratable'], [5.5, 'no_contratable'], [5, 'no_contratable'], [0, 'no_contratable'],
  ]) assert.equal(classifyTeacherScore(score, 5), expected)
})

test('menos de cinco evaluaciones siempre protege la clasificación', () => {
  for (const score of [8.7, 7.5, 5.5, 0]) {
    assert.equal(classifyTeacherScore(score, 4), 'protected')
    assert.equal(classifyTeacherScore(score, 5) !== 'protected', true)
  }
  assert.equal(teacherClassificationLabel(classifyTeacherScore(8.7, 4)), 'Resultado protegido')
})

test('promedios y conteos inválidos no generan clasificación laboral', () => {
  for (const score of [null, NaN, Infinity, -0.01, 10.01]) assert.equal(classifyTeacherScore(score, 5), 'unavailable')
  for (const count of [NaN, -1, 5.5]) assert.equal(classifyTeacherScore(8.7, count), 'unavailable')
})

test('etiquetas y nota institucional son explícitas', () => {
  assert.equal(teacherClassificationLabel('contratable'), 'Contratable')
  assert.equal(teacherClassificationLabel('intermedio'), 'Intermedio')
  assert.equal(teacherClassificationLabel('no_contratable'), 'No contratable')
  assert.equal(teacherClassificationLabel('unavailable'), 'Clasificación no disponible')
  assert.match(classificationDisclaimer, /no determina automáticamente una decisión laboral/)
})
