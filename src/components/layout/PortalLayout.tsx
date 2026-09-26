import { useState, type ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar, type PortalNav, type PortalRole } from './AppSidebar'

export function PortalLayout({ role, active, title, subtitle, period, avatarLabel, actions, children }: {
  role: PortalRole
  active?: PortalNav
  title: string
  subtitle: string
  period: string
  avatarLabel: string
  actions?: ReactNode
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const shellClass = role === 'teacher' ? 'teacher-shell' : role === 'student' ? '' : 'institutional-shell'
  return <div className={'app-shell ' + shellClass}>
    <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} role={role} active={active} />
    <main className="app-main"><AppHeader title={title} subtitle={subtitle} period={period} avatarLabel={avatarLabel} actions={actions} onMenuClick={() => setMenuOpen(true)} />{children}</main>
  </div>
}
