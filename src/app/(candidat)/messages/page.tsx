'use client'
import { useState, useEffect, useRef } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { Send, Loader2, MessageCircle, Shield } from 'lucide-react'
import { relative_time } from '@/lib/utils'
import { toast } from 'sonner'

interface Msg { id:string; contenu:string; expediteur:string; nom_expediteur:string; created_at:any; approuve:boolean; interne:boolean }

export default function MessagesPage() {
  const [msgs, setMsgs]       = useState<Msg[]>([])
  const [convId, setConvId]   = useState<string|null>(null)
  const [texte, setTexte]     = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const bottomRef             = useRef<HTMLDivElement>(null)
  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    const init = async () => {
      const uSnap = await getDoc(doc(db, 'users', uid))
      if (uSnap.exists()) setUserName(uSnap.data().full_name ?? '')
      const snap = await getDocs(query(collection(db, 'conversations'), where('uid', '==', uid)))
      let cid: string
      if (snap.empty) {
        const ref = await addDoc(collection(db, 'conversations'), { uid, created_at: serverTimestamp() })
        cid = ref.id
      } else { cid = snap.docs[0].id }
      setConvId(cid)
      setLoading(false)
    }
    init()
  }, [uid])

  useEffect(() => {
    if (!convId || !uid) return
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      where('interne', '==', false),
      where('approuve', '==', true),
      orderBy('created_at', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id:d.id, ...d.data() } as Msg)))
      snap.docs.forEach(d => {
        if (!(d.data().lu_par ?? []).includes(uid)) {
          updateDoc(d.ref, { lu_par: arrayUnion(uid) }).catch(() => {})
        }
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    })
    return () => unsub()
  }, [convId, uid])

  async function send() {
    if (!texte.trim() || !convId || !uid || sending) return
    setSending(true)
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        uid, convId, expediteur:'candidat', nom_expediteur: userName||'Moi',
        contenu: texte.trim(), interne:false, approuve:true,
        lu_par:[uid], created_at: serverTimestamp(),
      })
      setTexte('')
    } catch { toast.error('Erreur envoi') } finally { setSending(false) }
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 100px)', gap:'12px' }} className="fade-up">

      {/* Header */}
      <div>
        <h1 style={{ fontSize:'20px', fontWeight:'800' }}>Messages</h1>
        <p style={{ fontSize:'13px', color:'#6B7280', marginTop:'2px' }}>Votre conversation avec l'équipe ItalianiPro</p>
      </div>

      {/* Agent info */}
      <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'38px', height:'38px', background:'#1B3A6B', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'13px', flexShrink:0 }}>IP</div>
        <div>
          <div style={{ fontWeight:'600', fontSize:'14px' }}>Équipe ItalianiPro</div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#059669' }}>
            <div className="dot-green" /> Disponible 24h/24 — 7j/7
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#6B7280', background:'#F9FAFB', padding:'4px 10px', borderRadius:'8px', border:'1px solid #E4E8EF' }}>
          <Shield size={11} /> Messagerie sécurisée
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {msgs.length === 0 ? (
          <div className="empty" style={{ flex:1 }}>
            <div className="empty-icon"><MessageCircle size={24} color="#9CA3AF" /></div>
            <h3>Aucun message</h3>
            <p>Votre équipe prendra contact dès que votre dossier sera pris en charge. Envoyez-nous un message ci-dessous si vous avez une question.</p>
          </div>
        ) : (
          msgs.map(msg => {
            const isMe = msg.expediteur === 'candidat'
            const isAI = msg.expediteur === 'ia'
            return (
              <div key={msg.id} style={{ display:'flex', gap:'10px', flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end' }}>
                {!isMe && (
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'11px',
                    background: isAI?'#F5F3FF':'#EBF0FF', color: isAI?'#7C3AED':'#1B3A6B' }}>
                    {isAI ? '🤖' : 'IP'}
                  </div>
                )}
                <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', gap:'4px', alignItems: isMe?'flex-end':'flex-start' }}>
                  <div style={{
                    padding:'10px 14px', borderRadius: isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',
                    background: isMe?'#1B3A6B': isAI?'#F5F3FF':'#F3F4F6',
                    color: isMe?'white': isAI?'#5B21B6':'#111827',
                    fontSize:'14px', lineHeight:'1.6',
                  }}>
                    {msg.contenu}
                  </div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF' }}>
                    {msg.nom_expediteur} · {relative_time(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', padding:'10px 12px', display:'flex', alignItems:'flex-end', gap:'8px' }}>
        <textarea
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Écrivez votre message... (Entrée pour envoyer)"
          rows={2}
          style={{ flex:1, border:'none', resize:'none', fontSize:'14px', lineHeight:'1.5', color:'#111827', fontFamily:'inherit', padding:'2px 0' }}
        />
        <button onClick={send} disabled={!texte.trim()||sending} className="btn btn-primary btn-icon" style={{ flexShrink:0 }}>
          {sending ? <Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
