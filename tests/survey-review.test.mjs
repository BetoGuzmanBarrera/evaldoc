import assert from 'node:assert/strict'
import { test } from 'node:test'
import { answeredQuestionCount, createSubmissionGuard, isReviewComplete, nextSurveyStep, officialRatings } from '../src/lib/surveyFlow.ts'

const questions = Array.from({ length: 15 }, (_, index) => ({
  id: `question-${index + 1}`, dimension: 'DIMENSIÓN', text: `Reactivo ${index + 1}`,
}))

test('los 15 reactivos navegan a revisión sin ejecutar el envío', () => {
  const answers = {}
  let step = { kind: 'question', index: 0, returnToReview: false }
  let writes = 0
  for (let index = 0; index < 15; index++) {
    assert.equal(step.kind, 'question')
    assert.equal(step.index, index)
    assert.deepEqual(nextSurveyStep(step, 15, false), step)
    answers[questions[index].id] = officialRatings[index % officialRatings.length]
    step = nextSurveyStep(step, 15, true)
  }
  assert.deepEqual(step, { kind: 'review' })
  assert.equal(answeredQuestionCount(questions, answers), 15)
  assert.equal(isReviewComplete(questions, answers), true)
  assert.equal(writes, 0)

  const guard = createSubmissionGuard()
  return guard.run(async () => { writes++ }).then((started) => {
    assert.equal(started, true)
    assert.equal(writes, 1)
  })
})

test('revisión permite editar y volver sin perder respuestas', () => {
  const answers = Object.fromEntries(questions.map((question) => [question.id, 7.5]))
  let step = { kind: 'question', index: 6, returnToReview: true }
  answers[questions[6].id] = 10
  step = nextSurveyStep(step, 15, true)
  assert.deepEqual(step, { kind: 'review' })
  assert.equal(answers[questions[6].id], 10)
  assert.equal(isReviewComplete(questions, answers), true)
})

test('envío explícito exige 15 valores oficiales', () => {
  const answers = Object.fromEntries(questions.map((question) => [question.id, 5]))
  assert.equal(isReviewComplete(questions, answers), true)
  delete answers[questions[14].id]
  assert.equal(isReviewComplete(questions, answers), false)
  answers[questions[14].id] = 3
  assert.equal(isReviewComplete(questions, answers), false)
})

test('doble clic y reintento posterior al éxito no repiten el envío', async () => {
  const guard = createSubmissionGuard()
  let release
  const pending = new Promise((resolve) => { release = resolve })
  let writes = 0
  const first = guard.run(async () => { writes++; await pending })
  assert.equal(await guard.run(async () => { writes++ }), false)
  assert.equal(writes, 1)
  release()
  assert.equal(await first, true)
  assert.equal(await guard.run(async () => { writes++ }), false)
  assert.equal(writes, 1)
})

test('un fallo permite reintento explícito sin marcar la evaluación como enviada', async () => {
  const guard = createSubmissionGuard()
  await assert.rejects(guard.run(async () => { throw Error('network') }))
  assert.equal(await guard.run(async () => {}), true)
})