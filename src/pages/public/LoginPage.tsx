import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homeForIdentity } from '../../auth/types'
import { authMessage } from '../../auth/messages'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const { session, profile, roles, loading, error: identityError, signOut } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session && !loading && profile && roles.length > 0) {
      navigate(homeForIdentity(profile, roles), { replace: true })
    }
  }, [session, profile, roles, loading, navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(authMessage(signInError, 'login'))
    } catch {
      setError('No pudimos conectar con el servicio. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="login-page"><div className="login-layout">
    <section className="login-brand-panel"><Brand inverse /><div><h1>Evaluaciones confiables.<br />Decisiones que mejoran la educación.</h1><p>Información protegida · Evaluación anónima · Resultados agregados</p></div></section>
    <section className="login-card surface" aria-labelledby="login-title">
      <div className="auth-mobile-brand"><Brand /></div>
      <h2 id="login-title">Iniciar sesión</h2>
      <p className="auth-subtitle">Accede con tus credenciales institucionales</p>
      <form onSubmit={(event) => void onSubmit(event)}>
        <label className="field"><span>Correo institucional</span><input type="email" name="email" autoComplete="username" placeholder="alberto@institucion.edu.mx" required /></label>
        <label className="field"><span>Contraseña</span><input type="password" name="password" autoComplete="current-password" placeholder="••••••••" required /></label>
        <div className="login-options"><span className="check-label">La sesión se mantiene en este dispositivo</span><button className="text-button" type="button" onClick={() => setMessage('La recuperación de contraseña estará disponible en una próxima versión.')}>¿Olvidaste tu contraseña?</button></div>
        {(error || identityError) && <p className="form-error" role="alert">{error || identityError}</p>}
        {identityError && <button className="text-button" type="button" onClick={async () => {
          try { await signOut(); setError('') }
          catch { setError('No se pudo cerrar la sesión. Inténtalo de nuevo.') }
        }}>Cerrar sesión y reintentar</button>}
        {message && <p className="form-note" role="status">{message}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting || loading}>{submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
      </form>
      <div className="auth-separator"><span>o</span></div>
      <button className="button button-outline google-button" type="button" onClick={() => setMessage('El acceso con Google estará disponible en una próxima versión.')}>Continuar con Google</button>
      <p className="register-prompt">¿No tienes cuenta? <Link to="/register">Registrarse</Link></p>
    </section>
  </div></main>
}
