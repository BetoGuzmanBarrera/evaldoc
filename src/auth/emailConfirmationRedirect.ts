export type EmailConfirmationRedirect =
  | { kind: 'candidate'; accessToken: string }
  | { kind: 'expired' | 'denied' | 'error' | 'invalid' }

export function parseEmailConfirmationRedirect(search: string, hash: string): EmailConfirmationRedirect {
  const query = new URLSearchParams(search.replace(/^\?/, ''))
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const values = [query, fragment]
  const errorCodes = values.flatMap((params) => [params.get('error_code'), params.get('error')]).filter(Boolean)

  // An Auth error can arrive in either URL part and must outrank any stale session.
  if (errorCodes.includes('otp_expired')) return { kind: 'expired' }
  if (errorCodes.includes('access_denied')) return { kind: 'denied' }
  if (errorCodes.length > 0 || values.some((params) => params.has('error_description'))) return { kind: 'error' }

  const type = fragment.get('type') ?? query.get('type')
  const accessToken = fragment.get('access_token') ?? query.get('access_token')
  const refreshToken = fragment.get('refresh_token') ?? query.get('refresh_token')
  if (type === 'signup' && accessToken && refreshToken) return { kind: 'candidate', accessToken }
  return { kind: 'invalid' }
}

export function isConfirmedEmailRedirect(
  redirect: EmailConfirmationRedirect,
  sessionAccessToken: string | undefined,
  confirmedAt: string | undefined,
): boolean {
  return redirect.kind === 'candidate'
    && Boolean(sessionAccessToken && confirmedAt && redirect.accessToken === sessionAccessToken)
}

export function resolveEmailConfirmationRedirect(
  search: string,
  hash: string,
  locationKey: string,
  initialLocationKey: string,
  initialRedirect: EmailConfirmationRedirect,
): EmailConfirmationRedirect {
  if (search || hash) return parseEmailConfirmationRedirect(search, hash)
  return locationKey === initialLocationKey ? initialRedirect : { kind: 'invalid' }
}
