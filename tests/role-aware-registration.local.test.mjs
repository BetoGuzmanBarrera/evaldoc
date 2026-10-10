import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createClient } from '@supabase/supabase-js'

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=')
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')]
}))
const apiUrl = new URL(env.VITE_SUPABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(apiUrl.hostname) && apiUrl.port === '55421', 'Only local EvalDoc Auth may be tested')
const client = () => createClient(apiUrl.origin, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const mailpit = 'http://127.0.0.1:55424'
const captchaToken = 'XXXX.DUMMY.TOKEN.XXXX'
const createdUsers = []

after(() => {
  for (const { id, email } of createdUsers) {
    assert.match(id, /^[0-9a-f-]{36}$/)
    assert.match(email, /^qa\.role16\.[0-9a-f-]+@example\.test$/)
    const sql = "delete from auth.users where id='" + id + "' and email='" + email + "' returning id;"
    const deleted = execFileSync('docker', [
      'exec', 'supabase_db_evaldoc', 'psql', '-X', '-qAt',
      '-U', 'postgres', '-d', 'postgres', '-c', sql,
    ], { encoding: 'utf8' }).trim()
    assert.equal(deleted, id, 'Only the newly created local fixture must be removed')
  }
})


async function confirmedClient(email) {
  let summary
  for (let attempt = 0; attempt < 30; attempt++) {
    const inbox = await (await fetch(`${mailpit}/api/v1/messages`)).json()
    summary = inbox.messages.find((item) => item.To.some((to) => to.Address === email))
    if (summary) break
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  assert.ok(summary, 'Local confirmation email must arrive')
  const message = await (await fetch(`${mailpit}/api/v1/message/${encodeURIComponent(summary.ID)}`)).json()
  const raw = [message.Text ?? '', message.HTML ?? ''].join(' ')
    .match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/)?.[0]
  assert.ok(raw)
  const response = await fetch(new URL(raw.replaceAll('&amp;', '&')), { redirect: 'manual' })
  assert.ok(response.status >= 300 && response.status < 400)
  const redirect = new URL(response.headers.get('location'))
  assert.equal(redirect.pathname, '/email-confirmation')
  const hash = new URLSearchParams(redirect.hash.slice(1))
  const auth = client()
  const session = await auth.auth.setSession({
    access_token: hash.get('access_token'),
    refresh_token: hash.get('refresh_token'),
  })
  assert.equal(session.error, null)
  return auth
}

test('Auth local: estudiante, docente y coordinador solicitan sin recibir roles antes de aprobar', async (t) => {
  const anonymous = client()
  const institution = await anonymous.from('institutions').select('id')
    .eq('slug', 'universidad-anahuac').single()
  assert.equal(institution.error, null)
  const institutionId = institution.data.id
  const programs = await anonymous.from('programs').select('id')
    .eq('institution_id', institutionId).eq('active', true)
  const subjects = await anonymous.from('subjects').select('id')
    .eq('institution_id', institutionId).eq('active', true)
  assert.equal(programs.error, null)
  assert.equal(subjects.error, null)
  assert.ok(programs.data.length > 0 && subjects.data.length > 0)
  const programId = programs.data[0].id
  const subjectId = subjects.data[0].id

  for (const role of ['student', 'teacher', 'coordinator']) {
    await t.test(`solicitud ${role} confirma correo y sigue pending sin roles`, async () => {
      const email = `qa.role16.${randomUUID()}@example.test`
      const metadata = {
        institution_id: institutionId,
        full_name: `QA ${role}`,
        institutional_identifier: `QA16-${randomUUID()}`,
        requested_role: role,
        ...(role !== 'coordinator' ? { requested_subject_ids: [subjectId] } : {}),
        ...(role === 'student' ? { requested_program_id: programId } : {}),
      }
      const signup = await anonymous.auth.signUp({
        email, password: `Qa1!${randomBytes(12).toString('hex')}`,
        options: {
          captchaToken,
          emailRedirectTo: 'http://localhost:5173/email-confirmation',
          data: metadata,
        },
      })
      assert.equal(signup.error, null)
      assert.ok(signup.data.user?.id)
      createdUsers.push({ id: signup.data.user.id, email })
      assert.equal(signup.data.session, null)
      const authenticated = await confirmedClient(email)
      const profile = await authenticated.from('profiles').select('status')
        .eq('id', signup.data.user.id).single()
      assert.equal(profile.data?.status, 'pending')
      const roles = await authenticated.from('user_roles').select('id')
      assert.deepEqual(roles.data, [])
      const request = await authenticated.rpc('my_registration_request')
      assert.equal(request.error, null)
      assert.equal(request.data[0].requested_role, role)
      assert.equal(request.data[0].status, 'pending')
      const denied = await authenticated.rpc('institutional_pending_registration_requests')
      assert.deepEqual(denied.data, [])
      await authenticated.auth.signOut()
    })
  }
})