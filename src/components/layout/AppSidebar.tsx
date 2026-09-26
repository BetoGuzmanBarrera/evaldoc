import { BarChart3, BookOpen, ClipboardList, History, House, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../ui/Brand'

export type PortalRole = 'student' | 'teacher'
export type TeacherNav = 'home' | 'results' | 'history'

export function AppSidebar({ open, onClose, role, active }: { open: boolean; onClose: () => void; role: PortalRole; active?: TeacherNav }) {
  return <>
    {open && <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Cerrar menú" />}
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`} aria-label={`Navegación del ${role === 'teacher' ? 'docente' : 'alumno'}`}>
      <div className="sidebar-top"><Brand inverse /><button className="sidebar-close icon-button" type="button" onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button></div>
      <p className="sidebar-caption">PORTAL INSTITUCIONAL</p>
      {role === 'teacher' ? <nav className="sidebar-nav" aria-label="Secciones del docente">
        <Link to="/teacher" onClick={onClose} className={`sidebar-link ${active === 'home' ? 'active' : ''}`} aria-current={active === 'home' ? 'page' : undefined}><House size={18} aria-hidden="true" /> Inicio</Link>
        <Link to="/teacher/results/1" onClick={onClose} className={`sidebar-link ${active === 'results' ? 'active' : ''}`} aria-current={active === 'results' ? 'page' : undefined}><BarChart3 size={18} aria-hidden="true" /> Mis resultados</Link>
        <Link to="/teacher/history" onClick={onClose} className={`sidebar-link ${active === 'history' ? 'active' : ''}`} aria-current={active === 'history' ? 'page' : undefined}><History size={18} aria-hidden="true" /> Histórico</Link>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><BookOpen size={18} aria-hidden="true" /> Materias</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><UserRound size={18} aria-hidden="true" /> Perfil</span>
      </nav> : <nav className="sidebar-nav" aria-label="Secciones del alumno">
        <Link to="/student" onClick={onClose} className="sidebar-link active"><House size={18} aria-hidden="true" /> Inicio</Link>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><BarChart3 size={18} aria-hidden="true" /> Resultados</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><History size={18} aria-hidden="true" /> Histórico</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><UserRound size={18} aria-hidden="true" /> Perfil</span>
        <Link to="/student/evaluations" onClick={onClose} className="sidebar-link sidebar-mobile-evaluations"><ClipboardList size={18} aria-hidden="true" /> Mis evaluaciones</Link>
      </nav>}
    </aside>
  </>
}
