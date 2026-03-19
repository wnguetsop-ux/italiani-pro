'use client'
import { useState } from 'react'
import {
  Brain, FileText, User, MessageCircle, CreditCard,
  Briefcase, Award, BarChart2, CheckCircle, Loader2,
  AlertTriangle, ChevronDown, Shield, Zap, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Types locaux ──────────────────────────────────────────
interface ActionResult {
  success: boolean
  result?: Record<string, unknown>
  error?: string
}

const AGENTS = [
  {
    id:    'analyze_profile',
    icon:  User,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    label: 'Analyser le profil',
    desc:  'Forces, faiblesses, secteurs recommandés, score de préparation',
    category: 'analyse',
  },
  {
    id:    'generate_checklist',
    icon:  CheckCircle,
    color: 'bg-green-50 border-green-200 text-green-700',
    label: 'Générer checklist documents',
    desc:  'Liste exacte des pièces manquantes + message client prêt',
    category: 'documents',
  },
  {
    id:    'generate_cv_fr',
    icon:  FileText,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    label: 'Générer CV (Français)',
    desc:  'CV professionnel en français adapté au marché italien',
    category: 'cv',
  },
  {
    id:    'generate_cv_it',
    icon:  FileText,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    label: 'Générer CV (Italien)',
    desc:  'CV professionnel en italien — pas une simple traduction',
    category: 'cv',
  },
  {
    id:    'generate_cover_letter',
    icon:  Briefcase,
    color: 'bg-gold-50 border-gold-200 text-gold-700',
    label: 'Générer lettre de motivation',
    desc:  'Lettre personnalisée par secteur et langue',
    category: 'cv',
  },
  {
    id:    'summarize_proofs',
    icon:  Shield,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    label: 'Résumer les preuves de travail',
    desc:  'Résumé des actions réalisées + message client horodaté',
    category: 'preuves',
  },
  {
    id:    'assist_admin',
    icon:  Brain,
    color: 'bg-red-50 border-red-200 text-red-700',
    label: 'Assistant admin (analyse dossier)',
    desc:  'Résumé, action suggérée, niveau de priorité, blocages',
    category: 'admin',
  },
  {
    id:    'payment_reminder',
    icon:  CreditCard,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    label: 'Relance paiement',
    desc:  'Message de relance professionnel basé sur le travail livré',
    category: 'paiement',
  },
  {
    id:    'prepare_interview',
    icon:  Award,
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    label: 'Préparer entretien',
    desc:  'Questions probables + conseils + phrases clés selon secteur',
    category: 'coaching',
  },
]

interface Props {
  candidateId: string
  candidateName: string
}

export default function AdminAIPanel({ candidateId, candidateName }: Props) {
  const [loading, setLoading]     = useState<string | null>(null)
  const [results, setResults]     = useState<Record<string, ActionResult>>({})
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [milestoneId, setMilestoneId] = useState('')
  const [coverLang, setCoverLang]     = useState<'fr'|'it'>('fr')

  const runAgent = async (agentId: string) => {
    setLoading(agentId)
    try {
      const options: Record<string, unknown> = {}
      if (agentId === 'payment_reminder') options.milestoneId = milestoneId
      if (agentId === 'generate_cover_letter') options.lang = coverLang

      const res = await fetch('/api/ai/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: agentId, candidateId, options }),
      })

      const data = await res.json() as ActionResult & { success: boolean }

      setResults(r => ({ ...r, [agentId]: data }))

      if (data.success) {
        toast.success(`Agent terminé : ${AGENTS.find(a => a.id === agentId)?.label}`)
        setExpanded(agentId)
      } else {
        toast.error(data.error ?? 'Erreur agent')
      }

    } catch (err) {
      toast.error('Erreur de connexion')
      setResults(r => ({ ...r, [agentId]: { success: false, error: (err as Error).message } }))
    } finally {
      setLoading(null)
    }
  }

  const emitEvent = async (type: string) => {
    await fetch('/api/ai/events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, candidateId }),
    })
    toast.success(`Événement émis : ${type}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
          <Brain size={20} className="text-gold-400" />
        </div>
        <div>
          <h3 className="font-bold text-navy-900">Agents IA</h3>
          <p className="text-xs text-gray-500">{candidateName}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
          <AlertTriangle size={11} />
          Outputs relus avant envoi client
        </div>
      </div>

      {/* Agents */}
      <div className="space-y-2">
        {AGENTS.map(agent => {
          const result  = results[agent.id]
          const isLoading = loading === agent.id
          const isExpanded = expanded === agent.id

          return (
            <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', agent.color)}>
                  <agent.icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy-900 text-sm">{agent.label}</div>
                  <div className="text-xs text-gray-500 truncate">{agent.desc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {result && (
                    <button onClick={() => setExpanded(isExpanded ? null : agent.id)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                      <Eye size={13} className="text-gray-500" />
                    </button>
                  )}
                  <button
                    onClick={() => runAgent(agent.id)}
                    disabled={isLoading || loading !== null}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
                      isLoading
                        ? 'bg-gray-100 text-gray-400'
                        : result?.success
                        ? 'bg-green-100 hover:bg-green-200 text-green-700'
                        : 'bg-navy-800 hover:bg-navy-700 text-white'
                    )}
                  >
                    {isLoading
                      ? <><Loader2 size={12} className="animate-spin" /> En cours...</>
                      : result?.success
                      ? <><CheckCircle size={12} /> Relancer</>
                      : <><Zap size={12} /> Exécuter</>
                    }
                  </button>
                </div>
              </div>

              {/* Options spécifiques */}
              {agent.id === 'payment_reminder' && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <label className="text-xs text-gray-500">ID Milestone :</label>
                  <input value={milestoneId} onChange={e => setMilestoneId(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-navy-500"
                    placeholder="milestone_id" />
                </div>
              )}
              {agent.id === 'generate_cover_letter' && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <label className="text-xs text-gray-500">Langue :</label>
                  {(['fr','it'] as const).map(l => (
                    <button key={l} onClick={() => setCoverLang(l)}
                      className={cn('px-2 py-1 rounded text-xs font-medium border transition',
                        coverLang === l ? 'bg-navy-800 text-white border-navy-800' : 'border-gray-200 text-gray-600')}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Résultat expandé */}
              {isExpanded && result && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-green-700 mb-3">
                        <CheckCircle size={12} /> Résultat agent
                      </div>
                      <pre className="text-[10px] text-gray-600 bg-white border border-gray-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-64">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-700">
                      <AlertTriangle size={12} /> {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Événements rapides */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Événements rapides</div>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'cv_ready',          label: '✅ CV prêt'          },
            { type: 'cover_letter_ready',label: '✅ Lettre prête'     },
            { type: 'dossier_completed', label: '🎉 Dossier terminé'  },
            { type: 'dossier_blocked',   label: '🔒 Dossier bloqué'  },
          ].map(e => (
            <button key={e.type} onClick={() => emitEvent(e.type)}
              className="text-xs border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl transition">
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance reminder */}
      <div className="text-[10px] text-gray-400 text-center leading-relaxed">
        Tous les messages générés respectent la conformité ItalianiPro.
        Aucun output ne promet un emploi, visa ou nulla osta.
      </div>
    </div>
  )
}
