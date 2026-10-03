import assert from 'node:assert/strict'
import { test } from 'node:test'
import { executiveReport, historyReport, participationReport, progressReport, safePdfFilename, teacherReport } from '../src/lib/pdfReportModel.ts'
import { renderPdfReport } from '../src/lib/renderPdfReport.ts'

const base = { institution: 'Universidad Águila', period: '2026-1', generatedAt: new Date('2026-10-02T12:00:00Z'), filters: ['Campus: Norte', 'Programa: Ingeniería'] }
const total = { scope: 'total', id: null, label: 'Total', expected: 20, completed: 10, pending: 10, participation: 50, students: 10 }
const campus = { scope: 'campus', id: 'internal-id', label: 'Norte', expected: 20, completed: 10, pending: 10, participation: 50, students: 10 }
const teacher = { id: 'internal-assignment-id', periodId: 'period-id', periodName: '2026-1', periodStartsAt: '2026-01-01', subjectName: 'Matemáticas Aplicadas', groupCode: 'A-1', responseCount: 5, averageScore: 9.2, favorablePercent: 80, published: true,
  questions: Array.from({ length: 15 }, (_, index) => ({ id: `question-${index}`, position: index + 1, label: `Reactivo ${index + 1}`, score: 8.5 })) }

test('avance conserva los filtros y los totales agregados', () => {
  const report = progressReport(base, [total, campus])
  assert.equal(report.metrics[0].value, '20')
  assert.equal(report.sections[0].rows[0][1], 'Norte')
  assert.deepEqual(report.filters, base.filters)
})

test('participación separa ámbitos sin identidades individuales', () => {
  const report = participationReport(base, [total, campus])
  assert.equal(report.sections[0].rows.length, 1)
  assert.equal(report.sections[1].rows.length, 0)
  assert.equal(report.metrics[0].value, '50.0%')
})

test('reporte docente publicable contiene los quince promedios agregados', () => {
  const report = teacherReport(base, 'Dra. Sofía Pérez', teacher, [])
  assert.equal(report.sections[0].rows.length, 15)
  assert.equal(report.metrics[1].value, '9.2 / 10')
  assert.equal(report.metrics[2].value, '80.0%')
})

test('umbral inferior oculta puntuaciones y reactivos', () => {
  const report = teacherReport(base, 'Docente', { ...teacher, responseCount: 4, published: false }, [])
  assert.equal(report.metrics[1].value, 'Protegido')
  assert.equal(report.sections[0].rows.length, 0)
  assert.match(report.sections[0].note, /anonimato/)
})

test('las versiones mixtas no inventan reactivos', () => {
  const report = teacherReport(base, 'Docente', { ...teacher, questions: [] }, [])
  assert.equal(report.sections[0].rows.length, 0)
  assert.match(report.sections[0].note, /versiones/)
})

test('identificadores y correos de alumnos nunca entran en el modelo', () => {
  const privateTeacher = { ...teacher, student_id: 'SECRET-STUDENT-UUID', email: 'student-private@example.test', answers: ['SECRET-ANSWER'] }
  const report = teacherReport(base, 'Docente', privateTeacher, [])
  const content = JSON.stringify(report)
  for (const secret of ['SECRET-STUDENT-UUID', 'student-private@example.test', 'SECRET-ANSWER', 'internal-assignment-id']) assert.ok(!content.includes(secret))
})

test('histórico sin datos indica ausencia', () => {
  const report = historyReport(base, [])
  assert.equal(report.sections[0].rows.length, 0)
  assert.match(report.sections[0].note, /No hay periodos/)
})

test('histórico usa periodo anterior cronológico y no inventa comparación inicial', () => {
  const report = historyReport(base, [
    { name: '2026-2', startsAt: '2026-08-01', averageScore: 9, responseCount: 10 },
    { name: '2026-1', startsAt: '2026-01-01', averageScore: 8, responseCount: 8 },
  ])
  assert.equal(report.sections[0].rows[0][3], 'Sin comparativo')
  assert.equal(report.sections[0].rows[1][3], '+1.0')
  assert.equal(report.sections[0].rows[1][4], '+12.5%')
})

test('empate histórico muestra cambio cero sin conclusión cualitativa', () => {
  const report = historyReport(base, [
    { name: '2026-1', startsAt: '2026-01-01', averageScore: 8, responseCount: 8 },
    { name: '2026-2', startsAt: '2026-08-01', averageScore: 8, responseCount: 8 },
  ])
  assert.equal(report.sections[0].rows[1][3], '+0.0')
})

