import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authMessage } from '../src/auth/messages.ts'

function installDom() {
  const scripts = []
  globalThis.window = { setTimeout, clearTimeout }
  globalThis.document = {
    createElement: () => ({ removed: false, remove() { this.removed = true } }),
    head: { append(script) { scripts.push(script) } },
  }
  return scripts
}

test('script oficial: carga diferida, deduplicación y reutilización', async () => {
  const scripts = installDom()
  const { loadTurnstile } = await import('../src/lib/turnstileScript.ts?case=dedupe')
  assert.equal(scripts.length, 0, 'No script before a protected form mounts')
  const first = loadTurnstile()
  const second = loadTurnstile()
  assert.equal(first, second)
  assert.equal(scripts.length, 1)
  assert.equal(scripts[0].src.startsWith('https://challenges.cloudflare.com/turnstile/v0/api.js?'), true)
  assert.equal(scripts[0].src.includes('secret'), false)
  const api = { render() {}, reset() {}, remove() {} }
  window.turnstile = api
  window.evaldocTurnstileLoaded()
  assert.equal(await first, api)
  assert.equal(await loadTurnstile(), api)
  assert.equal(scripts.length, 1)
})

test('error de red libera el script y permite reintento', async () => {
  const scripts = installDom()
  const { loadTurnstile } = await import('../src/lib/turnstileScript.ts?case=network')
  const failed = loadTurnstile()
  scripts[0].onerror()
  await assert.rejects(failed, /Turnstile unavailable/)
  assert.equal(scripts[0].removed, true)
  assert.equal(window.evaldocTurnstileLoaded, undefined)
  const retried = loadTurnstile()
  assert.equal(scripts.length, 2)
  const api = { render() {}, reset() {}, remove() {} }
  window.turnstile = api
  window.evaldocTurnstileLoaded()
  assert.equal(await retried, api)
})

test('callback sin API falla cerrado y se puede volver a cargar', async () => {
  const scripts = installDom()
  const { loadTurnstile } = await import('../src/lib/turnstileScript.ts?case=missing-api')
  const failed = loadTurnstile()
  window.evaldocTurnstileLoaded()
  await assert.rejects(failed, /Turnstile unavailable/)
  assert.equal(scripts[0].removed, true)
  const retried = loadTurnstile()
  assert.equal(scripts.length, 2)
  scripts[1].onerror()
  await assert.rejects(retried, /Turnstile unavailable/)
})

test('error de CAPTCHA oculta detalles internos en login y registro', () => {
  const error = { code: 'captcha_failed', status: 400, message: 'internal server detail' }
  const message = 'No pudimos verificar que eres una persona. Inténtalo de nuevo.'
  assert.equal(authMessage(error, 'login'), message)
  assert.equal(authMessage(error, 'register'), message)
})
