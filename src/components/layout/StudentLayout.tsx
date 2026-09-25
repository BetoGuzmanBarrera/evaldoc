import { useState, type ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
export function StudentLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="app-shell"><AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} /><main className="app-main"><AppHeader title={title} subtitle={subtitle} onMenuClick={() => setMenuOpen(true)} />{children}</main></div>
}
