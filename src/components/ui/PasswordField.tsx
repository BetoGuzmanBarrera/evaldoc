import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { passwordRequirements } from '../../auth/passwordPolicy'

export function PasswordField({ label, name, value, onChange, autoComplete, showRequirements = false, error, placeholder }: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  showRequirements?: boolean
  error?: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const requirementsId = `${id}-requirements`
  const errorId = `${id}-error`
  const met = passwordRequirements.filter((requirement) => requirement.test(value)).length

  return <div className="field password-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-control">
      <input id={id} name={name} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete} placeholder={placeholder} required minLength={showRequirements ? 8 : undefined}
        aria-invalid={Boolean(error)} aria-describedby={[showRequirements ? requirementsId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined} />
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={visible} title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
    {showRequirements && <>
      <p className="sr-only" role="status" aria-live="polite">{met} de 5 requisitos de contraseña cumplidos</p>
      <ul id={requirementsId} className="password-requirements" aria-label="Requisitos de contraseña">
        {passwordRequirements.map((requirement) => <li key={requirement.id} className={requirement.test(value) ? 'met' : ''}>
          <span aria-hidden="true">{requirement.test(value) ? '✓' : '○'}</span>
          <span>{requirement.label}</span>
          <span className="sr-only">{requirement.test(value) ? 'cumplido' : 'pendiente'}</span>
        </li>)}
      </ul>
    </>}
    {error && <p id={errorId} className="form-error" role="alert">{error}</p>}
  </div>
}
