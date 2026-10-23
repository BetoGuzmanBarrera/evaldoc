import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { availablePrograms, availableSubjects, validAcademicSelection } from '../src/lib/registrationForm.ts'

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=')
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')]
}))
const apiUrl = new URL(env.VITE_SUPABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(apiUrl.hostname) && apiUrl.port === '55421',
  'Only local EvalDoc may be tested')
const catalog = createClient(apiUrl.origin, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function fetchRows(table, columns) {
  const { data, error } = await catalog.from(table).select(columns).eq('active', true)
  assert.equal(error, null)
  return data
}
const institutions = await fetchRows('institutions', 'id,slug,name')
const campuses = await fetchRows('campuses', 'id,institution_id,name')
const programs = await fetchRows('programs', 'id,institution_id,campus_id,name,code')
const subjects = await fetchRows('subjects', 'id,institution_id,program_id,name,code')

test('catálogo público expone 7 instituciones, 21 campus y 63 carreras', () => {
  assert.equal(institutions.length, 7)
  assert.equal(campuses.length, 21)
  assert.equal(programs.length, 63)
  for (const institution of institutions) {
    const ownCampuses = campuses.filter((item) => item.institution_id === institution.id)
    assert.equal(ownCampuses.length, 3)
    for (const campus of ownCampuses) {
      assert.equal(availablePrograms(programs, campus.id).length, 3)
    }
  }
})

test('UVM presenta las tres sedes y sus nueve carreras aprobadas', () => {
  const uvm = institutions.find((item) => item.slug === 'uvm')
  assert.ok(uvm)
  const expected = {
    'Reforma – San Rafael': ['Comunicación y Medios Digitales', 'Psicología', 'Economía y Finanzas'],
    'Coyoacán – Tlalpan': ['Ingeniería Biomédica', 'Medicina Veterinaria y Zootecnia', 'Fisioterapia'],
    'Monterrey Cumbres': ['Ingeniería en Ciencia de Datos', 'Ingeniería en Desarrollo de Videojuegos', 'Ingeniería en Robótica'],
  }
  for (const [campusName, careers] of Object.entries(expected)) {
    const campus = campuses.find((item) => item.institution_id === uvm.id && item.name === campusName)
    assert.ok(campus)
    assert.deepEqual(availablePrograms(programs, campus.id).map((item) => item.name).sort(),
      careers.sort())
  }
})

test('IPN, UNAM, Tec, UAM, IBERO y Anáhuac tienen campus y carreras aislados', () => {
  for (const slug of ['ipn', 'unam', 'tecnologico-de-monterrey', 'uam',
    'universidad-iberoamericana', 'universidad-anahuac']) {
    const institution = institutions.find((item) => item.slug === slug)
    assert.ok(institution)
    const ownCampuses = campuses.filter((item) => item.institution_id === institution.id)
    assert.equal(ownCampuses.length, 3)
    const names = ownCampuses.flatMap((campus) =>
      availablePrograms(programs, campus.id).map((item) => item.name))
    assert.equal(new Set(names.map((name) => name.toLocaleLowerCase('es'))).size, 9)
  }
})

test('programa QA y su materia histórica no aparecen en registro público', () => {
  assert.equal(programs.some((item) => item.name === 'Ingeniería de Software QA'), false)
  assert.equal(subjects.some((item) => item.name === 'Bases de Datos QA'), false)
})

test('no se pueden seleccionar materias de otro campus ni institución', () => {
  const ipn = institutions.find((item) => item.slug === 'ipn')
  const unam = institutions.find((item) => item.slug === 'unam')
  assert.ok(ipn && unam)
  const ipnCampus = campuses.find((item) => item.institution_id === ipn.id)
  const unamProgram = programs.find((item) => item.institution_id === unam.id)
  assert.ok(ipnCampus && unamProgram)
  assert.equal(availablePrograms(programs, ipnCampus.id).some((item) => item.id === unamProgram.id), false)
  assert.equal(availableSubjects(subjects, programs, 'student', ipnCampus.id, unamProgram.id).length, 0)
  assert.equal(validAcademicSelection('student', ipn.id, ipnCampus.id, unamProgram.id,
    [], campuses, programs, subjects), false)
})

test('registro público muestra tres materias por carrera y nueve por campus docente', () => {
  for (const institution of institutions) {
    const ownCampuses = campuses.filter((item) => item.institution_id === institution.id)
    for (const campus of ownCampuses) {
      const ownPrograms = availablePrograms(programs, campus.id)
      const teacherSubjects = availableSubjects(subjects, programs, 'teacher', campus.id, '')
      assert.equal(teacherSubjects.length, 9, campus.name)
      for (const program of ownPrograms) {
        const studentSubjects = availableSubjects(subjects, programs, 'student', campus.id, program.id)
        assert.equal(studentSubjects.length, 3, program.name)
        assert.ok(studentSubjects.every((item) => item.institution_id === institution.id
          && item.program_id === program.id))
      }
    }
  }
})

test('materia QA histórica Anáhuac Norte solo queda fuera del registro', () => {
  const anahuac = institutions.find((item) => item.slug === 'universidad-anahuac')
  assert.ok(anahuac)
  const qaSubject = subjects.find((item) => item.code === 'QA-BIOT-101')
  assert.ok(qaSubject, 'QA subject remains in the database and Coordination')
  const program = programs.find((item) => item.id === qaSubject.program_id)
  assert.ok(program)
  const visible = availableSubjects(subjects, programs, 'student', program.campus_id, program.id)
  assert.equal(visible.length, 3)
  assert.ok(!visible.some((item) => item.id === qaSubject.id))
  assert.ok(visible.every((item) => item.institution_id === anahuac.id))
})
