import { createClient, type Session } from '@supabase/supabase-js'
import { isRecoveryRedirectSession } from '../auth/recoveryRedirect'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa .env.example.')
}

// Auth may consume and remove the URL fragment before React subscribes to its event.
// Keep this evidence only in memory until INITIAL_SESSION is checked.
let recoveryRedirectHash = (() => {
  if (typeof window === 'undefined') return ''
  const hash = window.location.hash
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery' ? hash : ''
})()

export function consumeRecoveryRedirect(session: Session): boolean {
  const matched = isRecoveryRedirectSession(recoveryRedirectHash, session.access_token)
  recoveryRedirectHash = ''
  return matched
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
