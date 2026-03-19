'use client'
import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, ChevronDown, Bell, FileText, Info } from 'lucide-react'
import { daysUntil, formatDate, cn } from '@/lib/utils'

const FLUSSI_EVENTS = [
  {
    id: '1',
    year: 2026,
    date: '2026-01-12',
    category: 'Saisonniers Agricoles',
    title: 'Click Day — Travailleurs saisonniers agricoles',
    description: 'Quota pour les travailleurs saisonniers dans le secteur agricole (vendanges, cueillette, etc.).',
    color: 'green',
    status: 'passed',
    required_docs: ['Passeport valide', 'CV en italien ou anglais', 'Contrat de travail proposé', 'Casier judiciaire'],
    tips: 'Ce secteur offre le plus grand nombre de quotas. Idéal pour une première expérience en Italie.',
  },
  {
    id: '2',
    year: 2026,
    date: '2026-02-09',
    category: 'Saisonniers Tourisme',
    title: 'Click Day — Travailleurs saisonniers tourisme',
    description: 'Quota pour hôtellerie, restauration, services touristiques saisonniers.',
    color: 'blue',
    status: 'passed',
    required_docs: ['Passeport valide', 'CV optimisé', 'Attestations formation hôtellerie', 'Lettre de motivation'],
    tips: 'La saison touristique italienne est printemps-automne. Bonne porte d\'entrée pour les profils service.',
  },
  {
    id: '3',
    year: 2026,
    date: '2026-02-16',
    category: 'Non Saisonniers Généraux',
    title: 'Click Day — Travailleurs non saisonniers',
    description: 'Construction, transport, industrie, services aux entreprises, réfugiés et apatrides.',
    color: 'indigo',
    status: 'passed',
    required_docs: ['Passeport valide', 'Diplômes & certifications professionnelles', 'CV technique', 'Lettre motivation'],
    tips: 'Catégorie très compétitive. Le dossier doit être irréprochable.',
  },
  {
    id: '4',
    year: 2026,
    date: '2026-02-18',
    category: 'Assistance Familiale',
    title: 'Click Day — Assistance familiale / domicile',
    description: 'Aide soignante à domicile, aide aux personnes âgées, assistante de vie.',
    color: 'purple',
    status: 'passed',
    required_docs: ['Passeport valide', 'Diplôme soins infirmiers ou équivalent', 'CV détaillé', 'Casier judiciaire'],
    tips: 'Fort besoin en Italie. Profils féminins très recherchés dans ce secteur.',
  },
  // 2027
  {
    id: '5',
    year: 2027,
    date: '2027-01-12',
    category: 'Saisonniers Agricoles',
    title: 'Click Day — Travailleurs saisonniers agricoles',
    description: 'Prochaine ouverture agricole. Préparez votre dossier dès maintenant.',
    color: 'green',
    status: 'upcoming',
    required_docs: ['Passeport valide (min. 6 mois)', 'CV en français/anglais/italien', 'Acte de naissance', 'Casier judiciaire (< 3 mois)', 'Photo identité récente', 'Contrat ou offre employeur'],
    tips: 'Commencez la préparation au moins 6 mois à l\'avance. Les quotas partent en quelques secondes.',
  },
  {
    id: '6',
    year: 2027,
    date: '2027-02-09',
    category: 'Saisonniers Tourisme',
    title: 'Click Day — Travailleurs saisonniers tourisme',
    description: 'Quota hôtellerie et restauration. Saison été 2027.',
    color: 'blue',
    status: 'upcoming',
    required_docs: ['Passeport valide', 'CV sectoriel', 'Attestation de formation tourisme/hôtellerie', 'Lettre motivation en italien', 'Photo identité'],
    tips: 'Niveau d\'italien souhaité même débutant. Préparez une lettre en italien avec notre aide.',
  },
  {
    id: '7',
    year: 2027,
    date: '2027-02-16',
    category: 'Non Saisonniers Généraux',
    title: 'Click Day — Non saisonniers multisecteurs',
    description: 'Construction, transports, industrie, services. Réfugiés et apatrides éligibles.',
    color: 'indigo',
    status: 'upcoming',
    required_docs: ['Passeport valide', 'Diplômes & certifications', 'CV technique bilingue', 'Lettre motivation', 'Casier judiciaire', 'Justificatif domicile'],
    tips: 'Dossier technique très important. Valorisez vos expériences et compétences techniques précises.',
  },
  {
    id: '8',
    year: 2027,
    date: '2027-02-18',
    category: 'Assistance Familiale',
    title: 'Click Day — Aide à domicile et assistance',
    description: 'Aide aux personnes âgées, garde d\'enfants, personnel de maison.',
    color: 'purple',
    status: 'upcoming',
    required_docs: ['Passeport valide', 'Diplôme soins ou attestation expérience', 'CV détaillé expériences', 'Casier judiciaire', 'Références professionnelles'],
    tips: 'Très forte demande italienne. Mettez en avant toute expérience de soins ou garde.',
  },
]

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700'},
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700'},
}

