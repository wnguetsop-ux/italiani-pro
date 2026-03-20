'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, LayoutGrid, List, RefreshCw, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { loadBackofficeIndex } from '@/lib/backoffice-data'
import { CandidateRecord, CandidateStatus, CANDIDATE_STATUS_LABELS, KANBAN_COLUMNS, sortCandidatesForWork } from '@/lib/backoffice'
import { fmt_date } from '@/lib/utils'
import { CandidateStatusPill, EmptyState, PriorityPill, ScoreBar, SectionCard } from '@/components/backoffice/BackofficeUi'

const STATUS_FILTERS: { value: 'ALL' | CandidateStatus | 'URGENT'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'URGENT', label: 'Urgents' },
  { value: 'NEW', label: CANDIDATE_STATUS_LABELS.NEW },
  { value: 'TO_REVIEW', label: CANDIDATE_STATUS_LABELS.TO_REVIEW },
  { value: 'WAITING_CANDIDATE', label: CANDIDATE_STATUS_LABELS.WAITING_CANDIDATE },
  { value: 'READY_FOR_CV', label: CANDIDATE_STATUS_LABELS.READY_FOR_CV },
  { value: 'CV_IN_PROGRESS', label: CANDIDATE_STATUS_LABELS.CV_IN_PROGRESS },
  { value: 'READY_TO_APPLY', label: CANDIDATE_STATUS_LABELS.READY_TO_APPLY },
  { value: 'APPLYING', label: CANDIDATE_STATUS_LABELS.APPLYING },
  { value: 'FOLLOW_UP', label: CANDIDATE_STATUS_LABELS.FOLLOW_UP },
]

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CandidateStatus | 'URGENT'>('ALL')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await loadBackofficeIndex()
      setCandidates(sortCandidatesForWork(result))
    } catch (error: any) {
      console.error('admin-candidates-load-error', error)
      toast.error(error?.message || 'Impossible de charger les dossiers')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return candidates.filter((candidate) => {
      const matchesSearch =
        !query ||
        candidate.fullName.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        candidate.whatsapp.toLowerCase().includes(query) ||
        candidate.targetJob.toLowerCase().includes(query) ||
        candidate.pack.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'URGENT' ? candidate.isUrgent : candidate.workflowStatus === statusFilter)

      return matchesSearch && matchesStatus
    })
  }, [candidates, search, statusFilter])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#6B7280', gap: '10px' }}>
        <span className="spinner" />
        Chargement des candidats...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>Pipeline candidats</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
            Vue liste et kanban pour piloter les dossiers sans sortir de l application.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setViewMode('kanban')} className="btn btn-secondary btn-sm" style={{ borderColor: viewMode === 'kanban' ? '#1B3A6B' : undefined }}>
            <LayoutGrid size={14} /> Kanban
          </button>
          <button onClick={() => setViewMode('list')} className="btn btn-secondary btn-sm" style={{ borderColor: viewMode === 'list' ? '#1B3A6B' : undefined }}>
            <List size={14} /> Liste
          </button>
          <button onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : undefined }} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,2fr) minmax(160px,1fr)', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, WhatsApp, metier, pack..." style={{ paddingLeft: '38px' }} />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | CandidateStatus | 'URGENT')}>
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>{filtered.length} dossier(s) visibles</div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={20} color="#9CA3AF" />} title="Aucun dossier sur ce filtre" description="Elargissez les filtres ou attendez l arrivee de nouveaux candidats." />
      ) : viewMode === 'list' ? (
        <SectionCard title={`Liste operationnelle (${filtered.length})`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Candidat</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Completude</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Prochaine action</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Due</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Priorite</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => (
                  <tr key={candidate.id} style={{ borderTop: '1px solid #F0F2F5' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{candidate.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                        {candidate.targetJob || 'Metier non defini'} · {candidate.pack || 'Pack non defini'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <CandidateStatusPill status={candidate.workflowStatus} />
                    </td>
                    <td style={{ padding: '12px', minWidth: '170px' }}>
                      <ScoreBar label="Dossier" value={candidate.dossierCompletenessPercent} footnote={`${candidate.documentsValidatedCount}/${candidate.documentsReceivedCount || 0} documents valides`} />
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>{candidate.nextAction}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#6B7280' }}>{candidate.nextActionAt ? fmt_date(candidate.nextActionAt) : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <PriorityPill score={candidate.priorityScore} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Link href={`/admin/candidats/${candidate.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,minmax(260px,1fr))', gap: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {KANBAN_COLUMNS.map((column) => {
            const items = filtered.filter((candidate) => column.statuses.includes(candidate.workflowStatus))
            return (
              <div key={column.key} style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '260px' }}>
                <div className="card" style={{ padding: '12px 14px', position: 'sticky', top: '70px', zIndex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>{column.label}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{items.length} dossier(s)</div>
                </div>

                {items.length === 0 ? (
                  <div style={{ border: '1px dashed #D1D5DB', borderRadius: '14px', padding: '16px', color: '#9CA3AF', fontSize: '12px' }}>Aucun dossier</div>
                ) : (
                  items.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/admin/candidats/${candidate.id}`}
                      className="card"
                      style={{ textDecoration: 'none', color: 'inherit', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{candidate.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{candidate.targetJob || 'Metier non defini'}</div>
                        </div>
                        <PriorityPill score={candidate.priorityScore} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#374151' }}>{candidate.pack || 'Pack non defini'}</div>
                      <ScoreBar label="Completude" value={candidate.dossierCompletenessPercent} />
                      <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{candidate.nextAction}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: '#6B7280', flexWrap: 'wrap' }}>
                        <span>{candidate.documentsMissingCount} doc(s) manquant(s)</span>
                        <span>{candidate.applicationsCount} candidature(s)</span>
                        <span>{candidate.nextActionAt ? fmt_date(candidate.nextActionAt) : 'Sans date'}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
