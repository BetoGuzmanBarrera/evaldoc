import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function EmailConfirmationPage() {
  const location = useLocation()
  const { session, loading, profile } = useAuth()
  const awaitingEmail = (location.state as { awaitingEmail?: boolean } | null)?.awaitingEmail === true
  const [confirmed, setConfirmed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading || !session) return
    let active = true
    supabase.auth.getUser().then(({ data, error }) => {
      if (active) { setConfirmed(!error && Boolean(data.user?.email_confirmed_at)); setChecking(false) }
    }).catch(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [loading, session])

  return <main className="account-page"><section className="account-card surface" aria-labelledby="email-title">
    <Brand />
    {loading || (session && checking) ? <><h1 id="email-title">Confirmando correo</h1><p role="status">Verificando tu enlace…</p></>
      : confirmed && session ? <><h1 id="email-title">Correo confirmado</h1>
        <p>Tu dirección de correo quedó confirmada. La validación académica de tu cuenta es un paso independiente.</p>
        {profile?.status === 'pending' && <p className="form-note">Tu perfil sigue pendiente de validación institucional.</p>}
        <Link className="button button-primary auth-submit" to={profile?.status === 'pending' ? '/pending' : '/login'}>{profile?.status === 'pending' ? 'Ver estado de mi cuenta' : 'Continuar'}</Link>
      </> : awaitingEmail ? <><h1 id="email-title">Revisa tu correo para confirmar tu cuenta.</h1>
        <p>Abre el enlace enviado a tu correo. Confirmarlo no activa tu perfil académico; tu institución deberá validarlo.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link>
      </> : <><h1 id="email-title">Enlace no válido</h1><p>No pudimos confirmar el correo con este enlace. Puede haber expirado.</p>
        <Link className="button button-outline auth-submit" to="/login">Volver a iniciar sesión</Link></>}
  </section></main>
}