export default function FlussiPage() {
  const [openEvent, setOpenEvent] = useState<string | null>(null)
  const [filterYear, setFilterYear] = useState<2026 | 2027 | 'all'>('all')

  const filtered = FLUSSI_EVENTS.filter(e => filterYear === 'all' || e.year === filterYear)
  const nextUpcoming = FLUSSI_EVENTS.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Calendrier Flussi</h1>
        <p className="text-gray-500 text-sm mt-1">Décret Flussi 2026–2028 — Dates click day et préparation dossier</p>
      </div>

      {/* DISCLAIMER */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex gap-3 items-start">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm mb-1">Important — Ce que ItalianiPro fait et ne fait pas</div>
            <p className="text-xs text-amber-700 leading-relaxed">
              ItalianiPro vous aide à <strong>préparer et organiser votre dossier</strong> en amont des click days.
              Nous n'effectuons <strong>aucune démarche officielle</strong> à votre place.
              La demande de nulla osta est soumise par l'employeur via le portail Sportello Unico delle Immigrazioni.
              ItalianiPro n'a aucun accès à ce système officiel et ne garantit aucune place dans les quotas.
            </p>
          </div>
        </div>
      </div>

      {/* NEXT COUNTDOWN */}
      {nextUpcoming && (
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-2">Prochain click day</div>
              <h2 className="text-xl font-bold mb-1">{nextUpcoming.title}</h2>
              <div className="text-gray-300 text-sm">{formatDate(nextUpcoming.date)} · {nextUpcoming.category}</div>
            </div>
            <div className="flex gap-3 shrink-0">
              {[
                { v: Math.floor(daysUntil(nextUpcoming.date) / 30), l: 'mois' },
                { v: Math.floor((daysUntil(nextUpcoming.date) % 30) / 7), l: 'sem.' },
                { v: daysUntil(nextUpcoming.date) % 7, l: 'jours' },
              ].map(t => (
                <div key={t.l} className="bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[60px]">
                  <div className="text-2xl font-bold text-gold-400">{t.v}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{t.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
            <Bell className="inline w-3 h-3 mr-1 mb-0.5 text-gold-400" />
            Votre dossier doit être complet avant le click day. Idéalement, commencez la préparation 6 mois à l'avance.
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="flex gap-2">
        {(['all', 2026, 2027] as const).map(y => (
          <button
            key={y}
            onClick={() => setFilterYear(y)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold transition',
              filterYear === y
                ? 'bg-navy-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {y === 'all' ? 'Toutes les dates' : `Flussi ${y}`}
          </button>
        ))}
      </div>

      {/* EVENTS */}
      <div className="space-y-3">
        {filtered.map(event => {
          const c = COLOR_MAP[event.color]
          const days = daysUntil(event.date)
          const isOpen = openEvent === event.id

          return (
            <div
              key={event.id}
              className={cn('rounded-2xl border overflow-hidden transition-all', c.border, event.status === 'passed' ? 'opacity-60' : '')}
            >
              <button
                onClick={() => setOpenEvent(isOpen ? null : event.id)}
                className={cn('w-full flex items-center gap-4 p-5 text-left transition hover:bg-gray-50', c.bg)}
              >
                <div className="shrink-0">
                  <Calendar size={20} className={c.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', c.badge)}>{event.category}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', event.status === 'passed' ? 'bg-gray-100 text-gray-500' : 'bg-gold-100 text-gold-700')}>
                      {event.status === 'passed' ? 'Passé' : '✦ À venir'}
                    </span>
                    <span className="text-xs text-gray-400">{event.year}</span>
                  </div>
                  <div className="font-semibold text-navy-900 text-sm">{event.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(event.date)}</div>
                </div>
                <div className="shrink-0 text-right">
                  {event.status === 'upcoming' && days > 0 && (
                    <div className="text-right mb-1">
                      <div className="text-lg font-bold text-navy-800">{days}</div>
                      <div className="text-[10px] text-gray-400">jours</div>
                    </div>
                  )}
                  <ChevronDown size={16} className={cn('text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                </div>
              </button>

              {isOpen && (
                <div className="p-5 pt-0 bg-white border-t border-gray-100 space-y-4 animate-fade-in">
                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                        <FileText size={13} />
                        Documents requis ({event.required_docs.length})
                      </div>
                      <ul className="space-y-1.5">
                        {event.required_docs.map((doc, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle size={11} className="text-green-500 shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={cn('rounded-xl p-4', c.bg, 'border', c.border)}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                        <Info size={13} className={c.text} />
                        <span className={c.text}>Conseil ItalianiPro</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{event.tips}</p>
                    </div>
                  </div>

                  {event.status === 'upcoming' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button className="flex-1 bg-navy-800 hover:bg-navy-700 text-white py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5">
                        <Bell size={13} /> Activer rappel
                      </button>
                      <button className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5">
                        <CheckCircle size={13} /> Préparer mon dossier
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Key info */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs text-gray-500 space-y-2">
        <div className="font-semibold text-gray-700 text-sm">À savoir sur le Décret Flussi</div>
        <p>• Le Décret Flussi fixe chaque année des quotas d'entrée pour travailleurs extra-UE en Italie.</p>
        <p>• Les demandes de nulla osta sont soumises par l'employeur, pas par le candidat.</p>
        <p>• Les quotas sont épuisés en quelques minutes ou secondes lors du click day.</p>
        <p>• Un dossier préparé en amont maximise les chances qu'un employeur vous sélectionne.</p>
        <p>• ItalianiPro ne dépose aucune demande officielle et n'a pas accès au portail Sportello Unico.</p>
      </div>
    </div>
  )
}
