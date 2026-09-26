import { useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { institutions } from '../../data/mock/institutions'

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) { setError('Las contraseñas no coinciden.'); return }
    setError('')
    navigate('/student')
  }
  return <div className="register-page"><header className="register-header"><Brand /><Link to="/login">Ya tengo cuenta <span aria-hidden="true">→</span></Link></header><main className="register-wrapper"><section className="register-card surface" aria-labelledby="register-title"><h1 id="register-title">Crear cuenta</h1><p className="auth-subtitle">Únete con tus datos institucionales</p><form onSubmit={onSubmit}><label className="field"><span>Institución</span><select name="institution" required defaultValue=""><option value="" disabled>Selecciona tu institución</option>{institutions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="form-grid"><label className="field"><span>Nombre completo</span><input name="fullName" autoComplete="name" placeholder="Alberto Guzman" required /></label><label className="field"><span>Correo institucional</span><input name="email" type="email" autoComplete="email" placeholder="nombre@institucion.edu.mx" required /></label><label className="field"><span>Número de cuenta / empleado</span><input name="accountNumber" placeholder="20245678" required /></label><label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} required /></label></div><label className="field"><span>Confirmar contraseña</span><input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" minLength={8} required /></label><label className="check-label terms-check"><input type="checkbox" required /> Acepto términos y política de privacidad</label><div className="role-note"><Info size={18} aria-hidden="true" /><span>Los roles administrativos, docentes y de coordinación deben ser validados por la institución.</span></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" type="submit">Registrarse</button></form></section></main></div>
}
