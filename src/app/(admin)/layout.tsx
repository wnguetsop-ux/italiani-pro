'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, MessageCircle, CreditCard, Brain, Menu, X, LogOut, Calendar, ChevronRight, Send } from 'lucide-react'
import { logout } from '@/lib/auth'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

const NAV = [
  { href:'/admin',           icon:LayoutDashboard, label:'Dashboard',  exact:true  },
  { href:'/admin/candidats', icon:Users,           label:'Candidats',  exact:false },
  { href:'/admin/candidatures', icon:Send,         label:'Candidatures', exact:false },
  { href:'/admin/messages',  icon:MessageCircle,   label:'Messages',   exact:false },
  { href:'/admin/paiements', icon:CreditCard,      label:'Paiements',  exact:false },
  { href:'/admin/ia',        icon:Brain,           label:'Agents IA',  exact:false },
  { href:'/admin/flussi',    icon:Calendar,        label:'Calendrier', exact:false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen]       = useState(false)
  const [adminName, setAdminName] = useState('')
  const [nbCandidats, setNbCandidats] = useState(0)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(s => { if (s.exists()) setAdminName(s.data().full_name ?? '') })
    getDocs(collection(db, 'dossiers')).then(s => setNbCandidats(s.size))
  }, [])

  const active = (href: string, exact: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + '/')

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F8F9FC' }}>
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40 }} />}

      <style>{`
        @media(min-width:1024px){
          .adm-aside { transform:translateX(0)!important; position:sticky!important; top:0!important; height:100vh!important; }
          .adm-menu-btn { display:none!important; }
          .adm-close-btn { display:none!important; }
        }
      `}</style>

      <aside className="adm-aside" style={{
        width:'220px', background:'#111827', flexShrink:0,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, bottom:0, left:0, zIndex:50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.25s ease',
      }}>
        <div style={{ padding:'18px 14px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', background:'#D4A017', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ color:'white', fontWeight:'900', fontSize:'13px' }}>IP</span>
          </div>
          <span style={{ fontWeight:'800', fontSize:'15px', color:'white' }}>Italiani<span style={{ color:'#D4A017' }}>Pro</span></span>
          <span style={{ marginLeft:'auto', fontSize:'10px', background:'rgba(212,160,23,0.2)', color:'#D4A017', padding:'2px 7px', borderRadius:'5px', fontWeight:'700' }}>ADMIN</span>
          <button className="adm-close-btn" onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><X size={16}/></button>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
              display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px',
              borderRadius:'9px', marginBottom:'2px', textDecoration:'none', transition:'all 0.12s',
              background: active(item.href,item.exact) ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: active(item.href,item.exact) ? 'white' : '#9CA3AF',
              fontWeight: active(item.href,item.exact) ? '600' : '400', fontSize:'14px',
            }}>
              <item.icon size={16} />
              {item.label}
              {item.href === '/admin/candidats' && nbCandidats > 0 && (
                <span style={{ marginLeft:'auto', background:'rgba(255,255,255,0.12)', color:'#D1D5DB', fontSize:'11px', fontWeight:'700', padding:'1px 7px', borderRadius:'10px' }}>{nbCandidats}</span>
              )}
            </Link>
          ))}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', marginBottom:'4px' }}>
            <div style={{ width:'32px', height:'32px', background:'#D4A017', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'12px', flexShrink:0 }}>
              {adminName ? adminName.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase() : 'A'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:'600', fontSize:'12px', color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{adminName||'Administrateur'}</div>
              <div style={{ fontSize:'10px', color:'#6B7280' }}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'8px', width:'100%', background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'13px', fontWeight:'500' }}>
            <LogOut size={14}/> Déconnexion
          </button>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ background:'white', borderBottom:'1.5px solid #E4E8EF', padding:'0 16px', height:'54px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:30 }}>
          <button className="adm-menu-btn" onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><Menu size={20}/></button>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#9CA3AF' }}>
            <Link href="/admin" style={{ color:'#6B7280', textDecoration:'none', fontWeight:'500' }}>Admin</Link>
            {path !== '/admin' && <><ChevronRight size={13}/><span style={{ color:'#111827', fontWeight:'600' }}>{path.split('/').filter(Boolean).pop()}</span></>}
          </div>
          <Link href="/" style={{ fontSize:'12px', color:'#6B7280', textDecoration:'none' }}>← Site public</Link>
        </header>
        <main style={{ flex:1, padding:'20px 16px', maxWidth:'1100px', width:'100%', margin:'0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
