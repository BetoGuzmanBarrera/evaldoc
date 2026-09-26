import { BarChart3, BookOpen, Building2, ClipboardList, History, House, UserRound, UsersRound, X, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../ui/Brand'

export type PortalRole = 'student' | 'teacher' | 'coordinator' | 'hr' | 'admin'
export type PortalNav = 'home' | 'results' | 'history' | 'institutions'
export type TeacherNav = Extract<PortalNav, 'home' | 'results' | 'history'>

interface InstitutionalNavItem { label: string; icon: LucideIcon; to?: string; active?: PortalNav }

export function AppSidebar({ open, onClose, role, active }: { open: boolean; onClose: () => void; role: PortalRole; active?: PortalNav }) {
  const institutionalItems: InstitutionalNavItem[] = role === 'admin' ? [
    { label: 'Inicio', icon: House, to: '/admin', active: 'home' },
    { label: 'Instituciones', icon: Building2, to: '/institutions', active: 'institutions' },
    { label: 'Coordinación', icon: BarChart3, to: '/coordinator' },
    { label: 'Recursos Humanos', icon: UsersRound, to: '/hr' },
    { label: 'Perfil', icon: UserRound },
  ] : [
    { label: 'Inicio', icon: House, to: role === 'hr' ? '/hr' : '/coordinator', active: 'home' },
    { label: 'Instituciones', icon: Building2, to: '/institutions', active: 'institutions' },
    { label: 'Histórico', icon: History },
    { label: 'Perfil', icon: UserRound },
  ]
  const roleLabel = role === 'teacher' ? 'docente' : role === 'student' ? 'alumno' : role === 'hr' ? 'recursos humanos' : role === 'admin' ? 'administración' : 'coordinación'

  return <>
    {open && <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Cerrar menú" />}
    <aside className={'app-sidebar ' + (open ? 'is-open' : '')} aria-label={role === 'teacher' ? 'Navegación del docente' : role === 'student' ? 'Navegación del alumno' : 'Navegación de ' + roleLabel}>
      <div className="sidebar-top"><Brand inverse /><button className="sidebar-close icon-button" type="button" onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button></div>
      <p className="sidebar-caption">PORTAL INSTITUCIONAL</p>
      {role === 'teacher' ? <nav className="sidebar-nav" aria-label="Secciones del docente">
        <Link to="/teacher" onClick={onClose} className={'sidebar-link ' + (active === 'home' ? 'active' : '')} aria-current={active === 'home' ? 'page' : undefined}><House size={18} aria-hidden="true" /> Inicio</Link>
        <Link to="/teacher/results/1" onClick={onClose} className={'sidebar-link ' + (active === 'results' ? 'active' : '')} aria-current={active === 'results' ? 'page' : undefined}><BarChart3 size={18} aria-hidden="true" /> Mis resultados</Link>
        <Link to="/teacher/history" onClick={onClose} className={'sidebar-link ' + (active === 'history' ? 'active' : '')} aria-current={active === 'history' ? 'page' : undefined}><History size={18} aria-hidden="true" /> Histórico</Link>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><BookOpen size={18} aria-hidden="true" /> Materias</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><UserRound size={18} aria-hidden="true" /> Perfil</span>
      </nav> : role === 'student' ? <nav className="sidebar-nav" aria-label="Secciones del alumno">
        <Link to="/student" onClick={onClose} className="sidebar-link active"><House size={18} aria-hidden="true" /> Inicio</Link>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><BarChart3 size={18} aria-hidden="true" /> Resultados</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><History size={18} aria-hidden="true" /> Histórico</span>
        <span className="sidebar-link sidebar-placeholder" aria-disabled="true"><UserRound size={18} aria-hidden="true" /> Perfil</span>
        <Link to="/student/evaluations" onClick={onClose} className="sidebar-link sidebar-mobile-evaluations"><ClipboardList size={18} aria-hidden="true" /> Mis evaluaciones</Link>
      </nav> : <nav className="sidebar-nav" aria-label={'Secciones de ' + roleLabel}>
        {institutionalItems.map((item) => {
          const Icon = item.icon
          return item.to ? <Link key={item.label} to={item.to} onClick={onClose} className={'sidebar-link ' + (item.active && item.active === active ? 'active' : '')} aria-current={item.active && item.active === active ? 'page' : undefined}><Icon size={18} aria-hidden="true" /> {item.label}</Link>
            : <span key={item.label} className="sidebar-link sidebar-placeholder" aria-disabled="true"><Icon size={18} aria-hidden="true" /> {item.label}</span>
        })}
      </nav>}
    </aside>
  </>
}
