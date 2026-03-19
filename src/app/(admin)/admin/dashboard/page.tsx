'use client'
import { useState, useEffect } from 'react'
import {
  Users, AlertTriangle, Clock, CheckCircle, CreditCard,
  FileText, MessageCircle, Calendar, ChevronRight,
  BarChart2, RefreshCw, Target, Eye, Flame,
  Plus, Shield, Brain, Zap
} from 'lucide-react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, orderBy, limit,
  getDocs, onSnapshot
} from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface Candidate {
  id: string
  full_name: string
  email: string
  dossier_status: string
  completeness_score: number
  is_urgent: boolean
  created_at: any
}
interface Task {
  id: string; title: string; priority: number; candidateName?: string
}

// ── Status maps ────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
  incomplete: 'bg-red-100 text-red-700', in_review: 'bg-blue-100 text-blue-700',
  pending_payment: 'bg-orange-100 text-orange-700', in_progress: 'bg-indigo-100 text-indigo-700',
  awaiting_client: 'bg-yellow-100 text-yellow-700', ready: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', submitted: 'Soumis', incomplete: 'Incomplet',
  in_review: 'En vérification', pending_payment: 'Attente paiement',
  in_progress: 'En cours', awaiting_client: 'Attente client',
  ready: 'Prêt', completed: 'Terminé',
}

const FLUSSI_DAYS = Math.max(0, Math.ceil((new Date('2027-01-12').getTime() - Date.now()) / 86400000))

