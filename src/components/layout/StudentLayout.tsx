import type { ReactNode } from 'react'
import { studentDashboard } from '../../data/mock/studentDashboard'
import { PortalLayout } from './PortalLayout'
export function StudentLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <PortalLayout role="student" title={title} subtitle={subtitle} period={studentDashboard.period} avatarLabel="Perfil de Alberto Guzman">{children}</PortalLayout>
}
