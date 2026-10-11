import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  groupsForSubject, programsForCampus, subjectsForProgram,
} from '../src/lib/academicManagementOptions.ts'

const catalog = {
  programs: [
    { id: 'a', campus_id: 'north', active: true },
    { id: 'b', campus_id: 'south', active: true },
    { id: 'old', campus_id: 'north', active: false },
  ],
  subjects: [
    { id: 'a1', program_id: 'a', active: true },
    { id: 'b1', program_id: 'b', active: true },
    { id: 'old', program_id: 'a', active: false },
  ],
  groups: [
    { id: 'a1-g', subject_id: 'a1', active: true },
    { id: 'b1-g', subject_id: 'b1', active: true },
    { id: 'old', subject_id: 'a1', active: false },
  ],
}

test('coordinación encadena sede, carrera, materia y grupo sin opciones incompatibles', () => {
  assert.deepEqual(programsForCampus(catalog, 'north').map((item) => item.id), ['a'])
  assert.deepEqual(subjectsForProgram(catalog, 'a').map((item) => item.id), ['a1'])
  assert.deepEqual(groupsForSubject(catalog, 'a1').map((item) => item.id), ['a1-g'])
  assert.deepEqual(programsForCampus(catalog, 'other'), [])
  assert.deepEqual(subjectsForProgram(catalog, 'b').map((item) => item.id), ['b1'])
  assert.deepEqual(groupsForSubject(catalog, 'b1').map((item) => item.id), ['b1-g'])
})
