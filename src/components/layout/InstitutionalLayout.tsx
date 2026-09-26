import type { ReactNode } from 'react'
import { PortalLayout } from './PortalLayout'
import type { PortalNav, PortalRole } from './AppSidebar'

export function InstitutionalLayout({ role, active = 'home', title, subtitle, period, actions, children }: {
  role: Extract<PortalRole, 'coordinator' | 'hr' | 'admin'>
  active?: PortalNav
  title: string
  subtitle: string
  period: string
  actions?: ReactNode
  children: ReactNode
}) {
  return <PortalLayout role={role} active={active} title={title} subtitle={subtitle} period={period} avatarLabel="Perfil institucional" actions={actions}>{children}</PortalLayout>
}
