import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { officialRatings } from '../../lib/surveyFlow'
import type { Rating, SurveyQuestionData } from '../../types'

const labels: Record<Rating, string> = {
  0: 'Muy Deficiente',
  2.5: 'Deficiente',
  5: 'Regular',
  7.5: 'Bueno',
  10: 'Excelente',
}

export function SurveyReview({ questions, answers, onEdit, onBack, onSubmit, disabled }: {
  questions: SurveyQuestionData[]
  answers: Record<string, Rating>
  onEdit: (index: number) => void
  onBack: () => void
  onSubmit: () => void
  disabled: boolean
}) {
  const answered = questions.filter((question) => officialRatings.includes(answers[question.id])).length
  return <section className="surface survey-card survey-review" aria-labelledby="survey-review-title">
    <span className="review-complete"><CheckCircle2 size={19} aria-hidden="true" /> {answered}/{questions.length} respuestas</span>
    <h2 id="survey-review-title">Revisa tus respuestas</h2>
    <p>Antes de enviar, puedes modificar cualquier reactivo. Tus respuestas aún no se han enviado.</p>
    <ol className="review-list">{questions.map((question, index) => <li key={question.id}>
      <span className="review-question"><small>Pregunta {index + 1}</small>{question.text}</span>
      <strong>{answers[question.id] === undefined ? 'Sin responder' : `${answers[question.id]} / 10 · ${labels[answers[question.id]]}`}</strong>
      <button type="button" className="text-button" onClick={() => onEdit(index)} aria-label={`Modificar respuesta de la pregunta ${index + 1}`}>Modificar</button>
    </li>)}</ol>
    <div className="survey-nav">
      <button className="button button-outline" type="button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /> Volver a preguntas</button>
      <button className="button button-primary" type="button" disabled={disabled || answered !== questions.length} onClick={onSubmit}>Enviar evaluación <Send size={17} aria-hidden="true" /></button>
    </div>
  </section>
}