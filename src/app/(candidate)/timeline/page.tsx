'use client'
import { CheckCircle, Clock, Circle, FileText, CreditCard, Calendar, Star, AlertTriangle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const EVENTS = [
  { date:'2024-05-05', title:'Inscription sur ItalianiPro',           type:'status',    done:true,  icon:Star,        color:'bg-gold-400' },
  { date:'2024-05-08', title:'Pack Premium activé — 175 000 XAF',     type:'payment',   done:true,  icon:CreditCard,  color:'bg-green-500' },
  { date:'2024-05-10', title:'Envoi des premiers documents',           type:'document',  done:true,  icon:FileText,    color:'bg-blue-500' },
  { date:'2024-05-15', title:'Agent Jean Kamdem assigné',              type:'status',    done:true,  icon:Star,        color:'bg-indigo-500' },
  { date:'2024-06-01', title:'Passeport & acte de naissance validés',  type:'document',  done:true,  icon:CheckCircle, color:'bg-green-500' },
  { date:'2024-06-10', title:'Analyse CV initiale par l\'équipe (2h)', type:'proof',     done:true,  icon:FileText,    color:'bg-purple-500' },
  { date:'2024-06-15', title:'CV V2 optimisé livré',                   type:'proof',     done:true,  icon:CheckCircle, color:'bg-green-500' },
  { date:'2024-06-15', title:'Solde 87 500 XAF payé',                  type:'payment',   done:true,  icon:CreditCard,  color:'bg-green-500' },
  { date:'2024-06-18', title:'Séance coaching #1 — Aissatou Ba (1h)',  type:'appointment',done:true, icon:Calendar,    color:'bg-gold-500' },
  { date:'2024-06-20', title:'Lettre de motivation rejetée — à corriger',type:'document', done:false, icon:AlertTriangle,color:'bg-red-500' },
  { date:null,         title:'Lettre de motivation V2 à valider',       type:'document',  done:false, icon:Clock,       color:'bg-gray-300' },
  { date:null,         title:'Séance coaching #2 — planifiée',          type:'appointment',done:false,icon:Calendar,    color:'bg-gray-300' },
  { date:null,         title:'Dossier final livré',                     type:'status',    done:false, icon:Star,        color:'bg-gray-300' },
  { date:null,         title:'Solde final débloqué',                    type:'payment',   done:false, icon:CreditCard,  color:'bg-gray-300' },
]

const TYPE_LABELS: Record<string, string> = {
  status: 'Statut', document: 'Document', payment: 'Paiement',
  proof: 'Preuve de travail', appointment: 'Rendez-vous',
}
const TYPE_COLORS: Record<string, string> = {
  status: 'bg-gold-50 text-gold-700 border-gold-200',
  document: 'bg-blue-50 text-blue-700 border-blue-200',
  payment: 'bg-green-50 text-green-700 border-green-200',
  proof: 'bg-purple-50 text-purple-700 border-purple-200',
  appointment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export default function TimelinePage() {
  const done  = EVENTS.filter(e => e.done).length
  const total = EVENTS.length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Mon parcours</h1>
        <p className="text-gray-500 text-sm mt-0.5">{done}/{total} étapes franchies</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Avancement global</span>
          <span className="font-bold text-navy-800">{Math.round((done/total)*100)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full progress-bar" style={{ width: `${(done/total)*100}%` }} />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy-200 via-gray-200 to-transparent" />
          <div className="space-y-5">
            {EVENTS.map((event, i) => (
              <div key={i} className="flex gap-4 items-start pl-1">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm',
                  event.done ? event.color + ' text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  <event.icon size={15} />
                </div>
                <div className={cn('flex-1 pb-1', !event.done && 'opacity-50')}>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-800 text-sm">{event.title}</span>
                    <span className={cn('text-[10px] border px-1.5 py-0.5 rounded-full', TYPE_COLORS[event.type])}>
                      {TYPE_LABELS[event.type]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.date ? formatDate(event.date) : 'À venir'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
