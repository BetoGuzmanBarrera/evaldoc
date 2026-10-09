import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { ConfirmationModal } from '../../components/evaluation/ConfirmationModal'
import { SurveyQuestion } from '../../components/evaluation/SurveyQuestion'
import { SurveyReview } from '../../components/evaluation/SurveyReview'
import { useStudentEvaluations } from '../../hooks/useStudentEvaluations'
import {
  loadSurveyQuestions,
  StudentEvaluationError,
  submissionMessage,
  submitStudentEvaluation,
} from '../../lib/studentEvaluations'
import { createSubmissionGuard, isReviewComplete, nextSurveyStep, type SurveyStep } from '../../lib/surveyFlow'
import type { Rating, SurveyQuestionData } from '../../types'

interface QuestionState {
  templateId: string
  questions: SurveyQuestionData[]
  error: boolean
}

function SurveyState({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  return <main className="simple-state"><Brand /><h1>{title}</h1>{message && <p>{message}</p>}
    {onRetry && <button className="button button-outline" type="button" onClick={onRetry}>Reintentar</button>}
    <Link className="button button-primary" to="/student/evaluations">Volver a mis evaluaciones</Link>
  </main>
}

export function SurveyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { evaluations, loading, error: catalogError, reload } = useStudentEvaluations()
  const evaluation = evaluations.find((item) => item.id === id)
  const templateId = evaluation?.templateId
  const [questionState, setQuestionState] = useState<QuestionState>({ templateId: '', questions: [], error: false })
  const [questionRevision, setQuestionRevision] = useState(0)
  const [step, setStep] = useState<SurveyStep>({ kind: 'question', index: 0, returnToReview: false })
  const [answers, setAnswers] = useState<Record<string, Rating>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const submissionGuard = useRef(createSubmissionGuard())

  useEffect(() => {
    if (!templateId) return
    let active = true
    loadSurveyQuestions(templateId).then((questions) => {
      if (active) setQuestionState({ templateId, questions, error: false })
    }).catch(() => {
      if (active) setQuestionState({ templateId, questions: [], error: true })
    })
    return () => { active = false }
  }, [templateId, questionRevision])

  if (loading) return <SurveyState title="Cargando evaluación…" />
  if (catalogError) return <SurveyState title="No pudimos cargar la evaluación" onRetry={reload} />
  if (!evaluation) return <SurveyState title="Evaluación no encontrada" message="No tienes acceso a esta evaluación." />
  if (evaluation.status === 'completed') return <SurveyState title="Esta evaluación ya fue completada" />
  if (!evaluation.canSubmit) return <SurveyState title="Evaluación no disponible" message="La ventana de evaluación está cerrada o aún no está habilitada." />
  if (questionState.templateId !== templateId) return <SurveyState title="Cargando cuestionario…" />
  if (questionState.error) return <SurveyState title="No pudimos cargar el cuestionario" onRetry={() => {
    setQuestionState({ templateId: '', questions: [], error: false })
    setQuestionRevision((current) => current + 1)
  }} />

  const questions = questionState.questions
  const question = step.kind === 'question' ? questions[step.index] : null
  if (questions.length !== 15 || (step.kind === 'question' && !question)) return <SurveyState title="Cuestionario no disponible" />

  const next = () => {
    if (!question || answers[question.id] === undefined) {
      setErrorMessage('Selecciona una respuesta para continuar.')
      return
    }
    setErrorMessage('')
    setStep(nextSurveyStep(step, questions.length, true))
  }

  const openConfirmation = () => {
    if (step.kind !== 'review' || !isReviewComplete(questions, answers) || submitting) {
      setErrorMessage('Responde los 15 reactivos antes de enviar.')
      return
    }
    setErrorMessage('')
    setShowConfirm(true)
  }

  const confirm = async () => {
    if (step.kind !== 'review' || !showConfirm || !isReviewComplete(questions, answers)) return
    try {
      await submissionGuard.current.run(async () => {
        setSubmitting(true)
        setErrorMessage('')
        try {
          await submitStudentEvaluation(evaluation, questions, answers)
          navigate('/student/evaluations/' + evaluation.id + '/success', { replace: true })
        } finally {
          setSubmitting(false)
        }
      })
    } catch (error) {
      setShowConfirm(false)
      setErrorMessage(submissionMessage(error instanceof StudentEvaluationError ? error.kind : 'network'))
      reload()
    }
  }

  return <div className="survey-page">
    <header className="survey-topbar"><Brand /><Link to="/student/evaluations">Salir de la evaluación</Link></header>
    <main className="survey-content">
      <nav className="survey-breadcrumb" aria-label="Ruta de navegación"><Link to="/student/evaluations">Mis evaluaciones</Link><span>/</span><span>Evaluación docente</span></nav>
      <h1 className="survey-title">Evaluación docente</h1>
      <section className="surface teacher-summary">
        <span className="teacher-avatar" aria-hidden="true" />
        <div className="teacher-info"><h2>{evaluation.teacherName}</h2><p>{evaluation.subjectName} · Grupo {evaluation.groupCode} · {evaluation.periodName}</p></div>
        <span className="anonymous-badge"><LockKeyhole size={16} aria-hidden="true" /> Evaluación anónima</span>
      </section>
      {question ? <SurveyQuestion question={question} number={step.kind === 'question' ? step.index + 1 : 1} total={questions.length} value={answers[question.id]} onChange={(value) => {
        setAnswers((current) => ({ ...current, [question.id]: value }))
        setErrorMessage('')
      }}>
        <div className="survey-nav">
          <button className="button button-outline" type="button" disabled={step.kind !== 'question' || step.index === 0} onClick={() => {
            if (step.kind === 'question') setStep({ ...step, index: step.index - 1 })
            setErrorMessage('')
          }}><ArrowLeft size={17} aria-hidden="true" /> Anterior</button>
          <button className="button button-primary" type="button" onClick={next}>{step.kind === 'question' && step.returnToReview ? 'Guardar y revisar' : step.kind === 'question' && step.index === questions.length - 1 ? 'Revisar respuestas' : 'Siguiente'} <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </SurveyQuestion> : <SurveyReview questions={questions} answers={answers} disabled={submitting} onEdit={(index) => {
        setStep({ kind: 'question', index, returnToReview: true })
        setErrorMessage('')
      }} onBack={() => {
        setStep({ kind: 'question', index: questions.length - 1, returnToReview: true })
        setErrorMessage('')
      }} onSubmit={openConfirmation} />}
      {errorMessage && <p className="form-error survey-error" role="alert">{errorMessage}</p>}
      <p className="survey-privacy"><ShieldCheck size={16} aria-hidden="true" /> Información protegida. El docente solo verá resultados agregados.</p>
    </main>
    {showConfirm && <ConfirmationModal onCancel={() => setShowConfirm(false)} onConfirm={() => void confirm()} submitting={submitting} />}
  </div>
}