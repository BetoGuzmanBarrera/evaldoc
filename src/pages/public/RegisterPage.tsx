import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authMessage } from '../../auth/messages'
import { meetsPasswordPolicy, passwordsMatch } from '../../auth/passwordPolicy'
import { homeForIdentity } from '../../auth/types'
import { TurnstileWidget, type TurnstileWidgetHandle } from '../../components/security/TurnstileWidget'
import { Brand } from '../../components/ui/Brand'
import { PasswordField } from '../../components/ui/PasswordField'
import { useAuth } from '../../hooks/useAuth'
import { loadRegistrationCatalog, type RegistrationProgram, type RegistrationSubject } from '../../lib/registrationCatalog'
import { availableSubjects, registrationCatalogEmptyMessage, registrationLabels, registrationMetadata, validAcademicSelection, type RequestedRole } from '../../lib/registrationForm'
import { getRegistrationInstitutions, type RegistrationInstitution } from '../../lib/registrationInstitutions'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const { session, profile, roles, loading } = useAuth()
  const [role, setRole] = useState<RequestedRole>('student')
  const [institutionId, setInstitutionId] = useState('')
  const [programId, setProgramId] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [institutions, setInstitutions] = useState<RegistrationInstitution[]>([])
  const [institutionsLoading, setInstitutionsLoading] = useState(true)
  const [institutionsError, setInstitutionsError] = useState('')
  const [programs, setPrograms] = useState<RegistrationProgram[]>([])
  const [subjects, setSubjects] = useState<RegistrationSubject[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<TurnstileWidgetHandle>(null)
  const mismatch = confirmation.length > 0 && !passwordsMatch(password, confirmation)
  const passwordReady = meetsPasswordPolicy(password) && passwordsMatch(password, confirmation)
  const labels = registrationLabels(role)
  const visibleSubjects = availableSubjects(subjects, role, programId)
  const catalogEmptyMessage = registrationCatalogEmptyMessage(role, programs, subjects)
  const academicReady = (role === 'coordinator' || (!catalogLoading && !catalogError))
    && validAcademicSelection(role, institutionId, programId, subjectIds, programs, subjects)

  const changeRole = (nextRole: RequestedRole) => {
    setRole(nextRole)
    setProgramId('')
    setSubjectIds([])
    setPrograms([])
    setSubjects([])
    setCatalogError('')
    setCatalogLoading(Boolean(institutionId) && nextRole !== 'coordinator')
  }

  useEffect(() => {
    let active = true
    getRegistrationInstitutions().then((items) => {
      if (active) {
        setInstitutions(items)
        setInstitutionsLoading(false)
      }
    }).catch(() => {
      if (active) {
        setInstitutionsError('No pudimos cargar las instituciones. Inténtalo de nuevo.')
        setInstitutionsLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!institutionId || role === 'coordinator') return
    let active = true
    loadRegistrationCatalog(institutionId).then((catalog) => {
      if (!active) return
      setPrograms(catalog.programs)
      setSubjects(catalog.subjects)
      setCatalogError('')
      setCatalogLoading(false)
    }).catch(() => {
      if (!active) return
      setPrograms([])
      setSubjects([])
      setCatalogError('No pudimos cargar la oferta académica.')
      setCatalogLoading(false)
    })
    return () => { active = false }
  }, [institutionId, catalogRevision, role])

  useEffect(() => {
    if (session && !loading && profile) {
      navigate(homeForIdentity(profile, roles), { replace: true })
    }
  }, [session, profile, roles, loading, navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const identifier = String(form.get('accountNumber') ?? '').trim()
    setError('')
    setSuccess('')
    if (!institutions.some((item) => item.id === institutionId)) {
      setError('Selecciona una institución válida.')
      return
    }
    if (!academicReady) {
      setError(role === 'coordinator' ? 'Selecciona una institución válida para tu solicitud.' : 'Selecciona un programa y las materias válidas para tu solicitud.')
      return
    }
    if (!passwordReady) {
      setError('Revisa los requisitos y confirma la contraseña.')
      return
    }
    if (!captchaToken) {
      setError('Completa la verificación de seguridad para continuar.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          emailRedirectTo: `${window.location.origin}/email-confirmation`,
          data: registrationMetadata(role, institutionId, fullName, identifier, programId, subjectIds),
        },
      })
      if (signUpError) {
        setError(authMessage(signUpError, 'register'))
      } else if (!data.session) {
        setPassword('')
        setConfirmation('')
        navigate('/email-confirmation', { replace: true, state: { awaitingEmail: true } })
      } else {
        setPassword('')
        setConfirmation('')
        setSuccess('Solicitud creada. Preparando tu sesión…')
      }
    } catch {
      setError('No pudimos conectar con el servicio. Inténtalo de nuevo.')
    } finally {
      captcha.current?.reset()
      setSubmitting(false)
    }
  }

  return <div className="register-page"><header className="register-header"><Brand /><Link to="/login">Ya tengo cuenta <span aria-hidden="true">→</span></Link></header>
    <main className="register-wrapper"><section className="register-card surface" aria-labelledby="register-title">
      <h1 id="register-title">Crear cuenta</h1><p className="auth-subtitle">Solicita acceso con tus datos institucionales</p>
      <form onSubmit={(event) => void onSubmit(event)}>
        <fieldset className="registration-role"><legend>¿Cómo usarás EvalDoc?</legend>
          <label className={role === 'student' ? 'registration-role-option selected' : 'registration-role-option'}>
            <input type="radio" name="requestedRole" value="student" checked={role === 'student'} onChange={() => changeRole('student')} /><span>Estudiante</span>
          </label>
          <label className={role === 'teacher' ? 'registration-role-option selected' : 'registration-role-option'}>
            <input type="radio" name="requestedRole" value="teacher" checked={role === 'teacher'} onChange={() => changeRole('teacher')} /><span>Docente</span>
          </label>
          <label className={role === 'coordinator' ? 'registration-role-option selected' : 'registration-role-option'}>
            <input type="radio" name="requestedRole" value="coordinator" checked={role === 'coordinator'} onChange={() => changeRole('coordinator')} /><span>Coordinador</span>
          </label>
        </fieldset>
        <label className="field"><span>Institución</span><select name="institution" required value={institutionId} disabled={institutionsLoading || institutions.length === 0} onChange={(event) => {
          setInstitutionId(event.target.value); setProgramId(''); setSubjectIds([])
          setPrograms([]); setSubjects([]); setCatalogError(''); setCatalogLoading(role !== 'coordinator')
        }}><option value="" disabled>{institutionsLoading ? 'Cargando instituciones…' : 'Selecciona tu institución'}</option>{institutions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {institutionsError && <p className="form-error" role="alert">{institutionsError} <button className="text-button" type="button" onClick={() => {
          setInstitutionsError('')
          setInstitutionsLoading(true)
          getRegistrationInstitutions().then((items) => { setInstitutions(items); setInstitutionsLoading(false) }).catch(() => { setInstitutionsError('No pudimos cargar las instituciones. Inténtalo de nuevo.'); setInstitutionsLoading(false) })
        }}>Reintentar</button></p>}
        <div className="form-grid">
          <label className="field"><span>Nombre completo</span><input name="fullName" autoComplete="name" placeholder="Nombre y apellidos" maxLength={120} required /></label>
          <label className="field"><span>Correo institucional</span><input name="email" type="email" autoComplete="email" placeholder="nombre@institucion.edu.mx" required /></label>
          <label className="field"><span>{labels.identifier}</span><input name="accountNumber" placeholder={role === 'student' ? 'Número de cuenta' : 'Número de empleado'} maxLength={64} required /></label>
          {role === 'student' && <label className="field"><span>Carrera / programa</span><select value={programId} onChange={(event) => {
            setProgramId(event.target.value); setSubjectIds([])
          }} required disabled={!institutionId || catalogLoading || programs.length === 0}>
            <option value="" disabled>{catalogLoading ? 'Cargando programas…' : 'Selecciona tu programa'}</option>
            {programs.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select></label>}
        </div>
        {role === 'student' && institutionId && !catalogLoading && !catalogError && catalogEmptyMessage && <p className="registration-catalog-empty" role="status">{catalogEmptyMessage}</p>}
        {institutionId && role !== 'coordinator' && !(role === 'student' && !catalogLoading && !catalogError && catalogEmptyMessage) && <fieldset className="registration-subjects" disabled={catalogLoading || (role === 'student' && !programId)}>
          <legend>{labels.subjects} <span>(elige una o varias)</span></legend>
          {catalogLoading ? <p role="status">Cargando materias…</p> : catalogError ? <p role="alert">{catalogError} <button type="button" className="text-button" onClick={() => {
            setCatalogError(''); setCatalogLoading(true); setCatalogRevision((value) => value + 1)
          }}>Reintentar</button></p> : visibleSubjects.length === 0
            ? <p role="status">{catalogEmptyMessage ?? 'No hay materias disponibles para esta selección. Contacta a tu institución.'}</p>
            : <div className="registration-subject-list">{visibleSubjects.map((subject) => <label key={subject.id}>
              <input type="checkbox" checked={subjectIds.includes(subject.id)} onChange={(event) => {
                setSubjectIds((current) => event.target.checked
                  ? [...current, subject.id]
                  : current.filter((id) => id !== subject.id))
              }} /><span>{subject.name} <small>{subject.code}</small></span>
            </label>)}</div>}
        </fieldset>}
        <p className="registration-explanation">{labels.note}</p>
        <PasswordField label="Contraseña" name="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Crea una contraseña segura" showRequirements />
        <PasswordField label="Confirmar contraseña" name="confirmPassword" value={confirmation} onChange={setConfirmation} autoComplete="new-password" placeholder="Repite tu contraseña" error={mismatch ? 'Las contraseñas no coinciden.' : undefined} />
        <label className="check-label terms-check"><input type="checkbox" required /> Acepto términos y política de privacidad</label>
        <div className="role-note"><Info size={18} aria-hidden="true" /><span>Tu selección es una solicitud. El acceso se habilita solo tras la validación de tu institución.</span></div>
        <TurnstileWidget ref={captcha} onTokenChange={setCaptchaToken} />
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="form-note" role="status">{success}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting || institutionsLoading || !academicReady || !passwordReady || !captchaToken}>{submitting ? 'Creando solicitud…' : 'Solicitar cuenta'}</button>
      </form>
    </section></main>
  </div>
}
