import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
export function ConfirmationModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancelRef.current?.focus() }, [])
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); if (event.key === 'Tab') { if (event.shiftKey && document.activeElement === cancelRef.current) { event.preventDefault(); confirmRef.current?.focus() } else if (!event.shiftKey && document.activeElement === confirmRef.current) { event.preventDefault(); cancelRef.current?.focus() } } }; document.addEventListener('keydown', onKeyDown); return () => document.removeEventListener('keydown', onKeyDown) }, [onCancel])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><div className="confirm-modal surface" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><span className="modal-icon"><Send size={23} aria-hidden="true" /></span><h2 id="confirm-title">¿Deseas enviar tu evaluación?</h2><p id="confirm-description">Después de enviarla no podrás modificarla. Verifica tus respuestas antes de continuar.</p><div className="modal-actions"><button ref={cancelRef} className="button button-outline" type="button" onClick={onCancel}>Cancelar</button><button ref={confirmRef} className="button button-primary" type="button" onClick={onConfirm}>Enviar evaluación</button></div></div></div>
}
