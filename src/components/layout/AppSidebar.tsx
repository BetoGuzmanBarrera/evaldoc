import { BarChart3, ClipboardList, History, House, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../ui/Brand'

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <>
    {open && <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Cerrar menú" />}
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`} aria-label="Navegación del alumno">
      <div className="sidebar-top"><Brand inverse /><button className="sidebar-close icon-button" type="button" onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button></div>
      <p className="sidebar-caption">PORTAL INSTITUCIONAL</p>
      <nav className="sidebar-nav">
        <Link to="/student" onClick={onClose} className="sidebar-link active"><House size={18} aria-hidden="true" /> Inicio</Link>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><BarChart3 size={18} aria-hidden="true" /> Resultados</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><History size={18} aria-hidden="true" /> Histórico</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><UserRound size={18} aria-hidden="true" /> Perfil</span>
        <Link to="/student/evaluations" onClick={onClose} className="sidebar-link sidebar-mobile-evaluations"><ClipboardList size={18} aria-hidden="true" /> Mis evaluaciones</Link>
      </nav>
    </aside>
  </>
}
