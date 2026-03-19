'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Shield, MessageCircle } from 'lucide-react'
import { cn, formatRelative, getInitials } from '@/lib/utils'

const MESSAGES = [
  { id:'1', from:'agent', sender:'Jean Kamdem', content:"Bonjour Marie ! J'ai bien reçu votre passeport. Il est valide jusqu'en 2029, c'est parfait. Pouvez-vous m'envoyer également votre casier judiciaire ?", date:'2024-06-01T09:00:00Z', read:true },
  { id:'2', from:'me',    sender:'Moi',         content:"Bonjour Jean, merci ! Je vais faire la demande du casier judiciaire cette semaine.", date:'2024-06-01T10:30:00Z', read:true },
  { id:'3', from:'agent', sender:'Jean Kamdem', content:"Parfait. En attendant, j'ai commencé à travailler sur votre CV. J'ai quelques questions : dans quel secteur travaillez-vous actuellement ? Et avez-vous déjà de l'expérience agricole ?", date:'2024-06-05T14:00:00Z', read:true },
  { id:'4', from:'me',    sender:'Moi',         content:"Je travaille actuellement comme aide-soignante dans une clinique à Douala. J'ai aussi travaillé 2 saisons dans une plantation de café dans la région de l'Ouest.", date:'2024-06-05T16:00:00Z', read:true },
  { id:'5', from:'agent', sender:'Jean Kamdem', content:"Excellent ! L'expérience agricole est très valorisée pour le Flussi saisonniers agricoles. Je vais mettre ça en avant dans votre CV. Je vous envoie la version V1 demain pour validation.", date:'2024-06-06T09:00:00Z', read:true },
  { id:'6', from:'agent', sender:'Jean Kamdem', content:"⚠️ Votre lettre de motivation a été rejetée car elle était trop générique. Pouvez-vous me dire exactement dans quelle région d'Italie vous souhaitez travailler ? Toscane, Sicile, Campanie ?", date:'2024-06-20T11:00:00Z', read:false },
]

export default function MessagesPage() {
  const [input, setInput]   = useState('')
  const [msgs, setMsgs]     = useState(MESSAGES)
  const bottomRef           = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = () => {
    if (!input.trim()) return
    setMsgs(m => [...m, {
      id: Date.now().toString(), from:'me', sender:'Moi',
      content: input.trim(), date: new Date().toISOString(), read: true
    }])
    setInput('')
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm">JK</div>
        <div>
          <div className="font-bold text-navy-900 text-sm">Jean Kamdem — Votre agent</div>
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> En ligne · Répond en général en moins de 2h
          </div>
        </div>
        <div className="ml-auto">
          <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
            <Shield size={10} /> Messagerie sécurisée
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-2xl shadow-card border border-gray-100 overflow-y-auto p-5 space-y-4 mb-4">
        {msgs.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.from === 'me' ? 'flex-row-reverse' : '')}>
            {msg.from !== 'me' && (
              <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-xs font-bold shrink-0">
                {getInitials(msg.sender)}
              </div>
            )}
            <div className={cn('max-w-[75%]', msg.from === 'me' ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
              {msg.from !== 'me' && <div className="text-xs text-gray-500 font-medium ml-1">{msg.sender}</div>}
              <div className={cn(
                'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.from === 'me'
                  ? 'bg-navy-800 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              )}>
                {msg.content}
              </div>
              <div className="text-[10px] text-gray-400 px-1">{formatRelative(msg.date)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-3 flex items-end gap-2">
        <button className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition shrink-0">
          <Paperclip size={16} />
        </button>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Écrivez votre message..."
          rows={1}
          className="flex-1 border-0 resize-none text-sm focus:outline-none text-gray-700 placeholder-gray-400 leading-relaxed py-2"
        />
        <button onClick={send} disabled={!input.trim()}
          className="w-9 h-9 rounded-xl bg-navy-800 hover:bg-navy-700 disabled:opacity-40 flex items-center justify-center text-white transition shrink-0">
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
