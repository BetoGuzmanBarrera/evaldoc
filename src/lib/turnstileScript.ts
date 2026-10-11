export interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
    evaldocTurnstileLoaded?: () => void
  }
}

const scriptId = 'evaldoc-turnstile-script'
const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=evaldocTurnstileLoaded&render=explicit'
let scriptPromise: Promise<TurnstileApi> | null = null

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    const fail = () => {
      window.clearTimeout(timeout)
      script.remove()
      scriptPromise = null
      delete window.evaldocTurnstileLoaded
      reject(new Error('Turnstile unavailable'))
    }
    window.evaldocTurnstileLoaded = () => {
      if (!window.turnstile) { fail(); return }
      window.clearTimeout(timeout)
      resolve(window.turnstile)
    }
    const timeout = window.setTimeout(fail, 15000)
    script.id = scriptId
    script.src = scriptUrl
    script.async = true
    script.defer = true
    script.onerror = fail
    document.head.append(script)
  })
  return scriptPromise
}
