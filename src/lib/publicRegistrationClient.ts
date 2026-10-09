import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa .env.example.')
}

// Public registration choices must not inherit an existing user's tenant-scoped session.
export const publicRegistrationClient = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'evaldoc-public-registration',
  },
})