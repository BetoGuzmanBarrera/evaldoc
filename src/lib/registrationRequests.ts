import { supabase } from './supabase'
import type { RequestedRole } from './registrationForm'

export interface PendingRegistrationRequest {
  id: string
  name: string
  email: string
  institution: string
  requestedRole: RequestedRole
  program: string | null
  subjects: string[]
  status: 'pending'
}

export async function loadOwnRegistrationRequest(): Promise<{
  requestedRole: RequestedRole
  status: 'pending' | 'approved' | 'rejected'
} | null> {
  const { data, error } = await supabase.rpc('my_registration_request')
  if (error) throw new Error('registration_request_unavailable')
  const row = Array.isArray(data) ? data[0] : null
  if (!row) return null
  return { requestedRole: row.requested_role as RequestedRole, status: row.status }
}

export async function loadPendingRegistrationRequests(): Promise<PendingRegistrationRequest[]> {
  const { data, error } = await supabase.rpc('institutional_pending_registration_requests')
  if (error || !Array.isArray(data)) throw new Error('pending_requests_unavailable')
  return data.map((row) => ({
    id: row.request_id as string,
    name: row.full_name as string,
    email: row.institutional_email as string,
    institution: row.institution_name as string,
    requestedRole: row.requested_role as RequestedRole,
    program: row.program_name as string | null,
    subjects: row.subject_names as string[],
    status: row.status as 'pending',
  }))
}

export async function decideRegistrationRequest(id: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('institutional_decide_registration_request', {
    p_request_id: id, p_approve: approve,
  })
  if (error) throw new Error('registration_decision_failed')
}
