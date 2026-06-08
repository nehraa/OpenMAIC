'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  Library,
  Users,
  Play,
  Settings,
  CreditCard,
} from 'lucide-react'

const navItems = [
  { href: '/classes', label: 'Classes', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/quizzes', label: 'Quizzes', icon: BookOpen },
  { href: '/sessions', label: 'Live Sessions', icon: Play },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/usage', label: 'Usage', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="font-bold text-sm">Teacher</h1>
              <p className="text-xs text-muted-foreground">Aidutech</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            Phase 2 MVP
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
