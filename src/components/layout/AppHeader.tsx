import type { ReactNode } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { Brand } from '../ui/Brand'

export function AppHeader({ title, subtitle, period, avatarLabel, actions, onMenuClick }: { title: string; subtitle: string; period: string; avatarLabel: string; actions?: ReactNode; onMenuClick: () => void }) {
  return <header className="app-header">
    <div className="app-mobile-topbar"><Brand /><button className="icon-button" type="button" onClick={onMenuClick} aria-label="Abrir menú"><Menu size={23} /></button></div>
    <button className="mobile-menu icon-button" type="button" onClick={onMenuClick} aria-label="Abrir menú"><Menu size={23} /></button>
    <div className="app-header-copy"><h1>{title}</h1><p>{subtitle}</p></div>
    <div className={`header-actions ${actions ? 'custom-header-actions' : ''}`}>{actions ?? <><span className="period-chip">{period}<ChevronDown size={14} aria-hidden="true" /></span><span className="header-avatar" aria-label={avatarLabel} /></>}</div>
  </header>
}
