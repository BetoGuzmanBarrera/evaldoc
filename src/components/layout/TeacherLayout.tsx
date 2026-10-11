import type { ReactNode } from 'react'
import { PortalLayout } from './PortalLayout'
import type { TeacherNav } from './AppSidebar'
import { useAuth } from '../../hooks/useAuth'

export function TeacherLayout({ active, title, subtitle, period, actions, children }: {
  active: TeacherNav
  title: string
  subtitle: string
  period?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const { profile } = useAuth()
  return <PortalLayout role="teacher" active={active} title={title} subtitle={subtitle}
    period={period ?? 'Periodo académico'}
    avatarLabel={'Perfil de ' + (profile?.full_name ?? 'docente')}
    actions={actions}>{children}</PortalLayout>
}
