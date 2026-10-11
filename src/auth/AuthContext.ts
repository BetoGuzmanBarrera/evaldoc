import { createContext } from 'react'
import type { AuthState } from './types'

export interface AuthContextValue extends AuthState {
  recoveryUserId: string | null
  signOut: () => Promise<void>
  refreshIdentity: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
