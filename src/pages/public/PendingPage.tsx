import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import { homeForRoles } from '../../auth/types'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'

export function PendingPage() {
  const { session, profile, roles, loading, error, refreshIdentity, signOut } = useAuth()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setActionError('')
    setSigningOut(true)
    try { await signOut(); navigate('/login', { replace: true }) }
    catch { setActionError('No se pudo cerrar la sesión. Inténtalo de nuevo.'); setSigningOut(false) }
  }

  if (loading) return <main className="simple-state" role="status"><Brand /><p>Cargando tu sesión…</p></main>
  if (!session) return <Navigate to="/login" replace />
  if (error || !profile) {
    return <main className="simple-state"><Brand /><h1>Tu cuenta no está disponible</h1>
      <p>{error ?? 'No pudimos cargar tu perfil.'}</p>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <button className="button button-outline" type="button" onClick={() => void refreshIdentity()}>Reintentar</button>
      <button className="button button-primary" type="button" disabled={signingOut} onClick={() => void handleSignOut()}>Cerrar sesión</button>
    </main>
  }
  if (profile.status !== 'pending') return <Navigate to={homeForRoles(roles)} replace />

  return <main className="pending-page">
    <section className="pending-card surface" aria-labelledby="pending-title">
      <Brand />
      <div className="pending-icon" aria-hidden="true"><Clock3 size={26} /></div>
      <h1 id="pending-title">Tu cuenta está pendiente de validación</h1>
      <p>Tu institución debe validar tu cuenta antes de que puedas acceder a la plataforma.</p>
      <p>Vuelve más tarde o contacta a tu institución si necesitas ayuda.</p>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <button className="button button-primary" type="button" disabled={signingOut} onClick={() => void handleSignOut()}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
    </section>
  </main>
}
