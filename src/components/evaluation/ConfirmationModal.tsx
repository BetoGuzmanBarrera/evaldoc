import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

export function ConfirmationModal({ onCancel, onConfirm, submitting = false }: {
  onCancel: () => void
  onConfirm: () => void
  submitting?: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    return () => { previousFocus?.focus() }
  }, [])

  useEffect(() => {
    if (submitting) dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel()
      if (event.key !== 'Tab') return
      if (submitting) {
        event.preventDefault()
        dialogRef.current?.focus()
      } else if (event.shiftKey && document.activeElement === cancelRef.current) {
        event.preventDefault()
        confirmRef.current?.focus()
      } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
        event.preventDefault()
        cancelRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])

  return <div className="modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !submitting) onCancel()
  }}>
    <div ref={dialogRef} tabIndex={-1} className="confirm-modal surface" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
      <span className="modal-icon"><Send size={23} aria-hidden="true" /></span>
      <h2 id="confirm-title">¿Deseas enviar tu evaluación?</h2>
      <p id="confirm-description">Después de enviarla no podrás modificarla. Verifica tus respuestas antes de continuar.</p>
      <div className="modal-actions">
        <button ref={cancelRef} className="button button-outline" type="button" disabled={submitting} onClick={onCancel}>Cancelar</button>
        <button ref={confirmRef} className="button button-primary" type="button" disabled={submitting} onClick={onConfirm}>
          {submitting ? 'Enviando…' : 'Enviar evaluación'}
        </button>
      </div>
    </div>
  </div>
}
