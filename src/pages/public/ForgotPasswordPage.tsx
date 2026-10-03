import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TurnstileWidget, type TurnstileWidgetHandle } from '../../components/security/TurnstileWidget'
import { Brand } from '../../components/ui/Brand'
import { supabase } from '../../lib/supabase'

const neutralMessage = 'Si existe una cuenta asociada a ese correo, recibirás instrucciones.'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<TurnstileWidgetHandle>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError('')
    if (!captchaToken) {
      setError('Completa la verificación de seguridad para continuar.')
      return
    }
    setSubmitting(true)
    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      })
      if (recoveryError?.code === 'captcha_failed') {
        setError('No pudimos verificar que eres una persona. Inténtalo de nuevo.')
      } else if (recoveryError?.status === 0 || (recoveryError?.status !== undefined && recoveryError.status >= 500)) {
        setError('No pudimos conectar con el servicio. Inténtalo de nuevo.')
      } else {
        setSent(true)
        setEmail('')
      }
    } catch {
      setError('No pudimos conectar con el servicio. Inténtalo de nuevo.')
    } finally {
      captcha.current?.reset()
      setSubmitting(false)
    }
  }

  return <main className="account-page"><section className="account-card surface" aria-labelledby="forgot-title">
    <Brand /><h1 id="forgot-title">Recuperar contraseña</h1>
    <p className="auth-subtitle">Escribe tu correo institucional para solicitar un enlace de recuperación.</p>
    {sent ? <p className="form-note" role="status">{neutralMessage}</p> : <form onSubmit={(event) => void onSubmit(event)}>
      <label className="field"><span>Correo institucional</span><input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <TurnstileWidget ref={captcha} onTokenChange={setCaptchaToken} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={submitting || !captchaToken}>{submitting ? 'Enviando…' : 'Enviar enlace'}</button>
    </form>}
    <Link className="account-back-link" to="/login">Volver a iniciar sesión</Link>
  </section></main>
}
