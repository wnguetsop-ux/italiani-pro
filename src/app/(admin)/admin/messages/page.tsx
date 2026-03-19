'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { Send, Eye, Search, MessageCircle, Loader2, RefreshCw } from 'lucide-react'
import { relative_time, initiales } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminMessages() {
  const [convs, setConvs]     = useState<any[]>([])
  const [selected, setSelected] = useState<any|null>(null)
  const [msgs, setMsgs]       = useState<any[]>([])
  const [reply, setReply]     = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch]   = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Charger les conversations UNE SEULE FOIS
  const loadConvs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'conversations'))
      const list: any[] = []
      await Promise.all(snap.docs.map(async c => {
        const uid = c.data().uid
        if (!uid) return
        const uSnap = await getDocs(query(collection(db, 'users'), where('uid','==',uid)))
        const u = uSnap.empty ? null : uSnap.docs[0].data()
        // Dernier message
        const msgsSnap = await getDocs(
          query(collection(db, 'conversations', c.id, 'messages'), where('interne','==',false), orderBy('created_at','desc'))
        )
        const lastMsg = msgsSnap.empty ? null : msgsSnap.docs[0].data()
        list.push({ id:c.id, uid, full_name:u?.full_name||'—', email:u?.email||'', lastMsg, msgCount: msgsSnap.size })
      }))
      list.sort((a,b) => (b.lastMsg?.created_at?.seconds??0)-(a.lastMsg?.created_at?.seconds??0))
      setConvs(list)
    } catch (e) {
      console.error('loadConvs error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadConvs() }, [loadConvs])

  // Ouvrir une conversation
  const openConv = useCallback(async (conv: any) => {
    if (loadingMsgs) return
    setSelected(conv)
    setLoadingMsgs(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'conversations', conv.id, 'messages'),
          where('interne','==',false),
          orderBy('created_at','asc')
        )
      )
      setMsgs(snap.docs.map(d => ({ id:d.id, ...d.data() })))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    } catch (e) {
      console.error('openConv error:', e)
    } finally {
      setLoadingMsgs(false)
    }
  }, [loadingMsgs])

  const send = useCallback(async () => {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    const tempReply = reply.trim()
    setReply('')
    try {
      await addDoc(collection(db, 'conversations', selected.id, 'messages'), {
        uid: selected.uid, convId: selected.id,
        expediteur: 'admin', nom_expediteur: 'Équipe ItalianiPro',
        contenu: tempReply, interne: false, approuve: true,
        lu_par: [], created_at: serverTimestamp(),
      })
      // Notification
      await addDoc(collection(db, 'notifications'), {
        uid: selected.uid, type: 'message',
        title: 'Nouveau message', body: tempReply.slice(0,80),
        lu: false, created_at: serverTimestamp(),
      })
      // Recharger les messages
      await openConv(selected)
      toast.success('✅ Message envoyé')
    } catch (e) {
      console.error('send error:', e)
      toast.error('Erreur envoi')
      setReply(tempReply)
    } finally {
      setSending(false)
    }
  }, [reply, selected, sending, openConv])

  const filtered = convs.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement des conversations...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 3px' }}>Messages</h1>
          <p style={{ color:'#6B7280', fontSize:'13px', margin:0 }}>{convs.length} conversation{convs.length>1?'s':''}</p>
        </div>
        <button onClick={loadConvs} className="btn btn-secondary btn-icon btn-sm"><RefreshCw size={15} /></button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected?'280px 1fr':'1fr', gap:'12px', minHeight:'500px' }}>

        {/* Liste */}
        <div className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #F0F2F5' }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ paddingLeft:'28px', fontSize:'13px', padding:'8px 10px 8px 28px' }} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>
                {convs.length === 0 ? 'Aucun message de candidat' : 'Aucun résultat'}
              </div>
            ) : filtered.map(conv => (
              <button key={conv.id} onClick={() => openConv(conv)} style={{
                width:'100%', padding:'12px 14px', background: selected?.id===conv.id?'#EBF0FF':'transparent',
                border:'none', borderBottom:'1px solid #F9FAFB', cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                transition:'background 0.1s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: selected?.id===conv.id?'#1B3A6B':'#E9ECF0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'12px', color: selected?.id===conv.id?'white':'#6B7280', flexShrink:0 }}>
                    {initiales(conv.full_name)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:'600', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: selected?.id===conv.id?'#1B3A6B':'#111827' }}>
                      {conv.full_name}
                    </div>
                    {conv.lastMsg && (
                      <div style={{ fontSize:'11px', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {conv.lastMsg.contenu?.slice(0,35)}...
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize:'11px', color:'#9CA3AF', flexShrink:0 }}>{conv.msgCount}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        {selected ? (
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'10px', borderBottom:'1px solid #F0F2F5' }}>
              <div style={{ fontWeight:'700', fontSize:'15px' }}>{selected.full_name}</div>
              <Link href={`/admin/candidats/${selected.uid}`} className="btn btn-secondary btn-sm">
                <Eye size={13} /> Voir dossier
              </Link>
            </div>

            {loadingMsgs ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', color:'#6B7280', padding:'40px' }}>
                <span className="spinner" /> Chargement...
              </div>
            ) : (
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', minHeight:'200px', maxHeight:'400px' }}>
                {msgs.length === 0 ? (
                  <div style={{ padding:'24px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>
                    Aucun message dans cette conversation.
                  </div>
                ) : msgs.map(msg => {
                  const isAdmin = msg.expediteur === 'admin' || msg.expediteur === 'ia'
                  return (
                    <div key={msg.id} style={{ display:'flex', gap:'8px', flexDirection: isAdmin?'row-reverse':'row', alignItems:'flex-end' }}>
                      <div style={{ width:'26px', height:'26px', borderRadius:'50%', background: isAdmin?'#1B3A6B':'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', color: isAdmin?'white':'#6B7280', flexShrink:0 }}>
                        {isAdmin ? 'IP' : 'C'}
                      </div>
                      <div style={{ maxWidth:'72%' }}>
                        <div style={{ padding:'9px 12px', borderRadius: isAdmin?'12px 12px 3px 12px':'12px 12px 12px 3px', background: isAdmin?'#1B3A6B':'#F3F4F6', color: isAdmin?'white':'#111827', fontSize:'13.5px', lineHeight:'1.6' }}>
                          {msg.contenu}
                        </div>
                        <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px', textAlign: isAdmin?'right':'left' }}>
                          {msg.nom_expediteur} · {relative_time(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Zone réponse */}
            <div style={{ display:'flex', gap:'8px', alignItems:'flex-end', borderTop:'1px solid #F0F2F5', paddingTop:'10px' }}>
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder="Répondre au candidat... (Entrée pour envoyer)"
                rows={2}
                style={{ flex:1, border:'1.5px solid #E4E8EF', borderRadius:'10px', resize:'none', fontSize:'14px', padding:'9px 12px', fontFamily:'inherit', outline:'none', lineHeight:'1.5' }}
              />
              <button onClick={send} disabled={!reply.trim()||sending}
                style={{ width:'40px', height:'40px', borderRadius:'10px', background: !reply.trim()||sending?'#E4E8EF':'#1B3A6B', border:'none', cursor: !reply.trim()||sending?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {sending ? <Loader2 size={15} color="white" style={{ animation:'spin 0.7s linear infinite' }} /> : <Send size={15} color={!reply.trim()||sending?'#9CA3AF':'white'} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center', color:'#9CA3AF' }}>
              <MessageCircle size={32} style={{ marginBottom:'10px' }} />
              <p style={{ fontSize:'13px' }}>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
