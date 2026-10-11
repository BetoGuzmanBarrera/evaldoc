import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inflateSync } from 'node:zlib'
import { executiveReport, historyReport, participationReport, progressReport, safePdfFilename, teacherReport } from '../src/lib/pdfReportModel.ts'
import { renderPdfReport } from '../src/lib/renderPdfReport.ts'

const base = { institution: 'Universidad Águila', period: '2026-1', generatedAt: new Date('2026-10-02T12:00:00Z'), filters: ['Campus: Norte', 'Programa: Ingeniería'] }
const total = { scope: 'total', id: null, label: 'Total', expected: 20, completed: 10, pending: 10, participation: 50, students: 10 }
const campus = { scope: 'campus', id: 'internal-id', label: 'Norte', expected: 20, completed: 10, pending: 10, participation: 50, students: 10 }
const teacher = { id: 'internal-assignment-id', periodId: 'period-id', periodName: '2026-1', periodStartsAt: '2026-01-01', subjectName: 'Matemáticas Aplicadas', groupCode: 'A-1', responseCount: 5, averageScore: 9.2, favorablePercent: 80, published: true,
  questions: Array.from({ length: 15 }, (_, index) => ({ id: `question-${index}`, position: index + 1, label: `Reactivo ${index + 1}`, score: 8.5 })) }

