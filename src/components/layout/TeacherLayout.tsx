import type { ReactNode } from 'react'
import { teacherDashboard } from '../../data/mock/teacherDashboard'
import { PortalLayout } from './PortalLayout'
import type { TeacherNav } from './AppSidebar'

export function TeacherLayout({ active, title, subtitle, actions, children }: { active: TeacherNav; title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  return <PortalLayout role="teacher" active={active} title={title} subtitle={subtitle} period={teacherDashboard.period} avatarLabel={`Perfil de ${teacherDashboard.name}`} actions={actions}>{children}</PortalLayout>
}
