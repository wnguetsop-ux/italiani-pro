'use client'
import Link from 'next/link'
import {
  CheckCircle, Clock, AlertTriangle, Upload, Calendar, MessageCircle,
  ChevronRight, FileText, CreditCard, Zap, Star, Shield,
  ArrowRight, Download, Eye, Bell, BookOpen, Award
} from 'lucide-react'
import { cn, formatCFA, formatDate, daysUntil, getStatusColor, getStatusLabel } from '@/lib/utils'

// ── MOCK DATA ──────────────────────────────────────────────
const PROFILE = {
  name: 'Marie Tchouaffe',
  pack: 'Pack Premium Coaching',
  dossier_status: 'in_progress',
  completeness_score: 78,
  quality_score: 82,
  readiness_score: 65,
  agent: 'Jean Kamdem',
  coach: 'Aissatou Ba',
}

const DOCUMENTS = [
  { name: 'Passeport',              status: 'approved', date: '2024-05-10', expiry: '2029-05-10' },
  { name: 'Acte de naissance',     status: 'approved', date: '2024-05-12', expiry: null },
  { name: 'Casier judiciaire',     status: 'in_review', date: '2024-06-01', expiry: '2024-09-01' },
  { name: 'CV optimisé',           status: 'approved', date: '2024-06-15', expiry: null },
  { name: 'Lettre de motivation',  status: 'rejected',  date: '2024-06-20', expiry: null },
  { name: 'Diplômes',              status: 'uploaded',  date: '2024-06-22', expiry: null },
  { name: 'Photo d\'identité',     status: 'pending',   date: null,         expiry: null },
  { name: 'Justificatif domicile', status: 'pending',   date: null,         expiry: null },
]

const PROOFS = [
  { title: 'Analyse CV initiale',          date: '2024-06-10', type: 'CV',         agent: 'Jean K.',   duration: '2h' },
  { title: 'Corrections CV V2',            date: '2024-06-15', type: 'CV',         agent: 'Jean K.',   duration: '1.5h' },
  { title: 'Séance coaching #1',           date: '2024-06-18', type: 'Coaching',   agent: 'Aissatou B.',duration: '60min' },
  { title: 'Vérification passeport',       date: '2024-06-20', type: 'Document',   agent: 'Jean K.',   duration: '30min' },
]

const TIMELINE = [
  { date: '2024-05-05', title: 'Inscription sur ItalianiPro',    type: 'status',    done: true  },
  { date: '2024-05-08', title: 'Pack Premium activé',            type: 'payment',   done: true  },
  { date: '2024-05-10', title: 'Envoi documents initiaux',       type: 'document',  done: true  },
  { date: '2024-06-10', title: 'Analyse CV par l\'équipe',       type: 'proof',     done: true  },
  { date: '2024-06-15', title: 'CV optimisé livré',              type: 'proof',     done: true  },
  { date: '2024-06-18', title: 'Séance coaching #1',             type: 'appointment',done: true },
  { date: '2024-07-01', title: 'Lettre motivation à corriger',   type: 'document',  done: false },
  { date: '2024-07-15', title: 'Séance coaching #2 (planifiée)', type: 'appointment',done: false},
  { date: '2024-08-01', title: 'Dossier final livré',            type: 'status',    done: false },
]

const FLUSSI_NEXT = { date: '2027-01-12', label: 'Saisonniers Agricoles', days: daysUntil('2027-01-12') }

const PAYMENTS = [
  { label: 'Acompte Pack Premium',     amount: 175000, status: 'paid',    date: '2024-05-08' },
  { label: 'Solde après CV livré',     amount: 87500,  status: 'paid',    date: '2024-06-15' },
  { label: 'Solde final après dossier',amount: 87500,  status: 'pending', date: null         },
]

// ── SCORE CIRCLE ───────────────────────────────────────────
function ScoreCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = ((100 - value) / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-navy-900">{value}</div>
            <div className="text-[10px] text-gray-400 leading-none">/ 100</div>
          </div>
        </div>
      </div>
      <div className="text-xs font-medium text-gray-600 text-center">{label}</div>
    </div>
  )
}

