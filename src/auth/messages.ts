import type { AuthError } from '@supabase/supabase-js'

export function authMessage(error: AuthError, action: 'login' | 'register'): string {
  const code = error.code ?? ''
  if (code === 'invalid_credentials' || code === 'invalid_login_credentials') {
    return 'Correo o contraseña incorrectos.'
  }
  if (code === 'email_not_confirmed') {
    return 'Confirma tu correo antes de iniciar sesión.'
  }
  if (code === 'user_already_exists' || code === 'email_exists') {
    return 'Ya existe una cuenta con ese correo.'
  }
  if (code === 'weak_password') {
    return 'Usa una contraseña más segura.'
  }
  if (code === 'captcha_failed') {
    return 'No pudimos verificar que eres una persona. Inténtalo de nuevo.'
  }
  if (error.status === 0 || (error.status !== undefined && error.status >= 500)) {
    return 'No pudimos conectar con el servicio. Inténtalo de nuevo.'
  }
  return action === 'login'
    ? 'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.'
    : 'No pudimos crear la cuenta. Revisa tus datos e inténtalo de nuevo.'
}
