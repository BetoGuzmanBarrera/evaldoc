import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { meetsPasswordPolicy, passwordsMatch } from '../../auth/passwordPolicy'
import { Brand } from '../../components/ui/Brand'
import { PasswordField } from '../../components/ui/PasswordField'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading, recoveryUserId, signOut } = useAuth()
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const mismatch = confirmation.length > 0 && !passwordsMatch(password, confirmation)
  const ready = meetsPasswordPolicy(password) && passwordsMatch(password, confirmation)

  useEffect(() => {
    if (loading) return
    if (!session || recoveryUserId !== session.user.id) return
    let active = true
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (active) { setVerified(!userError && data.user?.id === recoveryUserId); setVerifying(false) }
    }).catch(() => { if (active) setVerifying(false) })
    return () => { active = false }
  }, [loading, session, recoveryUserId])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !verified || !session || session.user.id !== recoveryUserId) return
    if (!ready) { setError('Revisa los requisitos y confirma la nueva contraseña.'); return }
    setError('')
    setSubmitting(true)
    try {
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError || data.user?.id !== recoveryUserId) { setVerified(false); setError('El enlace ya no es válido. Solicita uno nuevo.'); return }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) { setError(updateError.code === 'weak_password' ? 'La contraseña no cumple la política de seguridad.' : 'No pudimos actualizar la contraseña. Solicita un enlace nuevo.'); return }
      setPassword('')
      setConfirmation('')
      await signOut()
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch {
      setError('No pudimos completar el cambio. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="account-page"><section className="account-card surface" aria-labelledby="reset-title">
    <Brand /><h1 id="reset-title">Nueva contraseña</h1>
    {loading || (session && recoveryUserId === session.user.id && verifying) ? <p role="status">Verificando enlace…</p>
      : !verified || !session || recoveryUserId !== session.user.id ? <>
        <p className="auth-subtitle">El enlace de recuperación es inválido o ha expirado.</p>
        <Link className="button button-primary auth-submit" to="/forgot-password">Solicitar otro enlace</Link>
      </> : <>
        <p className="auth-subtitle">Elige una contraseña nueva para tu cuenta.</p>
        <form onSubmit={(event) => void onSubmit(event)}>
          <PasswordField label="Nueva contraseña" name="password" value={password} onChange={setPassword} autoComplete="new-password" showRequirements />
          <PasswordField label="Confirmar contraseña" name="confirmPassword" value={confirmation} onChange={setConfirmation} autoComplete="new-password"
            error={mismatch ? 'Las contraseñas no coinciden.' : undefined} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={submitting || !ready}>{submitting ? 'Actualizando…' : 'Actualizar contraseña'}</button>
        </form>
      </>}
    <Link className="account-back-link" to="/login">Volver a iniciar sesión</Link>
  </section></main>
}
