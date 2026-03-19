'use client'
import { useState } from 'react'
import { CreditCard, CheckCircle, Clock, AlertTriangle, Download, Lock, Shield, ExternalLink } from 'lucide-react'
import { cn, formatCFA, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

const ORDER = {
  pack: 'Pack Premium Coaching',
  total: 350000,
  paid: 262500,
  remaining: 87500,
}

const MILESTONES = [
  { id:'1', title:'Acompte activation', amount:175000, status:'paid',    date:'2024-05-08', unlocked:true,  proof:'Compte activé + agent assigné' },
  { id:'2', title:'Après livraison CV optimisé', amount:87500,  status:'paid',    date:'2024-06-15', unlocked:true,  proof:'CV V2 livré + lettre de motivation x2' },
  { id:'3', title:'Après dossier complet finalisé', amount:87500,  status:'pending', date:null,         unlocked:false, proof:'En attente finalisation dossier' },
]

const HISTORY = [
  { id:'1', label:'Acompte Pack Premium',     amount:175000, status:'paid', date:'2024-05-08', ref:'IP-2024-00123', method:'MTN Mobile Money' },
  { id:'2', label:'Solde après CV livré',     amount:87500,  status:'paid', date:'2024-06-15', ref:'IP-2024-00187', method:'Orange Money' },
]

export default function PaymentsPage() {
  const [showPayModal, setShowPayModal] = useState(false)

  const pct = Math.round((ORDER.paid / ORDER.total) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Paiements</h1>
        <p className="text-gray-500 text-sm mt-0.5">{ORDER.pack}</p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { l:'Total pack',     v:formatCFA(ORDER.total),     color:'text-navy-900' },
            { l:'Déjà payé',      v:formatCFA(ORDER.paid),      color:'text-green-600' },
            { l:'Reste à payer',  v:formatCFA(ORDER.remaining), color:'text-orange-600' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className={cn('text-xl font-black', s.color)}>{s.v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-400 mt-1.5 text-right">{pct}% payé</div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy-900">Jalons de paiement</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chaque étape est débloquée après livraison de la preuve de travail correspondante</p>
        </div>
        <div className="divide-y divide-gray-50">
          {MILESTONES.map((m, i) => (
            <div key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5',
                    m.status==='paid' ? 'bg-green-500 text-white' : m.unlocked ? 'bg-gold-400 text-white' : 'bg-gray-200 text-gray-500')}>
                    {m.status==='paid' ? <CheckCircle size={15}/> : m.unlocked ? `${i+1}` : <Lock size={13}/>}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{m.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.proof}</div>
                    {m.date && <div className="text-xs text-gray-400 mt-0.5">Payé le {formatDate(m.date)}</div>}
                    {!m.unlocked && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-600">
                        <Lock size={11}/> En attente livraison avant paiement
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-navy-800">{formatCFA(m.amount)}</div>
                  <span className={cn('status-badge text-[10px] mt-1', getStatusColor(m.status))}>
                    {getStatusLabel(m.status)}
                  </span>
                  {m.unlocked && m.status === 'pending' && (
                    <button onClick={() => setShowPayModal(true)}
                      className="mt-2 block text-xs bg-gold-500 hover:bg-gold-400 text-white px-3 py-1.5 rounded-lg font-bold transition">
                      Payer maintenant
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy-900">Historique des paiements</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {HISTORY.map(p => (
            <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-gray-800 text-sm">{p.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(p.date)} · {p.method} · Réf: {p.ref}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-green-600 text-sm">{formatCFA(p.amount)}</div>
                <button className="mt-1 flex items-center gap-1 text-[10px] text-navy-500 hover:text-navy-700 transition">
                  <Download size={11}/> Facture
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
        <Shield size={16} className="text-navy-500 shrink-0" />
        <span>Paiements sécurisés via CinetPay — MTN Mobile Money, Orange Money, Airtel Money et carte bancaire acceptés.</span>
      </div>

      {/* Payment modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-card-lg">
            <h3 className="font-bold text-navy-900 text-lg mb-1">Payer le solde final</h3>
            <p className="text-gray-500 text-sm mb-5">Après dossier complet finalisé</p>
            <div className="text-3xl font-black text-navy-900 mb-5">{formatCFA(87500)}</div>
            <div className="space-y-2 mb-5">
              {['💛 MTN Mobile Money','🟠 Orange Money','💳 Carte bancaire'].map(m => (
                <button key={m} className="w-full border border-gray-200 hover:border-navy-400 hover:bg-navy-50 rounded-xl py-3 text-sm font-medium transition text-left px-4">
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setShowPayModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Annuler</button>
              <button className="flex-1 bg-navy-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy-700 transition">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