test('periodo protegido no entra en barras ni cambio histórico', () => {
  const report = historyReport(base, [
    { name: '2026-1', startsAt: '2026-01-01', averageScore: 8, responseCount: 8 },
    { name: '2026-2', startsAt: '2026-08-01', averageScore: null, responseCount: 0 },
  ])
  assert.equal(report.sections[0].rows[1][2], 'Protegido')
  assert.equal(report.sections[0].bars.length, 1)
})

test('institucional omite desgloses no autorizados o no disponibles', () => {
  const report = executiveReport(base, { overview: { averageScore: null, responseCount: 0, teacherCount: 0, expected: 0, completed: 0, pending: 0, participation: 0 }, trend: [] })
  assert.equal(report.metrics[0].value, 'Protegido')
  assert.ok(report.sections.every((section) => !section.title.includes('Reactivos')))
})

test('nombres de archivo sanitizados omiten UUID y rutas', () => {
  const report = teacherReport(base, 'Dra. María / García', teacher, [])
  const filename = safePdfFilename(report, 'Dra. María / García 123e4567-e89b-42d3-a456-426614174000')
  assert.match(filename, /^EvalDoc_Docente_Dra_Maria_Garcia_2026_1\.pdf$/)
  assert.ok(!filename.includes('/') && !filename.includes('123e4567'))
})

test('nombre seguro elimina UUID compacto y caracteres reservados', () => {
  const report = progressReport(base, [total])
  const filename = safePdfFilename(report, 'Área: / Norte \\ 123e4567e89b42d3a456426614174000')
  assert.match(filename, /^EvalDoc_Avance_Area_Norte_2026_1\.pdf$/)
})

test('avance sin obligaciones informa ceros sin dividir por cero', () => {
  const report = progressReport(base, [])
  assert.equal(report.metrics[3].value, '0.0%')
  assert.match(report.sections[0].note, /No hay evaluaciones/)
})

test('filtros se conservan en todos los informes institucionales', () => {
  const reports = [progressReport(base, [total]), participationReport(base, [total]), historyReport(base, [])]
  for (const report of reports) assert.deepEqual(report.filters, base.filters)
})

test('los quince reactivos se ordenan por posición oficial', () => {
  const report = teacherReport(base, 'Docente', { ...teacher, questions: [...teacher.questions].reverse() }, [])
  assert.deepEqual(report.sections[0].rows.map((row) => Number(row[0])), Array.from({ length: 15 }, (_, index) => index + 1))
})

test('reporte institucional ignora propiedades estudiantiles adicionales', () => {
  const report = executiveReport(base, { overview: { averageScore: 8.5, responseCount: 5, teacherCount: 1, expected: 5, completed: 5, pending: 0, participation: 100, student_id: 'SECRET-ID' }, trend: [] })
  assert.ok(!JSON.stringify(report).includes('SECRET-ID'))
})

test('el resumen ejecutivo contiene solo asignaciones publicables suministradas', () => {
  const report = executiveReport(base, { overview: { averageScore: 8, responseCount: 5, teacherCount: 1, expected: 5, completed: 5, pending: 0, participation: 100 }, trend: [], ranking: [{ id: 'internal-teacher-id', name: 'Dr. Ejemplo', averageScore: 8, responseCount: 5, assignmentCount: 1 }] })
  assert.equal(report.sections.find((section) => section.title === 'Docentes publicables').rows[0][0], 'Dr. Ejemplo')
  assert.ok(!JSON.stringify(report).includes('internal-teacher-id'))
})

test('porcentaje histórico no se calcula si el anterior es cero', () => {
  const report = historyReport(base, [
    { name: '2026-1', startsAt: '2026-01-01', averageScore: 0, responseCount: 5 },
    { name: '2026-2', startsAt: '2026-08-01', averageScore: 1, responseCount: 5 },
  ])
  assert.equal(report.sections[0].rows[1][3], '+1.0')
  assert.equal(report.sections[0].rows[1][4], '—')
})

test('PDF válido, no vacío y de varias páginas conserva privacidad', async () => {
  const manyRows = Array.from({ length: 100 }, (_, index) => ({ ...campus, id: `id-${index}`, label: `Campus muy largo número ${index} con información agregada`, scope: 'campus' }))
  const report = participationReport(base, [total, ...manyRows])
  const blob = await renderPdfReport(report)
  const bytes = Buffer.from(await blob.arrayBuffer())
  assert.equal(blob.type, 'application/pdf')
  assert.ok(blob.size > 1000)
  assert.equal(bytes.subarray(0, 4).toString(), '%PDF')
  assert.ok((bytes.toString().match(/\/Type \/Page\b/g) ?? []).length > 1)
})
