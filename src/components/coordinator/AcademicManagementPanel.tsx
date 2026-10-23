import { useEffect, useState, type FormEvent } from 'react'
import {
  loadAcademicSnapshot, performAcademicAction, type AcademicAction,
  type AcademicSnapshot, type AcademicSubject,
} from '../../lib/academicManagement'
import { programsForCampus, subjectsForProgram, groupsForSubject } from '../../lib/academicManagementOptions'
import { academicActionErrorMessage } from '../../lib/academicActionErrors'

function Choice({ label, value, onChange, options, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void
  options: { id: string; name: string }[]; disabled?: boolean
}) {
  return <label className="field"><span>{label}</span><select value={value} disabled={disabled || options.length === 0}
    onChange={(event) => onChange(event.target.value)} required>
    <option value="" disabled>Selecciona {label.toLowerCase()}</option>
    {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
  </select></label>
}

export function AcademicManagementPanel({ onChanged }: { onChanged: () => void }) {
  const [data, setData] = useState<AcademicSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [campusId, setCampusId] = useState('')
  const [programId, setProgramId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [editing, setEditing] = useState<AcademicSubject | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [periodId, setPeriodId] = useState('')
  const [periodName, setPeriodName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    let active = true
    loadAcademicSnapshot().then((snapshot) => {
      if (active) { setData(snapshot); setLoading(false) }
    }).catch(() => {
      if (active) { setError('No pudimos cargar la gestión académica.'); setLoading(false) }
    })
    return () => { active = false }
  }, [])

  const run = async (action: AcademicAction, success: string) => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      await performAcademicAction(action)
      setNotice(success)
      try {
        setData(await loadAcademicSnapshot())
        onChanged()
      } catch {
        setError('El cambio se guardó, pero no pudimos actualizar la vista. Recarga la página.')
      }
    } catch (failure) {
      setError(academicActionErrorMessage(failure))
    } finally { setBusy(false) }
  }
  const submit = (event: FormEvent<HTMLFormElement>, action: AcademicAction, success: string) => {
    event.preventDefault()
    void run(action, success)
  }
  const programs = data ? programsForCampus(data, campusId) : []
  const subjects = data ? subjectsForProgram(data, programId) : []
  const groups = data ? groupsForSubject(data, subjectId, periodId).map((group) => ({
    id: group.id, name: group.code,
  })) : []
  const activePeriods = data?.periods.filter((period) => period.active) ?? []
  const allSubjects = data?.subjects.filter((subject) => subject.program_id === programId) ?? []
  const allGroups = data?.groups.filter((group) => group.subject_id === subjectId) ?? []
  const clearBelowCampus = (id: string) => {
    setCampusId(id); setProgramId(''); setSubjectId(''); setPeriodId(''); setGroupId(''); setEditing(null)
  }
  const clearBelowProgram = (id: string) => {
    setProgramId(id); setSubjectId(''); setGroupId(''); setEditing(null)
  }

  return <section className="academic-management" aria-labelledby="academic-management-title">
    <div><h2 id="academic-management-title" className="institutional-section-title">Gestión académica</h2>
      <p className="academic-help">Campus → carrera → periodo → materia → grupo → docente o alumno. Solo Coordinación crea asignaciones e inscripciones después de aprobar la cuenta.</p></div>
    {loading && <p role="status">Cargando estructura académica…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-note" role="status">{notice}</p>}
    {data && <>
      <div className="academic-campus-grid">
        {data.campuses.filter((campus) => campus.active).map((campus) => <article className="surface academic-campus" key={campus.id}>
          <h3>{campus.name}</h3><ul>{programsForCampus(data, campus.id).map((program) =>
            <li key={program.id}>{program.name}</li>)}</ul>
        </article>)}
      </div>
      <div className="surface academic-workspace">
        <h3>Selecciona la estructura</h3>
        <div className="academic-form-grid">
          <Choice label="Campus" value={campusId} onChange={clearBelowCampus}
            options={data.campuses.filter((campus) => campus.active)} />
          <Choice label="Carrera" value={programId} onChange={clearBelowProgram}
            options={programs} disabled={!campusId} />
          <Choice label="Periodo" value={periodId} onChange={(id) => { setPeriodId(id); setGroupId('') }} options={activePeriods} disabled={!campusId} />
          <Choice label="Materia" value={subjectId} onChange={(id) => { setSubjectId(id); setGroupId('') }}
            options={subjects} disabled={!programId} />
          <Choice label="Grupo" value={groupId} onChange={setGroupId}
            options={groups} disabled={!subjectId || !periodId} />
        </div>
        {campusId && programs.length === 0 && <p role="status">Este campus aún no tiene carreras configuradas.</p>}
        {programId && subjects.length === 0 && <p role="status">Esta carrera aún no tiene materias configuradas.</p>}
        {subjectId && periodId && groups.length === 0 && <p role="status">Esta materia aún no tiene grupos activos en el periodo seleccionado.</p>}
      </div>
      <div className="academic-management-grid">
        <section className="surface academic-workspace" aria-labelledby="academic-subjects">
          <h3 id="academic-subjects">Materias</h3>
          <form onSubmit={(event) => submit(event, editing
            ? { kind: 'subject-update', subjectId: editing.id, name: subjectName, code: subjectCode, active: editing.active }
            : { kind: 'subject-create', programId, name: subjectName, code: subjectCode },
          editing ? 'Materia actualizada.' : 'Materia creada.')} className="academic-form">
            <label className="field"><span>Nombre</span><input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} maxLength={120} required /></label>
            <label className="field"><span>Código</span><input value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} maxLength={40} required /></label>
            <div className="academic-actions"><button className="button button-primary" disabled={busy || !programId}>{editing ? 'Guardar materia' : 'Crear materia'}</button>
              {editing && <button type="button" className="button" onClick={() => { setEditing(null); setSubjectName(''); setSubjectCode('') }}>Cancelar edición</button>}</div>
          </form>
          <ul className="academic-list">{allSubjects.map((subject) => <li key={subject.id}>
            <span>{subject.name} · {subject.code} {subject.active ? '' : '(Inactiva)'}</span>
            <div className="academic-actions"><button type="button" disabled={busy} onClick={() => {
              setEditing(subject); setSubjectName(subject.name); setSubjectCode(subject.code)
            }}>Editar</button><button type="button" disabled={busy} onClick={() => void run({
              kind: 'subject-update', subjectId: subject.id, name: subject.name,
              code: subject.code, active: !subject.active,
            }, subject.active ? 'Materia desactivada.' : 'Materia activada.')}>
              {subject.active ? 'Desactivar' : 'Activar'}</button></div>
          </li>)}</ul>
        </section>
        <section className="surface academic-workspace" aria-labelledby="academic-periods">
          <h3 id="academic-periods">Periodos y grupos</h3>
          <form className="academic-form" onSubmit={(event) => submit(event,
            { kind: 'period', name: periodName, startsAt, endsAt }, 'Periodo creado.')}>
            <label className="field"><span>Nuevo periodo</span><input value={periodName} onChange={(event) => setPeriodName(event.target.value)} maxLength={120} required /></label>
            <div className="academic-form-grid"><label className="field"><span>Inicio</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label>
              <label className="field"><span>Fin</span><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required /></label></div>
            <button className="button" disabled={busy || !startsAt || !endsAt || startsAt >= endsAt}>Crear periodo</button>
          </form>
          <form className="academic-form" onSubmit={(event) => submit(event,
            { kind: 'group-create', subjectId, periodId, code: groupCode }, 'Grupo creado.')}>
            <label className="field"><span>Código del grupo</span><input value={groupCode} onChange={(event) => setGroupCode(event.target.value)} maxLength={40} required /></label>
            <button className="button button-primary" disabled={busy || !subjectId || !periodId}>Crear grupo</button>
          </form>
          <ul className="academic-list">{allGroups.map((group) => <li key={group.id}>
            <span>{group.code} {group.active ? '' : '(Inactivo)'}</span>
            <button type="button" disabled={busy} onClick={() => void run({
              kind: 'group-active', groupId: group.id, active: !group.active,
            }, group.active ? 'Grupo desactivado.' : 'Grupo activado.')}>
              {group.active ? 'Desactivar' : 'Activar'}</button>
          </li>)}</ul>
        </section>
        <section className="surface academic-workspace" aria-labelledby="academic-assign">
          <h3 id="academic-assign">Asignación docente</h3>
          <p>Elige un grupo activo y un docente aprobado de esta institución.</p>
          <form className="academic-form" onSubmit={(event) => submit(event,
            { kind: 'assign', groupId, teacherId }, 'Docente asignado al grupo.')}>
            <Choice label="Docente" value={teacherId} onChange={setTeacherId} options={data.teachers} />
            <button className="button button-primary" disabled={busy || !groupId || !teacherId}>Asignar docente</button>
          </form>
          <p className="academic-count">Asignaciones registradas: {data.assignments.length}</p>
        </section>
        <section className="surface academic-workspace" aria-labelledby="academic-enroll">
          <h3 id="academic-enroll">Inscripción estudiantil</h3>
          <p>Elige un grupo activo y un estudiante aprobado de esta institución.</p>
          <form className="academic-form" onSubmit={(event) => submit(event,
            { kind: 'enroll', groupId, studentId }, 'Estudiante inscrito en el grupo.')}>
            <Choice label="Estudiante" value={studentId} onChange={setStudentId} options={data.students} />
            <button className="button button-primary" disabled={busy || !groupId || !studentId}>Inscribir estudiante</button>
          </form>
          <p className="academic-count">Inscripciones registradas: {data.enrollments.length}</p>
        </section>
      </div>
    </>}
  </section>
}
