'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, getDocs, addDoc,
  orderBy, onSnapshot, serverTimestamp, doc, getDoc
} from 'firebase/firestore'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { relative_time } from '@/lib/utils'
import { toast } from 'sonner'

interface Msg {
  id: string
  contenu: string
  expediteur: string
  nom_expediteur: string
  created_at: any
}

export default function MessagesPage() {
  const [msgs, setMsgs]         = useState<Msg[]>([])
  const [convId, setConvId]     = useState<string|null>(null)
  const [texte, setTexte]       = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [userName, setUserName] = useState('Moi')
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLTextAreaElement>(null)
  const unsubRef                = useRef<(() => void)|null>(null)

  const uid = auth.currentUser?.uid

  // Initialiser la conversation UNE SEULE FOIS
  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const init = async () => {
      try {
        // Nom du candidat
        const uSnap = await getDoc(doc(db, 'users', uid))
        if (uSnap.exists()) setUserName(uSnap.data().full_name ?? 'Moi')

        // Trouver ou créer conversation
        const snap = await getDocs(query(collection(db, 'conversations'), where('uid','==',uid)))
        let cid: string

        if (snap.empty) {
          const ref = await addDoc(collection(db, 'conversations'), {
            uid, created_at: serverTimestamp()
          })
          cid = ref.id
        } else {
          cid = snap.docs[0].id
        }

        setConvId(cid)

        // Écoute en temps réel — sans filtre complexe pour éviter l'index manquant
        const q = query(
          collection(db, 'conversations', cid, 'messages'),
          orderBy('created_at', 'asc')
        )
        const unsub = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs
            .map(d => ({ id:d.id, ...d.data() } as Msg))
            .filter(m => {
              const data = m as any
              return data.interne !== true && data.approuve !== false
            })
          setMsgs(list)
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
        }, (err) => {
          console.error('Messages listener error:', err)
        })

        unsubRef.current = unsub
      } catch (e) {
        console.error('Messages init error:', e)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (unsubRef.current) unsubRef.current()
    }
  }, [uid]) // uid uniquement — pas de re-run

  const send = useCallback(async () => {
    const content = texte.trim()
    if (!content || !convId || !uid || sending) return

    setSending(true)
    const tempText = content
    setTexte('') // Vider immédiatement

    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        uid,
        convId,
        expediteur:      'candidat',
        nom_expediteur:  userName,
        contenu:         tempText,
        interne:         false,
        approuve:        true,
        lu_par:          [uid],
        created_at:      serverTimestamp(),
      })
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch (e) {
      console.error('Send error:', e)
      toast.error('Erreur envoi. Réessayez.')
      setTexte(tempText) // Remettre le texte si erreur
    } finally {
      setSending(false)
    }
  }, [texte, convId, uid, sending, userName])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement des messages...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100svh - 90px)', gap:'10px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:'20px', fontWeight:'800', margin:'0 0 2px' }}>Messages</h1>
        <p style={{ color:'#6B7280', fontSize:'13px', margin:0 }}>Conversation avec l'équipe ItalianiPro</p>
      </div>

      {/* Agent */}
      <div className="card" style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
        <div style={{ width:'36px', height:'36px', background:'#1B3A6B', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'12px', flexShrink:0 }}>IP</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:'600', fontSize:'13.5px' }}>Équipe ItalianiPro</div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#059669' }}>
            <div style={{ width:'6px', height:'6px', background:'#22C55E', borderRadius:'50%', animation:'pulse 2s infinite' }} />
            Disponible 24h/24 — 7j/7
          </div>
        </div>
        <div style={{ fontSize:'11px', color:'#6B7280', background:'#F9FAFB', padding:'4px 10px', borderRadius:'7px', border:'1px solid #E4E8EF' }}>
          🔒 Sécurisé
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:'10px', minHeight:0 }}>
        {msgs.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', textAlign:'center', padding:'20px' }}>
            <div style={{ width:'52px', height:'52px', background:'#F3F4F6', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageCircle size={24} color="#9CA3AF" />
            </div>
            <h3 style={{ fontWeight:'700', fontSize:'14px', margin:0 }}>Aucun message</h3>
            <p style={{ color:'#9CA3AF', fontSize:'13px', margin:0, maxWidth:'260px', lineHeight:'1.5' }}>
              Envoyez votre premier message ci-dessous. Votre équipe vous répondra très rapidement.
            </p>
          </div>
        ) : (
          <>
            {msgs.map(msg => {
              const isMe = msg.expediteur === 'candidat'
              const isAI = msg.expediteur === 'ia'
              return (
                <div key={msg.id} style={{ display:'flex', gap:'8px', flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end' }}>
                  {!isMe && (
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'10px', fontWeight:'700',
                      background: isAI?'#F5F3FF':'#EBF0FF',
                      color: isAI?'#7C3AED':'#1B3A6B',
                    }}>
                      {isAI ? '🤖' : 'IP'}
                    </div>
                  )}
                  <div style={{ maxWidth:'75%', display:'flex', flexDirection:'column', gap:'3px', alignItems: isMe?'flex-end':'flex-start' }}>
                    <div style={{
                      padding:'10px 13px',
                      borderRadius: isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',
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
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', padding:'10px 12px', display:'flex', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
        <textarea
          ref={inputRef}
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Écrivez votre message... (Entrée pour envoyer)"
          rows={2}
          style={{
            flex:1, border:'none', resize:'none', fontSize:'14px',
            lineHeight:'1.5', color:'#111827', fontFamily:'inherit',
            padding:'2px 0', outline:'none', background:'transparent',
          }}
        />
        <button
          onClick={send}
          disabled={!texte.trim() || sending}
          style={{
            width:'40px', height:'40px', borderRadius:'10px',
            background: !texte.trim()||sending?'#E4E8EF':'#1B3A6B',
            border:'none', cursor: !texte.trim()||sending?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.15s', flexShrink:0,
          }}
        >
          {sending
            ? <Loader2 size={16} color={!texte.trim()||sending?'#9CA3AF':'white'} style={{ animation:'spin 0.7s linear infinite' }} />
            : <Send size={16} color={!texte.trim()||sending?'#9CA3AF':'white'} />
          }
        </button>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}
