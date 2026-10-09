import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import { homeForRoles } from '../../auth/types'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'
import { loadOwnRegistrationRequest } from '../../lib/registrationRequests'
import { pendingRequestMessage } from '../../lib/pendingRequestMessage'
import type { RequestedRole } from '../../lib/registrationForm'

export function PendingPage() {
  const { session, profile, roles, loading, error, refreshIdentity, signOut } = useAuth()
  const navigate = useNavigate()
  const [requestedRole, setRequestedRole] = useState<RequestedRole | null>(null)
  const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!session || !profile || profile.status === 'active') return
    let active = true
    loadOwnRegistrationRequest().then((request) => {
      if (!active) return
      setRequestedRole(request?.requestedRole ?? (roles.includes('teacher') ? 'teacher' : 'student'))
      setRequestStatus(request?.status ?? null)
      setRequestLoading(false)
    }).catch(() => {
      if (!active) return
      setRequestedRole(roles.includes('teacher') ? 'teacher' : 'student')
      setRequestLoading(false)
    })
    return () => { active = false }
  }, [session, profile, roles])

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
  if (profile.status === 'active') return <Navigate to={homeForRoles(roles)} replace />
  if (requestLoading) return <main className="simple-state" role="status"><Brand /><p>Cargando tu solicitud…</p></main>
  if (profile.status === 'inactive' && requestStatus !== 'rejected') return <main className="simple-state"><Brand /><h1>Tu cuenta está inactiva</h1><p>Contacta a tu institución para recibir ayuda.</p><button className="button button-primary" type="button" disabled={signingOut} onClick={() => void handleSignOut()}>Cerrar sesión</button></main>

  const rejected = requestStatus === 'rejected'
  const { heading, description } = pendingRequestMessage(requestedRole ?? 'student', rejected, profile.institution_name)

  return <main className="pending-page">
    <section className="pending-card surface" aria-labelledby="pending-title">
      <Brand />
      <div className="pending-icon" aria-hidden="true"><Clock3 size={26} /></div>
      <h1 id="pending-title">{heading}</h1>
      <p>{description}</p>
      {requestStatus === 'pending' && <p>Las materias solicitadas aún no crean inscripciones ni asignaciones a grupos.</p>}
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {!rejected && <button className="button button-outline" type="button" onClick={() => void refreshIdentity()}>Actualizar estado</button>}
      <button className="button button-primary" type="button" disabled={signingOut} onClick={() => void handleSignOut()}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
    </section>
  </main>
}