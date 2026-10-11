import { LoadingSkeleton } from './LoadingSkeleton'

export function InstitutionalFeedback({ loading, error, onRetry }: {
  loading: boolean
  error: 'denied' | 'network' | null
  onRetry: () => void
}) {
  if (loading) return <LoadingSkeleton />
  if (!error) return null
  return <div className="surface institutional-feedback" role="alert">
    <p>{error === 'denied'
      ? 'No tienes acceso a estos datos institucionales.'
      : 'No pudimos cargar los datos institucionales. Revisa tu conexión e inténtalo de nuevo.'}</p>
    {error === 'network' && <button className="button button-outline" type="button" onClick={onRetry}>Reintentar</button>}
  </div>
}
