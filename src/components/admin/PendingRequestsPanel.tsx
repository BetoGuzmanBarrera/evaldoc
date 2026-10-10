import { useCallback, useRef, useState } from 'react'
import { InstitutionalFeedback } from '../ui/InstitutionalFeedback'
import { useInstitutionalData } from '../../hooks/useInstitutionalData'
import { decideRegistrationRequest, loadPendingRegistrationRequests } from '../../lib/registrationRequests'

export function PendingRequestsPanel({ onChanged, role }: { onChanged: () => void; role: 'admin' | 'coordinator' }) {
  const loader = useCallback(() => loadPendingRegistrationRequests(), [])
  const requests = useInstitutionalData('institutional-pending-requests:' + role, loader)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const deciding = useRef(false)

  const decide = async (id: string, approve: boolean) => {
    if (deciding.current) return
    deciding.current = true
    setBusyId(id)
    setActionError('')
    try {
      await decideRegistrationRequest(id, approve)
      requests.reload()
      onChanged()
    } catch {
      setActionError('No pudimos resolver la solicitud. Verifica que el correo esté confirmado y vuelve a intentarlo.')
    } finally {
      deciding.current = false
      setBusyId(null)
    }
  }

  return <section className="admin-request-section" aria-labelledby="admin-requests-title">
    <div className="section-between"><h2 className="institutional-section-title" id="admin-requests-title">{role === 'admin' ? 'Solicitudes de coordinación' : 'Solicitudes de estudiantes y docentes'}</h2>
      {requests.data && <strong>{requests.data.length}</strong>}</div>
    <p className="institutional-readonly-note">{role === 'admin' ? 'La aprobación técnica activa únicamente el rol de coordinación.' : 'Aprobar el rol no crea inscripciones ni asignaciones a grupos.'}</p>
    <InstitutionalFeedback loading={requests.loading} error={requests.error} onRetry={requests.reload} />
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {requests.data?.length === 0 && <div className="surface admin-request-empty">No hay solicitudes pendientes en tu institución.</div>}
    {requests.data && requests.data.length > 0 && <div className="admin-request-list">{requests.data.map((request) =>
      <article className="surface admin-request-card" key={request.id}>
        <div><h3>{request.name}</h3><p>{request.email}</p></div>
        <dl>
          <div><dt>Institución</dt><dd>{request.institution}</dd></div>
          <div><dt>Tipo solicitado</dt><dd>{request.requestedRole === 'coordinator' ? 'Coordinador' : request.requestedRole === 'teacher' ? 'Docente' : 'Estudiante'}</dd></div>
          {request.requestedRole !== 'coordinator' && <><div><dt>Programa solicitado</dt><dd>{request.program ?? 'No aplica'}</dd></div>
          <div><dt>Materias solicitadas</dt><dd>{request.subjects.join(', ')}</dd></div></>}
          <div><dt>Estado</dt><dd>Pendiente</dd></div>
        </dl>
        <div className="admin-request-actions">
          <button className="button button-outline" type="button" disabled={busyId !== null} onClick={() => void decide(request.id, false)}>Rechazar</button>
          <button className="button button-primary" type="button" disabled={busyId !== null} onClick={() => void decide(request.id, true)}>{busyId === request.id ? 'Procesando…' : 'Aprobar'}</button>
        </div>
      </article>,
    )}</div>}
  </section>
}