async function renderedPdfText(report) {
  const raw = Buffer.from(await (await renderPdfReport(report)).arrayBuffer()).toString('latin1')
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].flatMap((match) => {
    try { return [inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1')] } catch { return [] }
  })
  return { pages: (raw.match(/\/Type \/Page\b/g) ?? []).length, text: streams.join('\n') }
}

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
  assert.equal(report.metrics[2].value, 'Contratable')
  assert.equal(report.metrics[3].value, '80.0%')
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

test('fortaleza y área de oportunidad solo se derivan de los quince promedios publicados', () => {
  const questions = teacher.questions.map((item, index) => ({ ...item, score: index === 0 ? 9.6 : index === 9 ? 7.6 : 8.7 }))
  const report = teacherReport(base, 'Docente', { ...teacher, questions }, [])
  assert.match(report.sections[0].note, /Fortaleza: Reactivo 1/)
  assert.match(report.sections[0].note, /Área de oportunidad: Reactivo 10/)
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
  assert.equal(report.sections.find((section) => section.title === 'Docentes publicables').rows[0][3], 'Contratable')
  assert.match(report.sections.find((section) => section.title === 'Nota institucional').note, /no determina automáticamente/)
  assert.ok(!JSON.stringify(report).includes('internal-teacher-id'))
})

test('ámbitos académicos del informe se presentan en español sin alterar sus códigos', () => {
  const breakdown = ['campus', 'program', 'group'].map((scope) => ({ scope, id: scope, label: scope, averageScore: 8.7, responseCount: 5, teacherCount: 1, assignmentCount: 1 }))
  const report = executiveReport(base, { overview: { averageScore: 8.7, responseCount: 5, teacherCount: 1, expected: 5, completed: 5, pending: 0, participation: 100 }, trend: [], breakdown })
  assert.deepEqual(breakdown.map((item) => item.scope), ['campus', 'program', 'group'])
  assert.deepEqual(report.sections.find((item) => item.title === 'Campus, programas y grupos publicables').rows.map((row) => row[0]), ['Campus', 'Programa', 'Grupo'])
})

test('un encabezado de sección que inicia página no se etiqueta como continuación', async () => {
  const report = { kind: 'Institucional', title: 'Informe institucional ejecutivo', ...base, metrics: [], sections: [
    { title: 'Sección previa', columns: ['Dato'], rows: Array.from({ length: 14 }, (_, index) => [`Fila ${index}`]) },
    { title: 'Docentes publicables', columns: ['Docente', 'Promedio', 'Respuestas', 'Clasificación'], rows: [['Profesora Laura Demo', '8.7 / 10', '5', 'Contratable']] },
  ] }
  const rendered = await renderedPdfText(report)
  assert.equal(rendered.pages, 2)
  assert.equal((rendered.text.match(/\(Docentes publicables\) Tj/g) ?? []).length, 1)
  assert.ok(!rendered.text.includes('Docentes publicables \\(continuaci'))
})

test('una tabla que sí continúa en otra página conserva su encabezado de continuación', async () => {
  const report = { kind: 'Institucional', title: 'Informe institucional ejecutivo', ...base, metrics: [], sections: [
    { title: 'Docentes publicables', columns: ['Docente', 'Promedio', 'Respuestas', 'Clasificación'], rows: Array.from({ length: 40 }, (_, index) => [`Docente ${index}`, '8.7 / 10', '5', 'Contratable']) },
  ] }
  const rendered = await renderedPdfText(report)
  assert.ok(rendered.pages > 1)
  assert.ok(rendered.text.includes('Docentes publicables \\(continuaci'))
})

test('Laura 8.7 con cinco evaluaciones es Contratable en el PDF docente y ejecutivo filtrado', () => {
  const laura = { ...teacher, responseCount: 5, averageScore: 8.7, campusName: 'México Campus Norte', programName: 'Ingeniería de Software QA' }
  const own = teacherReport(base, 'Profesora Laura Demo', laura, [])
  assert.equal(own.metrics.find((item) => item.label === 'Clasificación institucional').value, 'Contratable')
  assert.ok(own.filters.includes('Campus: México Campus Norte'))
  assert.ok(own.filters.includes('Programa: Ingeniería de Software QA'))
  assert.equal(own.sections[0].rows.length, 15)
  assert.match(own.sections.find((item) => item.title === 'Nota institucional').note, /no determina automáticamente/)
  const institutional = executiveReport(base, { overview: { averageScore: 8.7, responseCount: 5, teacherCount: 1, expected: 5, completed: 5, pending: 0, participation: 100 }, trend: [], ranking: [{ id: 'private-id', name: 'Profesora Laura Demo', averageScore: 8.7, responseCount: 5, assignmentCount: 1 }] })
  assert.deepEqual(institutional.filters, base.filters)
  assert.equal(institutional.sections.find((item) => item.title === 'Docentes publicables').rows[0][3], 'Contratable')
})

test('Ricardo sin resultados y un grupo de cuatro nunca reciben categoría laboral', () => {
  for (const responseCount of [0, 4]) {
    const report = teacherReport(base, 'Ricardo QA', { ...teacher, responseCount, averageScore: null, published: false, questions: [] }, [])
    assert.equal(report.metrics.find((item) => item.label === 'Clasificación institucional').value, 'Resultado protegido')
    assert.equal(report.sections[0].rows.length, 0)
  }
})

test('un promedio inválido publicable no se confunde con privacidad protegida', () => {
  const report = teacherReport(base, 'Docente', { ...teacher, averageScore: null, responseCount: 5, published: true }, [])
  assert.equal(report.metrics[1].value, 'No disponible')
  assert.equal(report.metrics[2].value, 'Clasificación no disponible')
  assert.equal(report.sections[0].rows.length, 0)
})

test('histórico docente muestra clasificación por periodo, pero el institucional no', () => {
  const periods = [{ name: 'Anterior', startsAt: '2026-01-01', averageScore: null, responseCount: 0 }, { name: 'Actual', startsAt: '2026-08-01', averageScore: 8.7, responseCount: 5 }]
  const own = historyReport(base, periods, true)
  assert.equal(own.sections[0].rows[0][5], 'Resultado protegido')
  assert.equal(own.sections[0].rows[1][5], 'Contratable')
  assert.match(own.sections[1].note, /indicador de apoyo/)
  assert.equal(historyReport(base, periods).sections[0].rows[1].length, 5)
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
