import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isConfirmedEmailRedirect } from '../../auth/emailConfirmationRedirect'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'
import { emailConfirmationRedirect, supabase } from '../../lib/supabase'

export function EmailConfirmationPage() {
  const location = useLocation()
  const { session, loading, profile } = useAuth()
  const redirect = emailConfirmationRedirect(location.search, location.hash, location.key)
  const awaitingEmail = redirect.kind === 'invalid' && !location.search && !location.hash
    && (location.state as { awaitingEmail?: boolean } | null)?.awaitingEmail === true
  const candidateToken = redirect.kind === 'candidate' ? redirect.accessToken : undefined
  const [confirmed, setConfirmed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!candidateToken || loading || !session || session.access_token !== candidateToken) return
    let active = true
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return
      const user = data.user
      setConfirmed(!error && Boolean(user && user.id === session.user.id
        && isConfirmedEmailRedirect({ kind: 'candidate', accessToken: candidateToken }, session.access_token, user.email_confirmed_at)))
      setChecking(false)
    }).catch(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [loading, session, candidateToken])

  const verifying = redirect.kind === 'candidate' && (loading || (session?.access_token === redirect.accessToken && checking))

  return <main className="account-page"><section className="account-card surface" aria-labelledby="email-title">
    <Brand />
    {redirect.kind === 'expired' ? <><h1 id="email-title">Enlace de confirmación expirado</h1>
        <p role="alert">Este enlace ya no permite confirmar tu correo. Inicia un nuevo proceso de registro si tu cuenta sigue sin confirmar.</p>
        <Link className="button button-primary auth-submit" to="/register">Volver al registro</Link>
        <Link className="account-back-link" to="/login">Volver a iniciar sesión</Link>
      </> : redirect.kind === 'denied' ? <><h1 id="email-title">Acceso al enlace denegado</h1>
        <p role="alert">No pudimos autorizar este enlace de confirmación. Vuelve a iniciar sesión o solicita un nuevo proceso de registro.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link>
      </> : redirect.kind === 'error' ? <><h1 id="email-title">No pudimos confirmar el correo</h1>
        <p role="alert">Ocurrió un problema al verificar el enlace. Inténtalo con un enlace nuevo.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link>
      </> : verifying ? <><h1 id="email-title">Confirmando correo</h1><p role="status">Verificando tu enlace…</p></>
      : redirect.kind === 'candidate' && confirmed && session && session.access_token === redirect.accessToken ? <><h1 id="email-title">Correo confirmado</h1>
        <p>Tu dirección de correo quedó confirmada. La validación académica de tu cuenta es un paso independiente.</p>
        {profile?.status === 'pending' && <p className="form-note">Tu perfil sigue pendiente de validación institucional.</p>}
        <Link className="button button-primary auth-submit" to={profile?.status === 'pending' ? '/pending' : '/login'}>{profile?.status === 'pending' ? 'Ver estado de mi cuenta' : 'Continuar'}</Link>
      </> : awaitingEmail ? <><h1 id="email-title">Revisa tu correo para confirmar tu cuenta.</h1>
        <p>Abre el enlace enviado a tu correo. Confirmarlo no activa tu perfil académico; tu institución deberá validarlo.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link>
      </> : <><h1 id="email-title">Enlace no válido</h1><p role="alert">No pudimos confirmar el correo con este enlace. Solicita uno nuevo.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link></>}
  </section></main>
}
