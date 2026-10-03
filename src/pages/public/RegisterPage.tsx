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
import { getRegistrationInstitutions, type RegistrationInstitution } from '../../lib/registrationInstitutions'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const { session, profile, roles, loading } = useAuth()
  const [institutions, setInstitutions] = useState<RegistrationInstitution[]>([])
  const [institutionsLoading, setInstitutionsLoading] = useState(true)
  const [institutionsError, setInstitutionsError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<TurnstileWidgetHandle>(null)
  const mismatch = confirmation.length > 0 && !passwordsMatch(password, confirmation)
  const passwordReady = meetsPasswordPolicy(password) && passwordsMatch(password, confirmation)

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
    if (session && !loading && profile && roles.length > 0) {
      navigate(homeForIdentity(profile, roles), { replace: true })
    }
  }, [session, profile, roles, loading, navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const institutionId = String(form.get('institution') ?? '')
    const fullName = String(form.get('fullName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const identifier = String(form.get('accountNumber') ?? '').trim()
    setError('')
    setSuccess('')
    if (!institutions.some((item) => item.id === institutionId)) {
      setError('Selecciona una institución válida.')
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
          data: {
            institution_id: institutionId,
            full_name: fullName,
            institutional_identifier: identifier,
          },
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
        setSuccess('Cuenta creada. Preparando tu sesión…')
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
      <h1 id="register-title">Crear cuenta</h1><p className="auth-subtitle">Únete con tus datos institucionales</p>
      <form onSubmit={(event) => void onSubmit(event)}>
        <label className="field"><span>Institución</span><select name="institution" required defaultValue="" disabled={institutionsLoading || institutions.length === 0}><option value="" disabled>{institutionsLoading ? 'Cargando instituciones…' : 'Selecciona tu institución'}</option>{institutions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {institutionsError && <p className="form-error" role="alert">{institutionsError} <button className="text-button" type="button" onClick={() => {
          setInstitutionsError('')
          setInstitutionsLoading(true)
          getRegistrationInstitutions().then((items) => { setInstitutions(items); setInstitutionsLoading(false) }).catch(() => { setInstitutionsError('No pudimos cargar las instituciones. Inténtalo de nuevo.'); setInstitutionsLoading(false) })
        }}>Reintentar</button></p>}
        <div className="form-grid">
          <label className="field"><span>Nombre completo</span><input name="fullName" autoComplete="name" placeholder="Alberto Guzman" maxLength={120} required /></label>
          <label className="field"><span>Correo institucional</span><input name="email" type="email" autoComplete="email" placeholder="nombre@institucion.edu.mx" required /></label>
          <label className="field"><span>Número de cuenta / empleado</span><input name="accountNumber" placeholder="20245678" maxLength={64} required /></label>
          <PasswordField label="Contraseña" name="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Crea una contraseña segura" showRequirements />
        </div>
        <PasswordField label="Confirmar contraseña" name="confirmPassword" value={confirmation} onChange={setConfirmation} autoComplete="new-password" placeholder="Repite tu contraseña" error={mismatch ? 'Las contraseñas no coinciden.' : undefined} />
        <label className="check-label terms-check"><input type="checkbox" required /> Acepto términos y política de privacidad</label>
        <div className="role-note"><Info size={18} aria-hidden="true" /><span>Los roles administrativos, docentes y de coordinación deben ser validados por la institución.</span></div>
        <TurnstileWidget ref={captcha} onTokenChange={setCaptchaToken} />
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="form-note" role="status">{success}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting || institutionsLoading || institutions.length === 0 || !passwordReady || !captchaToken}>{submitting ? 'Creando cuenta…' : 'Registrarse'}</button>
      </form>
    </section></main>
  </div>
}