function StatCard({ title, value, icon: Icon, color, sub, href }: any) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start justify-between gap-4 cursor-pointer">
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{title}</div>
        <div className="text-3xl font-black text-navy-900">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [tasks, setTasks]           = useState<Task[]>([])
  const [adminName, setAdminName]   = useState('Admin')
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // ── Charger depuis Firestore ──────────────────────────────
  const loadData = async () => {
    setRefreshing(true)
    try {
      // 1. Récupérer les profils candidats
      const profilesSnap = await getDocs(
        query(collection(db, 'candidate_profiles'), orderBy('created_at', 'desc'), limit(50))
      )

      const list: Candidate[] = []
      for (const doc of profilesSnap.docs) {
        const p = doc.data()
        // Récupérer le nom depuis users
        const userSnap = await getDocs(
          query(collection(db, 'users'), where('uid', '==', doc.id))
        )
        let name  = 'Candidat'
        let email = ''
        if (!userSnap.empty) {
          name  = userSnap.docs[0].data().full_name  ?? 'Candidat'
          email = userSnap.docs[0].data().email ?? ''
        }
        list.push({
          id:                 doc.id,
          full_name:          name,
          email,
          dossier_status:     p.dossier_status ?? 'draft',
          completeness_score: p.completeness_score ?? 0,
          is_urgent:          p.is_urgent ?? false,
          created_at:         p.created_at,
        })
      }
      setCandidates(list)

      // 2. Récupérer les tâches admin
      const tasksSnap = await getDocs(
        query(collection(db, 'adminTasks'),
          where('isCompleted', '==', false),
          orderBy('priority', 'asc'),
          limit(8))
      )
      setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)))

      // 3. Nom de l'admin connecté
      const user = auth.currentUser
      if (user) {
        const uSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)))
        if (!uSnap.empty) setAdminName(uSnap.docs[0].data().full_name ?? 'Admin')
      }

    } catch (err: any) {
      console.error(err)
      // Si erreur index Firestore → charger sans orderBy
      try {
        const snap = await getDocs(collection(db, 'candidate_profiles'))
        const list: Candidate[] = snap.docs.map(d => ({
          id: d.id, full_name: 'Candidat', email: '',
          dossier_status: d.data().dossier_status ?? 'draft',
          completeness_score: d.data().completeness_score ?? 0,
          is_urgent: d.data().is_urgent ?? false,
          created_at: d.data().created_at,
        }))
        setCandidates(list)
      } catch { toast.error('Erreur chargement Firestore') }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Stats calculées
  const oneWeekAgo    = new Date(Date.now() - 7 * 86400000)
  const total         = candidates.length
  const newThisWeek   = candidates.filter(c => c.created_at?.toDate?.() > oneWeekAgo).length
  const incomplete    = candidates.filter(c => c.dossier_status === 'incomplete').length
  const urgent        = candidates.filter(c => c.is_urgent).length
  const pendingPmt    = candidates.filter(c => c.dossier_status === 'pending_payment').length
  const inProgress    = candidates.filter(c => c.dossier_status === 'in_progress').length
  const completed     = candidates.filter(c => c.dossier_status === 'completed').length

  const PIPELINE = [
    { status:'draft',           label:'Brouillons',   count:candidates.filter(c=>c.dossier_status==='draft').length,           color:'bg-gray-100 text-gray-700'     },
    { status:'incomplete',      label:'Incomplets',   count:incomplete,                                                        color:'bg-red-100 text-red-700'       },
    { status:'in_review',       label:'En vérif.',    count:candidates.filter(c=>c.dossier_status==='in_review').length,       color:'bg-blue-100 text-blue-700'     },
    { status:'pending_payment', label:'Attente pmt',  count:pendingPmt,                                                       color:'bg-orange-100 text-orange-700'  },
    { status:'in_progress',     label:'En cours',     count:inProgress,                                                       color:'bg-indigo-100 text-indigo-700'  },
    { status:'completed',       label:'Terminés',     count:completed,                                                        color:'bg-green-100 text-green-700'    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
        <div className="text-sm text-gray-500">Chargement des données Firebase...</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Bonjour {adminName} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={refreshing}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* FLUSSI */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-5 text-white flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0">
            <Calendar className="text-gold-400" size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Prochain Click Day Flussi</div>
            <div className="font-bold text-lg">12 Janvier 2027 — Saisonniers Agricoles</div>
            <div className="text-xs text-gold-400 mt-0.5">Préparez les dossiers dès maintenant</div>
          </div>
        </div>
        <div className="bg-gold-500/20 border border-gold-500/30 rounded-xl px-6 py-3 text-center shrink-0">
          <div className="text-3xl font-black text-gold-400">{FLUSSI_DAYS}</div>
          <div className="text-xs text-gray-400 mt-0.5">jours restants</div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total candidats"   value={total}       icon={Users}         color="bg-navy-700"   sub={`+${newThisWeek} cette semaine`} href="/admin/candidates" />
        <StatCard title="Urgents"           value={urgent}      icon={Flame}         color="bg-red-500"    sub="Attention immédiate" />
        <StatCard title="Incomplets"        value={incomplete}  icon={AlertTriangle}  color="bg-yellow-500" sub="Pièces manquantes" />
        <StatCard title="Attente paiement"  value={pendingPmt}  icon={CreditCard}     color="bg-orange-500" sub="Relance nécessaire" href="/admin/finance" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="En cours"   value={inProgress} icon={Zap}         color="bg-indigo-500" />
        <StatCard title="Terminés"   value={completed}  icon={CheckCircle}  color="bg-emerald-500" />
        <StatCard title="Tâches"     value={tasks.length} icon={Clock}     color="bg-purple-500" />
        <StatCard title="Agents IA"  value="10"         icon={Brain}       color="bg-pink-500" />
      </div>

      {/* PIPELINE */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900">Pipeline</h2>
          <Link href="/admin/pipeline" className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1">
            Vue Kanban <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {PIPELINE.map(p => (
            <Link key={p.status} href={`/admin/candidates?status=${p.status}`}
              className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition', p.color)}>
              {p.label} <span className="font-black">{p.count}</span>
            </Link>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
            {PIPELINE.map((p, i) => (
              <div key={i}
                className={['bg-gray-300','bg-red-400','bg-blue-400','bg-orange-400','bg-indigo-500','bg-green-400'][i]}
                style={{ width: `${total > 0 ? (p.count/total)*100 : 0}%`, transition:'width 1s ease' }} />
            ))}
          </div>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Table candidats */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-navy-900">Candidats ({total})</h2>
            <Link href="/admin/candidates" className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1">
              Voir tous <ChevronRight size={14} />
            </Link>
          </div>

          {candidates.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto mb-3 text-gray-200" />
              <div className="text-gray-400 text-sm mb-3">Aucun candidat encore</div>
              <div className="text-xs text-gray-400">
                Partagez le lien <strong>localhost:3000/register</strong><br/>
                à vos clients pour qu'ils s'inscrivent
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium">
                    <th className="px-4 py-3">Candidat</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {candidates.slice(0, 10).map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {c.is_urgent && <Flame size={13} className="text-red-500 shrink-0" />}
                          <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs shrink-0">
                            {c.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{c.full_name}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          STATUS_COLOR[c.dossier_status] ?? 'bg-gray-100 text-gray-600')}>
                          {STATUS_LABEL[c.dossier_status] ?? c.dossier_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-navy-500 to-gold-400 rounded-full"
                              style={{ width: `${c.completeness_score}%` }} />
                          </div>
                          <span className={cn('text-xs font-bold',
                            c.completeness_score >= 70 ? 'text-green-600' :
                            c.completeness_score >= 40 ? 'text-orange-500' : 'text-red-500')}>
                            {c.completeness_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/candidates/${c.id}`}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-navy-100 flex items-center justify-center transition">
                          <Eye size={14} className="text-gray-500" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Droite */}
        <div className="space-y-4">

          {/* Tâches */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-navy-900 text-sm">
                Tâches
                {tasks.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                )}
              </h3>
              <Clock size={15} className="text-gray-400" />
            </div>
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle size={22} className="mx-auto mb-2 text-green-300" />
                <div className="text-xs text-gray-400">Aucune tâche 🎉</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {tasks.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-start gap-2.5">
                    <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5',
                      t.priority===1?'bg-red-500':t.priority===2?'bg-orange-400':'bg-gray-300')}>
                      {t.priority}
                    </div>
                    <div className="text-xs text-gray-700 leading-snug">{t.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-navy-900 text-sm">Alertes</h3>
            </div>
            {urgent === 0 && incomplete === 0 && pendingPmt === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle size={20} className="mx-auto mb-2 text-green-300" />
                <div className="text-xs text-gray-400">Tout est à jour ✅</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {urgent > 0 && (
                  <div className="px-4 py-3 flex items-center gap-2 text-xs text-red-700 bg-red-50">
                    <Flame size={12} className="shrink-0" />
                    <span><strong>{urgent}</strong> dossier(s) urgent(s)</span>
                  </div>
                )}
                {incomplete > 0 && (
                  <div className="px-4 py-3 flex items-center gap-2 text-xs text-orange-700 bg-orange-50">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span><strong>{incomplete}</strong> dossier(s) incomplet(s)</span>
                  </div>
                )}
                {pendingPmt > 0 && (
                  <div className="px-4 py-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50">
                    <CreditCard size={12} className="shrink-0" />
                    <span><strong>{pendingPmt}</strong> paiement(s) en attente</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agents IA */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-gold-400" />
              <span className="font-bold text-sm">Agents IA disponibles</span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-400 mb-4">
              {['Analyser profil','Générer CV FR/IT','Lettre de motivation','Checklist documents','Rappel paiement','Préparer entretien'].map(a => (
                <div key={a} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold-400 rounded-full shrink-0" />
                  {a}
                </div>
              ))}
            </div>
            <Link href="/admin/candidates"
              className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-xs py-2.5 rounded-xl transition">
              Ouvrir un dossier <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href:'/admin/candidates', icon:Users,     label:'Candidats',   color:'bg-navy-50 border-navy-200 text-navy-700'     },
          { href:'/admin/pipeline',   icon:BarChart2,  label:'Pipeline',    color:'bg-indigo-50 border-indigo-200 text-indigo-700'},
          { href:'/admin/finance',    icon:CreditCard, label:'Finance',     color:'bg-green-50 border-green-200 text-green-700'  },
          { href:'/admin/team',       icon:Users,      label:'Équipe',      color:'bg-gold-50 border-gold-200 text-gold-700'     },
        ].map((a, i) => (
          <Link key={i} href={a.href}
            className={cn('flex flex-col items-center gap-2 border rounded-2xl py-5 text-xs font-semibold transition hover:shadow-md', a.color)}>
            <a.icon size={20} />
            {a.label}
          </Link>
        ))}
      </div>

    </div>
  )
}