// ── PAGE ───────────────────────────────────────────────────
export default function CandidateDashboard() {
  const approved = DOCUMENTS.filter(d => d.status === 'approved').length
  const total    = DOCUMENTS.length
  const pctDocs  = Math.round((approved / total) * 100)

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-full opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gold-400" />
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-gold-300" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-gold-400 text-sm font-semibold mb-1">Bonjour 👋</div>
            <h1 className="text-2xl font-bold text-white mb-1">{PROFILE.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={cn('status-badge', getStatusColor(PROFILE.dossier_status))}>
                {getStatusLabel(PROFILE.dossier_status)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-300 text-xs">{PROFILE.pack}</span>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <span>Agent : <span className="text-white">{PROFILE.agent}</span></span>
              <span>Coach : <span className="text-white">{PROFILE.coach}</span></span>
            </div>
          </div>
          <div className="shrink-0">
            <div className="bg-gold-500/20 border border-gold-500/30 rounded-2xl px-5 py-4 text-center">
              <div className="text-3xl font-bold text-gold-400">{PROFILE.completeness_score}%</div>
              <div className="text-xs text-gray-300 mt-1">Complétude dossier</div>
            </div>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="disclaimer-banner rounded-xl p-4 text-sm">
        <div className="flex gap-2 items-start">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-800 text-xs leading-relaxed">
            <strong>Rappel important :</strong> ItalianiPro vous aide à préparer et organiser votre dossier. 
            Nous ne déposons aucune demande officielle de nulla osta, ne garantissons aucun emploi, visa ou autorisation. 
            La décision officielle appartient à l'employeur et aux autorités italiennes.
          </div>
        </div>
      </div>

      {/* 3-SCORE CARDS */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <h2 className="font-bold text-navy-900 mb-6 text-sm uppercase tracking-wide">Scores de votre dossier</h2>
        <div className="flex flex-wrap justify-around gap-6">
          <ScoreCircle value={PROFILE.completeness_score} label="Complétude" color="#2d5fa8" />
          <ScoreCircle value={PROFILE.quality_score}      label="Qualité"    color="#f59e0b" />
          <ScoreCircle value={PROFILE.readiness_score}    label="Préparation" color="#10b981" />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
          <div><span className="font-semibold text-blue-600">{approved}/{total}</span><br/>Docs validés</div>
          <div><span className="font-semibold text-gold-500">2/4</span><br/>Coachings</div>
          <div><span className="font-semibold text-green-500">{PROFILE.readiness_score}%</span><br/>Prêt Flussi</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Documents */}
        <div className="lg:col-span-2 space-y-4">
          {/* Document progress */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900">Mes documents</h2>
              <Link href="/documents" className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1">
                Gérer <ChevronRight size={14} />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">{approved} validés sur {total} requis</span>
                <span className="font-bold text-navy-800">{pctDocs}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full progress-bar" style={{ width: `${pctDocs}%` }} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {DOCUMENTS.map((doc, i) => (
                <div
                  key={i}
                  className={cn(
                    'doc-card flex items-center justify-between gap-3',
                    doc.status
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', {
                      'bg-green-100': doc.status === 'approved',
                      'bg-blue-100': doc.status === 'in_review' || doc.status === 'uploaded',
                      'bg-red-100': doc.status === 'rejected',
                      'bg-gray-100': doc.status === 'pending',
                    })}>
                      <FileText size={13} className={cn({
                        'text-green-600': doc.status === 'approved',
                        'text-blue-600': doc.status === 'in_review' || doc.status === 'uploaded',
                        'text-red-600': doc.status === 'rejected',
                        'text-gray-400': doc.status === 'pending',
                      })} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{doc.name}</div>
                      {doc.status === 'pending' && (
                        <div className="text-[10px] text-red-500 font-medium">À uploader</div>
                      )}
                    </div>
                  </div>
                  <span className={cn('status-badge shrink-0 text-[10px]', getStatusColor(doc.status))}>
                    {getStatusLabel(doc.status)}
                  </span>
                </div>
              ))}
            </div>

            {DOCUMENTS.filter(d => d.status === 'rejected').length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
                <AlertTriangle size={13} className="shrink-0" />
                <span><strong>1 document rejeté</strong> — Lettre de motivation. Corrections requises. </span>
                <Link href="/documents" className="ml-auto text-red-600 hover:text-red-800 font-medium whitespace-nowrap">Corriger →</Link>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Link
                href="/documents/upload"
                className="flex-1 flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white py-2.5 rounded-xl text-xs font-medium transition"
              >
                <Upload size={14} /> Ajouter un document
              </Link>
              <Link
                href="/documents"
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-xs font-medium transition"
              >
                <Eye size={14} /> Voir tout
              </Link>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-navy-900">Mon parcours</h2>
              <Link href="/timeline" className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1">
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-navy-200 via-gray-200 to-transparent" />
              <div className="space-y-4">
                {TIMELINE.slice(0, 6).map((event, i) => (
                  <div key={i} className="flex gap-4 items-start pl-1">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm',
                      event.done
                        ? 'bg-green-500 text-white'
                        : i === TIMELINE.findIndex(e => !e.done)
                        ? 'bg-gold-400 text-white animate-pulse-soft'
                        : 'bg-gray-200 text-gray-400'
                    )}>
                      {event.done
                        ? <CheckCircle size={13} />
                        : i === TIMELINE.findIndex(e => !e.done)
                        ? <Clock size={13} />
                        : <div className="w-2 h-2 rounded-full bg-gray-400" />
                      }
                    </div>
                    <div className={cn('pt-0.5', !event.done && 'opacity-50')}>
                      <div className="text-sm font-medium text-gray-800">{event.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{event.date ? formatDate(event.date) : 'À venir'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Flussi countdown */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-gold-400" />
              <span className="font-bold text-sm">Calendrier Flussi 2027</span>
            </div>
            <div className="text-xs text-gray-400 mb-1">{FLUSSI_NEXT.label}</div>
            <div className="text-gold-300 font-medium text-sm mb-3">{formatDate(FLUSSI_NEXT.date)}</div>
            <div className="bg-gold-500/20 border border-gold-500/30 rounded-xl p-3 text-center mb-3">
              <div className="text-3xl font-bold text-gold-400">{FLUSSI_NEXT.days}</div>
              <div className="text-xs text-gray-400 mt-0.5">jours restants</div>
            </div>
            <div className="text-[10px] text-gray-500 mb-3">
              Votre dossier doit être prêt plusieurs mois avant. Objectif : dossier complet avant octobre 2026.
            </div>
            <Link href="/flussi" className="flex items-center justify-center gap-1 text-gold-400 text-xs hover:text-gold-300 transition">
              Voir le calendrier <ChevronRight size={12} />
            </Link>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-navy-900 text-sm">Paiements</h3>
              <Link href="/payments" className="text-xs text-navy-500 hover:text-navy-700">
                <ChevronRight size={15} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {PAYMENTS.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{p.label}</div>
                    {p.date && <div className="text-[10px] text-gray-400">{formatDate(p.date)}</div>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="text-xs font-bold text-navy-800">{formatCFA(p.amount)}</div>
                    <span className={cn('status-badge text-[10px]', getStatusColor(p.status))}>
                      {getStatusLabel(p.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total payé</span>
                <span className="font-bold text-green-600">{formatCFA(262500)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Restant dû</span>
                <span className="font-bold text-orange-500">{formatCFA(87500)}</span>
              </div>
            </div>
          </div>

          {/* Proofs of work */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">Ce qui a été fait pour vous</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Preuves horodatées de travail effectué</p>
              </div>
              <Shield size={16} className="text-green-500" />
            </div>
            <div className="divide-y divide-gray-50">
              {PROOFS.map((p, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-gray-800">{p.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.agent} · {p.duration} · {formatDate(p.date)}</div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">{p.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-green-50 border-t border-green-100">
              <div className="flex items-center gap-2 text-xs text-green-700">
                <CheckCircle size={13} />
                <span>Toutes les preuves sont horodatées et archivées</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/messages',    icon: MessageCircle, label: 'Messages', badge: 2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { href: '/checklist',  icon: CheckCircle,   label: 'Checklist', color: 'bg-green-50 text-green-700 border-green-200' },
              { href: '/resources',  icon: BookOpen,      label: 'Ressources', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { href: '/support',    icon: Shield,        label: 'Support', color: 'bg-gray-50 text-gray-700 border-gray-200' },
            ].map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={cn('relative flex flex-col items-center gap-2 border rounded-xl py-4 text-xs font-medium transition card-hover', a.color)}
              >
                {a.badge && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{a.badge}</span>
                )}
                <a.icon size={20} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* LEGAL REMINDER */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 text-center">
        ItalianiPro — Plateforme d'accompagnement documentaire uniquement. 
        Ni agence d'emploi, ni agence de visa, ni intermédiaire officiel.
        La demande de nulla osta est effectuée par l'employeur via le Sportello Unico.{' '}
        <Link href="/legal/disclaimer" className="text-navy-500 hover:underline">En savoir plus</Link>
      </div>
    </div>
  )
}
