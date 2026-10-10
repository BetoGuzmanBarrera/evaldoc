import assert from 'node:assert/strict'
import { test } from 'node:test'
import { meetsPasswordPolicy, passwordRequirements, passwordsMatch } from '../src/auth/passwordPolicy.ts'
import { authMessage } from '../src/auth/messages.ts'
import { isRecoveryRedirectSession } from '../src/auth/recoveryRedirect.ts'
import { recoveryNeutralMessage } from '../src/auth/recoveryMessages.ts'

test('contraseña sin mayúscula falla', () => assert.equal(meetsPasswordPolicy('segura123!'), false))
test('contraseña sin minúscula falla', () => assert.equal(meetsPasswordPolicy('SEGURA123!'), false))
test('contraseña sin número falla', () => assert.equal(meetsPasswordPolicy('SeguraClave!'), false))
test('contraseña sin símbolo falla', () => assert.equal(meetsPasswordPolicy('Segura1234'), false))
test('contraseña de menos de ocho caracteres falla', () => assert.equal(meetsPasswordPolicy('Aa1!xyz'), false))
test('contraseña válida satisface los cinco requisitos', () => assert.equal(meetsPasswordPolicy('Segura123!'), true))
test('espacio no sustituye al símbolo permitido', () => assert.equal(meetsPasswordPolicy('Segura123 '), false))
test('confirmación distinta falla', () => assert.equal(passwordsMatch('Segura123!', 'Segura123?'), false))
test('confirmación igual pasa y confirmación vacía no pasa', () => {
  assert.equal(passwordsMatch('Segura123!', 'Segura123!'), true)
  assert.equal(passwordsMatch('Segura123!', ''), false)
})
test('el checklist cambia sus estados al escribir', () => {
  assert.deepEqual(passwordRequirements.map((item) => item.test('')), [false, false, false, false, false])
  assert.deepEqual(passwordRequirements.map((item) => item.test('Segura123!')), [true, true, true, true, true])
})
test('el error de credenciales no expone detalles internos', () => assert.equal(authMessage({ code: 'invalid_credentials', status: 400 }, 'login'), 'Correo o contraseña incorrectos.'))
test('correo sin confirmar recibe mensaje específico', () => assert.equal(authMessage({ code: 'email_not_confirmed', status: 400 }, 'login'), 'Confirma tu correo antes de iniciar sesión.'))
test('un error interno de Auth se presenta como fallo de servicio', () => assert.equal(authMessage({ code: 'internal', status: 500 }, 'login'), 'No pudimos conectar con el servicio. Inténtalo de nuevo.'))
test('redirect de recuperación coincide con la sesión recibida', () => {
  assert.equal(isRecoveryRedirectSession('#type=recovery&access_token=demo-token&refresh_token=demo-refresh', 'demo-token'), true)
})
test('una sesión normal o token diferente no habilita reset', () => {
  assert.equal(isRecoveryRedirectSession('#type=signup&access_token=demo-token&refresh_token=demo-refresh', 'demo-token'), false)
  assert.equal(isRecoveryRedirectSession('#type=recovery&access_token=otro-token&refresh_token=demo-refresh', 'demo-token'), false)
  assert.equal(isRecoveryRedirectSession('#type=recovery&access_token=demo-token', 'demo-token'), false)
})

test('recuperación muestra respuesta neutral sin enumerar cuentas', () => {
  assert.equal(recoveryNeutralMessage, 'Si existe una cuenta asociada a ese correo, recibirás instrucciones.')
})
