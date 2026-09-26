import { ChevronDown, Menu } from 'lucide-react'
import { studentDashboard } from '../../data/mock/studentDashboard'
import { Brand } from '../ui/Brand'

export function AppHeader({ title, subtitle, onMenuClick }: { title: string; subtitle: string; onMenuClick: () => void }) {
  return <header className="app-header">
    <div className="app-mobile-topbar"><Brand /><button className="icon-button" type="button" onClick={onMenuClick} aria-label="Abrir menú"><Menu size={23} /></button></div>
    <button className="mobile-menu icon-button" type="button" onClick={onMenuClick} aria-label="Abrir menú"><Menu size={23} /></button>
    <div className="app-header-copy"><h1>{title}</h1><p>{subtitle}</p></div>
    <div className="header-actions"><span className="period-chip">{studentDashboard.period}<ChevronDown size={14} aria-hidden="true" /></span><span className="header-avatar" aria-label="Perfil de Alberto Guzman" /></div>
  </header>
}
