import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PortalLayout } from './PortalLayout'

export function StudentLayout({ title, subtitle, period, children }: {
  title: string
  subtitle: string
  period?: string
  children: ReactNode
}) {
  const { profile } = useAuth()
  return <PortalLayout
    role="student"
    title={title}
    subtitle={subtitle}
    period={period ?? 'Periodo académico'}
    avatarLabel={profile?.full_name ?? 'Perfil de estudiante'}
  >{children}</PortalLayout>
}
