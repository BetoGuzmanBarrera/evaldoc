import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { validAcademicSelection } from '../src/lib/registrationForm.ts'

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=')
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')]
}))
const apiUrl = new URL(env.VITE_SUPABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(apiUrl.hostname) && apiUrl.port === '55421', 'Only local EvalDoc may be tested')

const catalog = createClient(apiUrl.origin, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'evaldoc-public-registration-test',
  },
})

async function activeInstitutions() {
  const { data, error } = await catalog.from('institutions')
    .select('id,slug,name').eq('active', true).order('name')
  assert.equal(error, null)
  return data
}

async function choices(institutionId) {
  const [programs, subjects] = await Promise.all([
    catalog.from('programs').select('id,institution_id,name').eq('institution_id', institutionId).eq('active', true),
    catalog.from('subjects').select('id,institution_id,program_id,name').eq('institution_id', institutionId).eq('active', true),
  ])
  assert.equal(programs.error, null)
  assert.equal(subjects.error, null)
  return { programs: programs.data, subjects: subjects.data }
}

test('el catálogo público lista las 7 instituciones activas aunque no tengan oferta', async () => {
  const institutions = await activeInstitutions()
  assert.deepEqual(institutions.map((item) => item.slug).sort(), [
    'ipn', 'tecnologico-de-monterrey', 'uam', 'unam',
    'universidad-anahuac', 'universidad-iberoamericana', 'uvm',
  ])
})

test('IPN aparece con catálogo vacío y no permite elegir programa ni materias', async () => {
  const institutions = await activeInstitutions()
  const ipn = institutions.find((item) => item.slug === 'ipn')
  assert.ok(ipn)
  const { programs, subjects } = await choices(ipn.id)
  assert.deepEqual(programs, [])
  assert.deepEqual(subjects, [])
  assert.equal(validAcademicSelection('student', ipn.id, '', [], programs, subjects), false)
  assert.equal(validAcademicSelection('teacher', ipn.id, '', [], programs, subjects), false)
})

test('Anáhuac conserva el programa y la materia QA activos', async () => {
  const institutions = await activeInstitutions()
  const anahuac = institutions.find((item) => item.slug === 'universidad-anahuac')
  assert.ok(anahuac)
  const { programs, subjects } = await choices(anahuac.id)
  assert.ok(programs.some((item) => item.name === 'Ingeniería de Software QA'))
  assert.ok(subjects.some((item) => item.name === 'Bases de Datos QA'))
  const qaProgram = programs.find((item) => item.name === 'Ingeniería de Software QA')
  const qaSubject = subjects.find((item) => item.name === 'Bases de Datos QA')
  assert.equal(validAcademicSelection('student', anahuac.id, qaProgram.id, [qaSubject.id], programs, subjects), true)
  assert.equal(validAcademicSelection('teacher', anahuac.id, '', [qaSubject.id], programs, subjects), true)
})

test('ninguna institución puede seleccionar una materia de Anáhuac', async () => {
  const institutions = await activeInstitutions()
  const ipn = institutions.find((item) => item.slug === 'ipn')
  const anahuac = institutions.find((item) => item.slug === 'universidad-anahuac')
  assert.ok(ipn && anahuac)
  const ipnChoices = await choices(ipn.id)
  const anahuacChoices = await choices(anahuac.id)
  const foreignSubject = anahuacChoices.subjects[0]
  assert.ok(foreignSubject)
  assert.equal(ipnChoices.subjects.some((item) => item.id === foreignSubject.id), false)
  assert.equal(validAcademicSelection('teacher', ipn.id, '', [foreignSubject.id], ipnChoices.programs, ipnChoices.subjects), false)
})