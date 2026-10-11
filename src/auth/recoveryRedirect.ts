export function isRecoveryRedirectSession(hash: string, sessionToken: string): boolean {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''))
  return parameters.get('type') === 'recovery'
    && Boolean(parameters.get('refresh_token'))
    && parameters.get('access_token') === sessionToken
}
