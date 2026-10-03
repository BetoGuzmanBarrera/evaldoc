import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { loadTurnstile } from '../../lib/turnstileScript'

export interface TurnstileWidgetHandle {
  reset: () => void
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void
}

type ChallengeStatus = 'loading' | 'ready' | 'complete' | 'expired' | 'error'

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''
const verificationError = 'No pudimos verificar que eres una persona. Inténtalo de nuevo.'

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget({ onTokenChange }, ref) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [status, setStatus] = useState<ChallengeStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  function reset() {
    onTokenChange(null)
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current)
      setStatus('ready')
    } else {
      setStatus('loading')
    }
  }

  useImperativeHandle(ref, () => ({ reset }))

  useEffect(() => {
    if (!siteKey) return
    let active = true
    let renderedId: string | undefined
    loadTurnstile().then((api) => {
      if (!active || !container.current) return
      setStatus('ready')
      renderedId = api.render(container.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        language: 'es',
        retry: 'never',
        'refresh-expired': 'manual',
        'refresh-timeout': 'manual',
        'response-field': false,
        callback: (token: string) => { onTokenChange(token); setStatus('complete') },
        'expired-callback': () => { onTokenChange(null); setStatus('expired') },
        'timeout-callback': () => { onTokenChange(null); setStatus('expired') },
        'error-callback': () => { onTokenChange(null); setStatus('error') },
        'unsupported-callback': () => { onTokenChange(null); setStatus('error') },
      }) ?? undefined
      if (!renderedId) {
        setStatus('error')
        return
      }
      widgetId.current = renderedId
    }).catch(() => {
      if (active) { onTokenChange(null); setStatus('error') }
    })
    return () => {
      active = false
      if (renderedId && window.turnstile) window.turnstile.remove(renderedId)
      if (widgetId.current === renderedId) widgetId.current = null
    }
  }, [attempt, onTokenChange])

  function retry() {
    if (widgetId.current && window.turnstile) reset()
    else { setStatus('loading'); setAttempt((current) => current + 1) }
  }

  return <div className="turnstile-field" role="group" aria-labelledby="turnstile-label">
    <span id="turnstile-label" className="turnstile-label">Verificación de seguridad</span>
    {siteKey && <div ref={container} />}
    <p className={status === 'error' || status === 'expired' || !siteKey ? 'form-error' : 'turnstile-status'} role={status === 'error' || !siteKey ? 'alert' : 'status'}>
      {!siteKey ? 'La verificación de seguridad no está disponible.'
        : status === 'loading' ? 'Cargando verificación…'
          : status === 'ready' ? 'Completa la verificación para continuar.'
            : status === 'complete' ? 'Verificación completada.'
              : status === 'expired' ? 'La verificación expiró. Reintenta la verificación.'
                : verificationError}
    </p>
    {siteKey && (status === 'error' || status === 'expired') && <button className="text-button turnstile-retry" type="button" onClick={retry}>Reintentar verificación</button>}
  </div>
})
