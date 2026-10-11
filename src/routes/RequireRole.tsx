import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/ui/Brand'
import { homeForRoles, type RoleCode } from '../auth/types'
import { useAuth } from '../hooks/useAuth'

export function RequireRole({ allowed }: { allowed: RoleCode[] }) {
  const { session, profile, roles, loading, error, refreshIdentity, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState('')

  if (loading) return <main className="simple-state" role="status"><Brand /><p>Cargando tu sesión…</p></main>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (profile?.status === 'pending' && !error) return <Navigate to="/pending" replace />
  if (error || !profile || roles.length === 0 || profile.status === 'inactive') {
    return <main className="simple-state"><Brand /><h1>Tu cuenta no está disponible</h1>
      <p>{profile?.status === 'inactive' ? 'Tu cuenta está inactiva. Contacta a tu institución.' : error ?? 'No pudimos cargar tu perfil.'}</p>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <button className="button button-outline" type="button" onClick={() => void refreshIdentity()}>Reintentar</button>
      <button className="button button-primary" type="button" onClick={async () => {
        try { await signOut(); navigate('/login', { replace: true }) }
        catch { setActionError('No se pudo cerrar la sesión. Inténtalo de nuevo.') }
      }}>Cerrar sesión</button>
    </main>
  }
  if (!roles.some((role) => allowed.includes(role))) {
    return <Navigate to={homeForRoles(roles)} replace />
  }
  return <Outlet />
}
