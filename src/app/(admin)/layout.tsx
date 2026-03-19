'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, GitBranch, BarChart2, DollarSign,
  Settings, Bell, Menu, X, Shield, ChevronRight,
  FileText, Calendar, MessageCircle, Users2, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/lib/auth'

const NAV = [
  { href: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/admin/candidates', icon: Users,           label: 'Candidats'      },
  { href: '/admin/pipeline',   icon: GitBranch,       label: 'Pipeline Kanban'},
  { href: '/admin/finance',    icon: DollarSign,      label: 'Finance'        },
  { href: '/admin/analytics',  icon: BarChart2,       label: 'Analytics'      },
  { href: '/admin/team',       icon: Users2,          label: 'Équipe'         },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-950 text-white w-64 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-auto'
      )}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Shield size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">
              Italiani<span className="text-gold-400">Pro</span>
            </span>
            <span className="ml-1 text-[10px] bg-navy-800 text-gold-400 border border-gold-500/30 px-1.5 py-0.5 rounded-md">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn('nav-item', active ? 'active' : 'text-gray-400')}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {active && <ChevronRight size={13} className="ml-auto text-gold-400" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-gold-400">A</div>
            <div>
              <div className="text-sm font-medium text-white">Admin</div>
              <div className="text-xs text-gray-500">super_admin</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition">
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-sm text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-gray-500 hover:text-navy-700 transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">5</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
