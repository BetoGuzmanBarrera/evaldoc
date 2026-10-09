import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { consumeRecoveryRedirect, supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import { isRoleCode, type AuthProfile, type AuthState, type RoleCode } from './types'

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  error: null,
}

async function fetchIdentity(userId: string): Promise<{ profile: AuthProfile; roles: RoleCode[] }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,institution_id,full_name,institutional_email,institutional_identifier,status')
    .eq('id', userId)
    .single()
  if (profileError || !profile) throw new Error('No se pudo cargar el perfil.')

  const [
    { data: memberships, error: membershipError },
    { data: institution, error: institutionError },
  ] = await Promise.all([
    supabase.from('user_roles').select('role_id').eq('profile_id', userId),
    supabase.from('institutions').select('name,short_name').eq('id', profile.institution_id).single(),
  ])
  if (membershipError || !memberships) throw new Error('No se pudieron cargar los roles.')
  if (institutionError || !institution) throw new Error('No se pudo cargar la institución.')

  const roleIds = [...new Set(memberships.map((membership) => membership.role_id))]
  const { data: roleRows, error: rolesError } = roleIds.length
    ? await supabase.from('roles').select('id,code').in('id', roleIds)
    : { data: [], error: null }
  if (rolesError || !roleRows) throw new Error('No se pudieron cargar los roles.')

  const roles = roleRows.map((role) => role.code).filter(isRoleCode)
  if (roles.length === 0 && profile.status === 'active') throw new Error('La cuenta no tiene un rol disponible.')
  return { profile: { ...profile, institution_short_name: institution.short_name, institution_name: institution.name } as AuthProfile, roles }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null)
  const recoveryAccessToken = useRef<string | null>(null)
  const requestVersion = useRef(0)
  const loadedUserId = useRef<string | null>(null)

  const loadIdentity = useCallback(async (nextSession: Session | null) => {
    const request = ++requestVersion.current
    if (!nextSession) {
      loadedUserId.current = null
      setState({ ...initialState, loading: false })
      return
    }
    setState((current) => ({
      ...current,
      user: nextSession.user,
      session: nextSession,
      profile: null,
      roles: [],
      loading: true,
      error: null,
    }))
    try {
      const identity = await fetchIdentity(nextSession.user.id)
      if (request !== requestVersion.current) return
      loadedUserId.current = nextSession.user.id
      setState({
        user: nextSession.user,
        session: nextSession,
        profile: identity.profile,
        roles: identity.roles,
        loading: false,
        error: null,
      })
    } catch {
      if (request !== requestVersion.current) return
      loadedUserId.current = null
      setState({
        user: nextSession.user,
        session: nextSession,
        profile: null,
        roles: [],
        loading: false,
        error: 'No pudimos cargar tu perfil y roles. Inténtalo de nuevo.',
      })
    }
  }, [])

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recoveryAccessToken.current = nextSession.access_token
        setRecoveryUserId(nextSession.user.id)
      } else if (event === 'INITIAL_SESSION' && nextSession && consumeRecoveryRedirect(nextSession)) {
        recoveryAccessToken.current = nextSession.access_token
        setRecoveryUserId(nextSession.user.id)
      } else if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && recoveryAccessToken.current !== nextSession?.access_token)) {
        recoveryAccessToken.current = null
        setRecoveryUserId(null)
      } else if (event === 'TOKEN_REFRESHED' && recoveryAccessToken.current && nextSession) {
        recoveryAccessToken.current = nextSession.access_token
      }
      if (event === 'TOKEN_REFRESHED' && nextSession?.user.id === loadedUserId.current) {
        setState((current) => ({ ...current, user: nextSession.user, session: nextSession }))
        return
      }
      // Supabase advises against calling its async APIs inside this callback.
      const timer = setTimeout(() => {
        timers.delete(timer)
        void loadIdentity(nextSession)
      }, 0)
      timers.add(timer)
    })
    return () => {
      requestVersion.current += 1
      for (const timer of timers) clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [loadIdentity])

  const refreshIdentity = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setState((current) => ({ ...current, loading: false, error: 'No se pudo recuperar la sesión.' }))
      return
    }
    await loadIdentity(data.session)
  }, [loadIdentity])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error('No se pudo cerrar la sesión.')
  }, [])

  return <AuthContext.Provider value={{ ...state, recoveryUserId, signOut, refreshIdentity }}>
    {children}
  </AuthContext.Provider>
}
