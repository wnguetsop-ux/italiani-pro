'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Filter, Download, UserPlus, Eye, MessageCircle,
  Flame, CheckCircle, Clock, AlertTriangle, ChevronDown, MoreVertical
} from 'lucide-react'
import { cn, formatCFA, formatDate, formatRelative, getStatusColor, getStatusLabel } from '@/lib/utils'

const CANDIDATES = [
  { id: '1', name: 'Marie Tchouaffe',  country: '🇨🇲', status: 'in_review',       score: 78, pack: 'Premium',  amount_due: 87500,  agent: 'Jean K.',    coach: 'Aissatou B.', last_activity: '2024-06-22', urgent: true  },
  { id: '2', name: 'Edouard Mbarga',   country: '🇨🇲', status: 'pending_payment',  score: 55, pack: 'Dossier', amount_due: 120000, agent: 'Aissatou B.',coach: '-',           last_activity: '2024-06-18', urgent: false },
  { id: '3', name: 'Fatima Diallo',    country: '🇸🇳', status: 'in_progress',     score: 90, pack: 'Candidature', amount_due: 0, agent: 'Jean K.',    coach: '-',           last_activity: '2024-06-21', urgent: false },
  { id: '4', name: 'Patrick Essama',   country: '🇨🇲', status: 'incomplete',      score: 32, pack: 'CV',      amount_due: 45000,  agent: '-',          coach: '-',           last_activity: '2024-06-10', urgent: false },
  { id: '5', name: 'Solange Ngo Bum',  country: '🇨🇲', status: 'awaiting_client', score: 65, pack: 'Dossier', amount_due: 0,      agent: 'Aissatou B.',coach: 'Jean K.',     last_activity: '2024-06-20', urgent: false },
  { id: '6', name: 'Ibrahim Kouyate',  country: '🇬🇳', status: 'draft',           score: 15, pack: '-',       amount_due: 0,      agent: '-',          coach: '-',           last_activity: '2024-06-22', urgent: false },
  { id: '7', name: 'Christine Ateba',  country: '🇨🇲', status: 'completed',       score: 100,pack: 'Premium', amount_due: 0,      agent: 'Jean K.',    coach: 'Aissatou B.', last_activity: '2024-06-01', urgent: false },
  { id: '8', name: 'Alain Nkemdirim',  country: '🇳🇬', status: 'suspended',       score: 45, pack: 'Dossier', amount_due: 60000,  agent: 'Aissatou B.',coach: '-',           last_activity: '2024-05-30', urgent: false },
]

const STATUS_FILTERS = [
  { v: 'all',            l: 'Tous'                },
  { v: 'incomplete',     l: 'Incomplets'          },
  { v: 'in_review',      l: 'En vérification'     },
  { v: 'pending_payment',l: 'Attente paiement'    },
  { v: 'in_progress',    l: 'En cours'            },
  { v: 'awaiting_client',l: 'Attente client'      },
  { v: 'urgent',         l: '🔥 Urgents'          },
]

export default function AdminCandidatesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<string>('last_activity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<string[]>([])

  const filtered = CANDIDATES.filter(c => {
    if (statusFilter === 'urgent' && !c.urgent) return false
    if (statusFilter !== 'all' && statusFilter !== 'urgent' && c.status !== statusFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Candidats</h1>
          <p className="text-gray-500 text-sm mt-0.5">{CANDIDATES.length} candidats au total</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
            <Download size={15} /> Exporter CSV
          </button>
          <Link href="/admin/candidates/new" className="flex items-center gap-2 bg-navy-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-navy-700 transition">
            <UserPlus size={15} /> Nouveau candidat
          </Link>
        </div>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { l: 'Total',      v: CANDIDATES.length,                                      c: 'text-navy-800' },
          { l: 'En cours',   v: CANDIDATES.filter(c => c.status === 'in_progress').length, c: 'text-indigo-600' },
          { l: 'Incomplets', v: CANDIDATES.filter(c => c.status === 'incomplete').length,  c: 'text-yellow-600' },
          { l: 'Urgents',    v: CANDIDATES.filter(c => c.urgent).length,                   c: 'text-red-600' },
          { l: 'En attente pmt', v: CANDIDATES.filter(c => c.status === 'pending_payment').length, c: 'text-orange-600' },
          { l: 'Terminés',   v: CANDIDATES.filter(c => c.status === 'completed').length,   c: 'text-green-600' },
        ].map(s => (
          <div key={s.l} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
            <div className={cn('text-xl font-bold', s.c)}>{s.v}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un candidat..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.v}
                onClick={() => setStatusFilter(f.v)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition',
                  statusFilter === f.v ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 bg-navy-50 border border-navy-200 rounded-xl px-3 py-2 text-xs text-navy-700">
            <span>{selected.length} sélectionné(s)</span>
            <button className="text-navy-600 hover:text-navy-800 font-medium">Assigner agent</button>
            <button className="text-navy-600 hover:text-navy-800 font-medium">Envoyer message</button>
            <button className="text-red-500 hover:text-red-700 font-medium ml-auto">Désélectionner</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-500 font-medium">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    onChange={e => setSelected(e.target.checked ? CANDIDATES.map(c => c.id) : [])}
                    checked={selected.length === CANDIDATES.length}
                    className="accent-navy-700"
                  />
                </th>
                <th className="px-4 py-3">Candidat</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Complétude</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3">Solde dû</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Activité</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className={cn('hover:bg-gray-50/50 transition-colors', selected.includes(c.id) && 'bg-navy-50/30')}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="accent-navy-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {c.urgent && <Flame size={13} className="text-red-500 shrink-0" />}
                      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs shrink-0">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        <div className="text-[10px] text-gray-400">{c.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('status-badge', getStatusColor(c.status))}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full progress-bar"
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-bold min-w-[32px]', c.score >= 70 ? 'text-green-600' : c.score >= 40 ? 'text-orange-500' : 'text-red-500')}>
                        {c.score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{c.pack}</td>
                  <td className="px-4 py-3">
                    {c.amount_due > 0 ? (
                      <span className="text-xs font-semibold text-orange-600">{formatCFA(c.amount_due)}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.agent}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {formatDate(c.last_activity)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-navy-100 flex items-center justify-center transition text-gray-500 hover:text-navy-700"
                      >
                        <Eye size={14} />
                      </Link>
                      <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition text-gray-500 hover:text-blue-600">
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search size={32} className="mx-auto mb-3 text-gray-300" />
            <div className="text-gray-400 text-sm">Aucun candidat trouvé</div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{filtered.length} résultats</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">← Préc.</button>
            <button className="px-3 py-1.5 bg-navy-800 text-white rounded-lg">1</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Suiv. →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
