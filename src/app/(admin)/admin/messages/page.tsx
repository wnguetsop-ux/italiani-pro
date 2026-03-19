'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, getDoc, doc, onSnapshot } from 'firebase/firestore'
import { MessageCircle, Search, Eye } from 'lucide-react'
import Link from 'next/link'
import { relative_time, initiales } from '@/lib/utils'

export default function AdminMessages() {
  const [convs, setConvs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'conversations'))
      const list: any[] = []
      for (const c of snap.docs) {
        const uid = c.data().uid
        const uSnap = await getDoc(doc(db, 'users', uid))
        const u = uSnap.exists() ? uSnap.data() : {}
        // Dernier message
        const msgsSnap = await getDocs(query(collection(db, 'conversations', c.id, 'messages'), where('interne','==',false), where('approuve','==',true), orderBy('created_at','desc')))
        const lastMsg = msgsSnap.docs[0]?.data()
        const unread = msgsSnap.docs.filter(m => !(m.data().lu_par??[]).includes('admin')).length
        list.push({ id:c.id, uid, full_name:u.full_name??'—', email:u.email??'', last_msg:lastMsg?.contenu??'', last_at:lastMsg?.created_at, unread })
      }
      list.sort((a,b) => (b.last_at?.toMillis?.()??0) - (a.last_at?.toMillis?.()??0))
      setConvs(list)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = convs.filter(c => !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div className="page-header">
        <h1>Messages</h1>
        <p>Toutes les conversations avec les candidats</p>
      </div>
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une conversation..." style={{ paddingLeft:'36px' }}/>
      </div>
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner"/>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon"><MessageCircle size={22} color="#9CA3AF"/></div><h3>Aucune conversation</h3><p>Les conversations apparaissent ici dès qu'un candidat s'inscrit.</p></div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {filtered.map(c => (
            <Link key={c.id} href={`/admin/candidats/${c.uid}`} style={{ textDecoration:'none' }}>
              <div className="card card-hover" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#1B3A6B', fontWeight:'700', fontSize:'14px' }}>
                    {initiales(c.full_name)}
                  </div>
                  {c.unread > 0 && <div style={{ position:'absolute', top:'-3px', right:'-3px', width:'16px', height:'16px', background:'#EF4444', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', color:'white' }}>{c.unread}</div>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontWeight:'600', fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.full_name}</span>
                    <span style={{ fontSize:'11px', color:'#9CA3AF', flexShrink:0 }}>{relative_time(c.last_at)}</span>
                  </div>
                  <div style={{ fontSize:'12.5px', color:'#6B7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>
                    {c.last_msg || 'Aucun message'}
                  </div>
                </div>
                <Eye size={15} color="#9CA3AF" style={{ flexShrink:0 }}/>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
