import { classificationDisclaimer, classifyTeacherScore, teacherClassificationLabel } from '../../lib/teacherClassification'

export function TeacherClassificationCard({ average, responseCount }: { average: number | null; responseCount: number }) {
  const classification = classifyTeacherScore(average, responseCount)
  return <section className="surface teacher-classification-card" aria-label="Clasificación institucional">
    <div><h2>Clasificación institucional</h2><strong>{teacherClassificationLabel(classification)}</strong></div>
    <p>{classificationDisclaimer}</p>
  </section>
}
