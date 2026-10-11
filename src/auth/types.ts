import type { Session, User } from '@supabase/supabase-js'

export type RoleCode = 'student' | 'teacher' | 'coordinator' | 'hr' | 'admin'

export interface AuthProfile {
  id: string
  institution_id: string
  institution_short_name: string
  institution_name: string
  full_name: string
  institutional_email: string
  institutional_identifier: string | null
  status: 'pending' | 'active' | 'inactive'
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: AuthProfile | null
  roles: RoleCode[]
  loading: boolean
  error: string | null
}

export const rolePriority: RoleCode[] = ['admin', 'hr', 'coordinator', 'teacher', 'student']

export const roleHome: Record<RoleCode, string> = {
  admin: '/admin',
  hr: '/hr',
  coordinator: '/coordinator',
  teacher: '/teacher',
  student: '/student',
}

export function isRoleCode(value: string): value is RoleCode {
  return rolePriority.some((role) => role === value)
}

export function homeForRoles(roles: RoleCode[]): string {
  const role = rolePriority.find((candidate) => roles.includes(candidate))
  return role ? roleHome[role] : '/login'
}

export function homeForIdentity(profile: AuthProfile, roles: RoleCode[]): string {
  return profile.status !== 'active' ? '/pending' : homeForRoles(roles)
}
