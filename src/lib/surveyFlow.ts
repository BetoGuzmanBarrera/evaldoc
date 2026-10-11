import type { Rating, SurveyQuestionData } from '../types'

export const officialRatings: readonly Rating[] = [0, 2.5, 5, 7.5, 10]

export type SurveyStep =
  | { kind: 'question'; index: number; returnToReview: boolean }
  | { kind: 'review' }

export function nextSurveyStep(step: SurveyStep, questionCount: number, answered: boolean): SurveyStep {
  if (step.kind !== 'question' || !answered) return step
  if (step.returnToReview || step.index === questionCount - 1) return { kind: 'review' }
  return { ...step, index: step.index + 1 }
}

export function answeredQuestionCount(
  questions: SurveyQuestionData[],
  answers: Record<string, Rating>,
): number {
  return questions.filter((question) => officialRatings.includes(answers[question.id])).length
}

export function isReviewComplete(questions: SurveyQuestionData[], answers: Record<string, Rating>): boolean {
  return questions.length === 15 && answeredQuestionCount(questions, answers) === 15
}

export function createSubmissionGuard() {
  let running = false
  let completed = false
  return {
    async run(action: () => Promise<void>): Promise<boolean> {
      if (running || completed) return false
      running = true
      try {
        await action()
        completed = true
        return true
      } finally {
        running = false
      }
    },
  }
}