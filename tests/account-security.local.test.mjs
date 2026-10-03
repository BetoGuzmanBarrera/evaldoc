import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=')
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')]
}))
const apiUrl = new URL(env.VITE_SUPABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(apiUrl.hostname) && apiUrl.port === '55421', 'Only local EvalDoc Auth may be tested')
const anonKey = env.VITE_SUPABASE_ANON_KEY
assert.ok(anonKey)
const mailpit = 'http://127.0.0.1:55424'
const client = () => createClient(apiUrl.origin, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
const email = `qa.account.${randomUUID()}@example.test`
const identifier = `QA-${randomUUID()}`
const password = `Qa1!${randomBytes(12).toString('hex')}`
const nextPassword = `Qb2@${randomBytes(12).toString('hex')}`
// Official Cloudflare dummy token; accepted only with the ignored local dummy secret.
const captchaToken = 'XXXX.DUMMY.TOKEN.XXXX'

async function mailForUser(previousIds = new Set()) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(`${mailpit}/api/v1/messages`)
    assert.equal(response.status, 200)
    const inbox = await response.json()
    const summary = inbox.messages.find((item) => !previousIds.has(item.ID) && item.To.some((to) => to.Address === email))
    if (summary) return await (await fetch(`${mailpit}/api/v1/message/${encodeURIComponent(summary.ID)}`)).json()
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error('No local Mailpit message arrived')
}

function verifyLink(message) {
  const body = [message.Text ?? '', message.HTML ?? ''].join(' ')
  const raw = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/)?.[0]
  assert.ok(raw, 'Mailpit email must contain an Auth verification link')
  const url = new URL(raw.replaceAll('&amp;', '&'))
  assert.equal(url.port, '55421')
  return url
}

async function sessionFromEmail(message, expectedPath) {
  const verify = await fetch(verifyLink(message), { redirect: 'manual' })
  assert.ok(verify.status >= 300 && verify.status < 400)
  const redirect = new URL(verify.headers.get('location'))
  assert.equal(redirect.origin, 'http://localhost:5173')
  assert.equal(redirect.pathname, expectedPath)
  const hash = new URLSearchParams(redirect.hash.slice(1))
  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')
  assert.ok(access_token && refresh_token)
  const auth = client()
  const result = await auth.auth.setSession({ access_token, refresh_token })
  assert.equal(result.error, null)
  return auth
}

test('Auth local y Mailpit: confirmación, pending y recuperación real', async (t) => {
  const anonymous = client()
  const institutions = await anonymous.from('institutions').select('id').eq('slug', 'ipn').single()
  assert.equal(institutions.error, null)
  const institutionId = institutions.data.id
  await t.test('backend rechaza contraseña débil', async () => {
    const result = await anonymous.auth.signUp({ email: `weak.${email}`, password: 'weakpassword', options: { captchaToken, data: { institution_id: institutionId, full_name: 'QA Weak', institutional_identifier: 'QA-WEAK' } } })
    assert.ok(result.error)
    assert.equal(result.error.code, 'weak_password')
  })
  await t.test('registro válido exige confirmación y envía correo local', async () => {
    const result = await anonymous.auth.signUp({ email, password, options: { captchaToken, emailRedirectTo: 'http://localhost:5173/email-confirmation', data: { institution_id: institutionId, full_name: 'QA Cuenta', institutional_identifier: identifier, role: 'admin' } } })
    assert.equal(result.error, null)
    assert.ok(!result.data.session, 'signup must not establish a session before email confirmation')
    assert.ok(result.data.user?.id)
  })
  await t.test('login antes de confirmar es bloqueado', async () => {
    const result = await anonymous.auth.signInWithPassword({ email, password, options: { captchaToken } })
    assert.equal(result.error?.code, 'email_not_confirmed')
  })
  const confirmation = await mailForUser()
  const confirmedClient = await sessionFromEmail(confirmation, '/email-confirmation')
  await t.test('confirmar correo no activa perfil académico ni concede admin', async () => {
    const user = await confirmedClient.auth.getUser()
    assert.ok(user.data.user?.email_confirmed_at)
    const profile = await confirmedClient.from('profiles').select('status').eq('id', user.data.user.id).single()
    assert.equal(profile.data?.status, 'pending')
    const roles = await confirmedClient.from('user_roles').select('roles(code)').eq('profile_id', user.data.user.id)
    assert.deepEqual(roles.data?.map((item) => item.roles.code), ['student'])
  })
  await t.test('pending no recibe datos académicos', async () => {
    const result = await confirmedClient.rpc('my_student_evaluations')
    assert.equal(result.error, null)
    assert.deepEqual(result.data, [])
  })
  await t.test('una sesión sin recuperación no puede usar el flujo de reset', async () => {
    const fresh = client()
    const result = await fresh.auth.updateUser({ password: nextPassword })
    assert.ok(result.error)
  })
  await t.test('la sesión confirmada sigue siendo válida', async () => {
    const session = await confirmedClient.auth.getSession()
    assert.ok(session.data.session?.user.id)
    const user = await confirmedClient.auth.getUser()
    assert.equal(user.data.user?.id, session.data.session.user.id)
  })
  const before = new Set((await (await fetch(`${mailpit}/api/v1/messages`)).json()).messages.map((item) => item.ID))
  await t.test('correo inexistente obtiene respuesta neutral de Auth', async () => {
    const result = await anonymous.auth.resetPasswordForEmail(`unknown.${email}`, { redirectTo: 'http://localhost:5173/reset-password', captchaToken })
    assert.equal(result.error, null)
  })
  await t.test('recuperación real solicita un email y enlace local', async () => {
    const result = await anonymous.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:5173/reset-password', captchaToken })
    assert.equal(result.error, null)
  })
  const recoveryMessage = await mailForUser(before)
  const recoveryClient = await sessionFromEmail(recoveryMessage, '/reset-password')
  await t.test('backend rechaza una contraseña débil durante reset', async () => {
    const result = await recoveryClient.auth.updateUser({ password: 'weakpassword' })
    assert.equal(result.error?.code, 'weak_password')
  })
  await t.test('token válido permite updateUser con nueva contraseña', async () => {
    const result = await recoveryClient.auth.updateUser({ password: nextPassword })
    assert.equal(result.error, null)
  })
  await t.test('logout posterior a recuperación funciona', async () => {
    const result = await recoveryClient.auth.signOut()
    assert.equal(result.error, null)
    assert.ok(!(await recoveryClient.auth.getSession()).data.session, 'signOut must clear the session')
  })
  await t.test('contraseña anterior deja de funcionar', async () => {
    const result = await anonymous.auth.signInWithPassword({ email, password, options: { captchaToken } })
    assert.ok(result.error)
  })
  await t.test('contraseña nueva permite login y perfil sigue pending', async () => {
    const result = await anonymous.auth.signInWithPassword({ email, password: nextPassword, options: { captchaToken } })
    assert.equal(result.error, null)
    const profile = await anonymous.from('profiles').select('status').eq('id', result.data.user.id).single()
    assert.equal(profile.data?.status, 'pending')
    await anonymous.auth.signOut()
  })
})
