import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isConfirmedEmailRedirect, parseEmailConfirmationRedirect, resolveEmailConfirmationRedirect } from '../src/auth/emailConfirmationRedirect.ts'

test('confirmación válida exige token de la misma sesión y correo confirmado', () => {
  const redirect = parseEmailConfirmationRedirect('', '#type=signup&access_token=valid-token&refresh_token=refresh-token')
  assert.deepEqual(redirect, { kind: 'candidate', accessToken: 'valid-token' })
  assert.equal(isConfirmedEmailRedirect(redirect, 'valid-token', '2026-10-09T00:00:00Z'), true)
  assert.equal(isConfirmedEmailRedirect(redirect, 'another-session', '2026-10-09T00:00:00Z'), false)
  assert.equal(isConfirmedEmailRedirect(redirect, 'valid-token', undefined), false)
})

test('otp_expired prevalece incluso con sesión anterior y token de éxito', () => {
  const redirect = parseEmailConfirmationRedirect(
    '?error=access_denied&error_code=otp_expired&error_description=internal',
    '#type=signup&access_token=stale&refresh_token=refresh',
  )
  assert.deepEqual(redirect, { kind: 'expired' })
  assert.equal(isConfirmedEmailRedirect(redirect, 'stale', '2026-10-09T00:00:00Z'), false)
})

test('access_denied sin expiración tiene estado propio', () => {
  assert.deepEqual(parseEmailConfirmationRedirect('', '#error=access_denied'), { kind: 'denied' })
  assert.deepEqual(parseEmailConfirmationRedirect('?error_code=access_denied', ''), { kind: 'denied' })
})

test('enlace ausente o malformado nunca confirma', () => {
  for (const [search, hash] of [
    ['', ''],
    ['', '#type=signup&access_token=token'],
    ['', '#type=recovery&access_token=token&refresh_token=refresh'],
    ['?type=signup&access_token=token', ''],
  ]) {
    const redirect = parseEmailConfirmationRedirect(search, hash)
    assert.deepEqual(redirect, { kind: 'invalid' })
    assert.equal(isConfirmedEmailRedirect(redirect, 'token', '2026-10-09T00:00:00Z'), false)
  }
})

test('error desconocido y descripción aislada no revelan detalles ni muestran éxito', () => {
  assert.deepEqual(parseEmailConfirmationRedirect('?error=server_failure&error_description=private-token', ''), { kind: 'error' })
  assert.deepEqual(parseEmailConfirmationRedirect('', '#error_description=private-token'), { kind: 'error' })
})

test('el error inicial no contamina una nueva visita desde Registro', () => {
  const expired = { kind: 'expired' }
  assert.deepEqual(resolveEmailConfirmationRedirect('', '', 'initial', 'initial', expired), expired)
  assert.deepEqual(resolveEmailConfirmationRedirect('', '', 'new-route', 'initial', expired), { kind: 'invalid' })
  assert.deepEqual(resolveEmailConfirmationRedirect('?error=access_denied', '', 'new-route', 'initial', expired), { kind: 'denied' })
})
