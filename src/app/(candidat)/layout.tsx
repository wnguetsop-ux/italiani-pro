'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, User, FolderOpen, MessageCircle, CreditCard, Calendar, Menu, X, LogOut, Bell } from 'lucide-react'
import { logout } from '@/lib/auth'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'

const NAV = [
  { href:'/dashboard',          icon:LayoutDashboard, label:'Mon espace'     },
  { href:'/profil',             icon:User,            label:'Mon profil'     },
  { href:'/documents',          icon:FolderOpen,      label:'Documents'      },
  { href:'/messages',           icon:MessageCircle,   label:'Messages'       },
  { href:'/paiements',          icon:CreditCard,      label:'Paiements'      },
  { href:'/flussi',             icon:Calendar,        label:'Calendrier Flussi' },
]

export default function CandidatLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen]         = useState(false)
  const [userName, setUserName] = useState('')
  const [unread, setUnread]     = useState(0)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(s => {
      if (s.exists()) setUserName(s.data().full_name ?? '')
    })
    const unsub = onSnapshot(query(collection(db, 'conversations'), where('uid', '==', uid)), (snapshot) => {
      const total = snapshot.docs.reduce((sum, item) => sum + Number(item.data().unread_candidate_count || 0), 0)
      setUnread(total)
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F8F9FC' }}>

      {/* Overlay mobile */}
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />}

      {/* Sidebar */}
      <aside style={{
        width:'230px', background:'white', borderRight:'1.5px solid #E4E8EF',
        display:'flex', flexDirection:'column', flexShrink:0,
        position:'fixed', top:0, bottom:0, left:0, zIndex:50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.25s ease',
      }}
        className="lg-sidebar"
      >
        <style>{`
          @media (min-width: 1024px) {
            .lg-sidebar { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; }
            .main-content { margin-left: 0 !important; }
          }
        `}</style>

        {/* Logo */}
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #F0F2F5' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', background:'#1B3A6B', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:'#D4A017', fontWeight:'900', fontSize:'13px' }}>IP</span>
            </div>
            <span style={{ fontWeight:'800', fontSize:'16px', color:'#111827' }}>
              Italiani<span style={{ color:'#D4A017' }}>Pro</span>
            </span>
            <button onClick={() => setOpen(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }} className="lg-hide">
              <X size={18} />
            </button>
          </div>
          <style>{`.lg-hide { display:block } @media(min-width:1024px){.lg-hide{display:none}}`}</style>
        </div>

        {/* Disclaimer */}
        <div style={{ margin:'12px', padding:'10px 12px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'9px', fontSize:'11px', color:'#92400E', lineHeight:'1.4' }}>
          ⚠️ Accompagnement documentaire uniquement — Aucune garantie d'emploi ou visa.
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', overflowY:'auto' }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`nav-item ${path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href)) ? 'active' : ''}`}
              style={{ marginBottom:'2px' }}>
              <item.icon size={17} className="icon" />
              {item.label}
              {item.href === '/messages' && unread > 0 && (
                <span style={{ marginLeft:'auto', background:'#EF4444', color:'white', fontSize:'10px', fontWeight:'700', minWidth:'18px', height:'18px', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid #F0F2F5' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', borderRadius:'9px' }}>
            <div style={{ width:'34px', height:'34px', background:'#EBF0FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#1B3A6B', fontWeight:'700', fontSize:'13px', flexShrink:0 }}>
              {userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'M'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:'600', fontSize:'13px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {userName || 'Mon espace'}
              </div>
              <div style={{ fontSize:'11px', color:'#9CA3AF' }}>Candidat</div>
            </div>
          </div>
          <button onClick={logout} className="nav-item" style={{ width:'100%', color:'#EF4444', marginTop:'4px' }}>
            <LogOut size={15} className="icon" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }} className="main-content">
        {/* Header mobile */}
        <header style={{ background:'white', borderBottom:'1.5px solid #E4E8EF', padding:'0 16px', height:'54px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:30 }}>
          <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:'4px' }} className="lg-hide">
            <Menu size={20} />
          </button>
          <span style={{ fontWeight:'700', fontSize:'15px', color:'#111827', flex:1 }}>ItalianiPro</span>
          <Link href="/messages" style={{ position:'relative', color:'#6B7280' }}>
            <Bell size={19} />
            {unread > 0 && <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'8px', height:'8px', background:'#EF4444', borderRadius:'50%' }} />}
          </Link>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:'20px 16px', maxWidth:'900px', width:'100%', margin:'0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
