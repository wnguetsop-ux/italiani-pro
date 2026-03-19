'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, FileText, CheckSquare, Activity, Briefcase,
  Bell, LogOut, Menu, X, MessageCircle, Calendar,
  CreditCard, BookOpen, Settings, ChevronRight, HelpCircle, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Mon espace'        },
  { href: '/profile',      icon: Shield,          label: 'Mon profil'        },
  { href: '/documents',    icon: FileText,        label: 'Documents'         },
  { href: '/checklist',    icon: CheckSquare,     label: 'Checklist'         },
  { href: '/timeline',     icon: Activity,        label: 'Mon parcours'      },
  { href: '/flussi',       icon: Calendar,        label: 'Calendrier Flussi' },
  { href: '/payments',     icon: CreditCard,      label: 'Paiements'         },
  { href: '/messages',     icon: MessageCircle,   label: 'Messages'          },
  { href: '/support',      icon: HelpCircle,      label: 'Support'           },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 w-64 transition-transform duration-300 shadow-sm',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-auto'
      )}>
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
              <span className="text-gold-400 font-bold text-sm">IP</span>
            </div>
            <span className="font-bold text-navy-900">
              Italiani<span className="text-gold-500">Pro</span>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-gray-400"><X size={18} /></button>
        </div>

        {/* Disclaimer mini */}
        <div className="mx-3 my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-700 leading-relaxed">
          ⚠️ Aucune garantie d'emploi, de visa ou de nulla osta n'est offerte par ItalianiPro.
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={cn('nav-item text-gray-500', active ? 'active' : 'hover:bg-gray-50 hover:text-navy-800')}>
                <item.icon size={17} />
                <span>{item.label}</span>
                {active && <ChevronRight size={12} className="ml-auto text-gold-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-sm font-bold">
              MT
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">Marie Tchouaffe</div>
              <div className="text-xs text-gray-400">Candidat · Pack Premium</div>
            </div>
          </div>
          <button onClick={logoutUser}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition">
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 sticky top-0 z-30 shadow-sm gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500"><Menu size={20} /></button>
          <div className="flex-1" />
          <Link href="/messages" className="relative text-gray-500 hover:text-navy-700 transition">
            <MessageCircle size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">2</span>
          </Link>
          <button className="relative text-gray-500 hover:text-navy-700 transition">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-navy-700 text-white text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-sm font-bold cursor-pointer">MT</div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
