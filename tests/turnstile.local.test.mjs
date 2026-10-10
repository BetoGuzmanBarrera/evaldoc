import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createClient } from '@supabase/supabase-js'

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=')
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^["']|["']$/g, '')]
}))
const url = new URL(env.VITE_SUPABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(url.hostname) && url.port === '55421', 'Only local EvalDoc Auth may be tested')
assert.ok(env.VITE_SUPABASE_ANON_KEY)
assert.equal(env.VITE_TURNSTILE_SITE_KEY, '1x00000000000000000000AA', 'Use only the official local test site key')

const auth = createClient(url.origin, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}).auth
const captchaToken = 'XXXX.DUMMY.TOKEN.XXXX'
const email = `qa.turnstile.${randomUUID()}@example.test`
const password = `Qa1!${randomBytes(12).toString('hex')}`

let createdUserId = null
after(() => {
  if (!createdUserId) return
  assert.match(createdUserId, /^[0-9a-f-]{36}$/)
  assert.match(email, /^qa\.turnstile\.[0-9a-f-]+@example\.test$/)
  const sql = "delete from auth.users where id='" + createdUserId
    + "' and email='" + email + "' returning id;"
  const deleted = execFileSync('docker', [
    'exec', 'supabase_db_evaldoc', 'psql', '-X', '-qAt',
    '-U', 'postgres', '-d', 'postgres', '-c', sql,
  ], { encoding: 'utf8' }).trim()
  assert.equal(deleted, createdUserId, 'Only the newly created local fixture must be removed')
})

if (process.env.EVALDOC_EXPECT_CAPTCHA_REJECTION !== '1') test('Supabase Auth local valida Turnstile en los tres flujos públicos', async (t) => {
  const institutions = await createClient(url.origin, env.VITE_SUPABASE_ANON_KEY)
    .from('institutions').select('id').eq('slug', 'ipn').single()
  assert.equal(institutions.error, null)
  const data = { institution_id: institutions.data.id, full_name: 'QA Turnstile', institutional_identifier: `QA-${randomUUID()}` }

  await t.test('registro sin token es rechazado por Auth', async () => {
    const result = await auth.signUp({ email, password, options: { data } })
    assert.equal(result.error?.code, 'captcha_failed')
  })
  await t.test('login sin token es rechazado por Auth', async () => {
    const result = await auth.signInWithPassword({ email, password })
    assert.equal(result.error?.code, 'captcha_failed')
  })
  await t.test('recuperación sin token es rechazada por Auth', async () => {
    const result = await auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:5173/reset-password' })
    assert.equal(result.error?.code, 'captcha_failed')
  })
  await t.test('token de prueba válido permite registro y conserva confirmación de correo', async () => {
    const result = await auth.signUp({ email, password, options: { captchaToken, data } })
    assert.equal(result.error, null)
    assert.ok(result.data.user?.id)
    createdUserId = result.data.user.id
    assert.equal(result.data.session, null)
  })
  await t.test('token de prueba válido pasa CAPTCHA en login; correo aún sin confirmar', async () => {
    const result = await auth.signInWithPassword({ email, password, options: { captchaToken } })
    assert.equal(result.error?.code, 'email_not_confirmed')
  })
  await t.test('token de prueba válido permite respuesta neutral de recuperación', async () => {
    const result = await auth.resetPasswordForEmail(`unknown.${email}`, {
      captchaToken, redirectTo: 'http://localhost:5173/reset-password',
    })
    assert.equal(result.error, null)
  })
})

// Run separately with Cloudflare's official always-fail test secret configured in
// the ignored local .env; the default always-pass test secret cannot reject tokens.
if (process.env.EVALDOC_EXPECT_CAPTCHA_REJECTION === '1') {
  test('Auth rechaza un challenge inválido con la clave oficial de fallo', async () => {
    const result = await auth.signInWithPassword({ email, password, options: { captchaToken } })
    assert.equal(result.error?.code, 'captcha_failed')
  })
}
