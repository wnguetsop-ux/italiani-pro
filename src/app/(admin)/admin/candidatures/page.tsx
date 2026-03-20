'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { loadBackofficeIndex } from '@/lib/backoffice-data'
import { ApplicationStatus, CandidateRecord, isFollowUpDue, toDate } from '@/lib/backoffice'
import { fmt_date } from '@/lib/utils'
import { ApplicationStatusPill, EmptyState, SectionCard } from '@/components/backoffice/BackofficeUi'

type ApplicationRow = {
  candidate: CandidateRecord
  id: string
  platform: string
  employer: string
  jobTitle: string
  status: ApplicationStatus
  submittedAt: Date | null
  followUpAt: Date | null
  result: string
}

const STATUS_FILTERS: { value: 'ALL' | ApplicationStatus; label: string }[] = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'TO_SEND', label: 'A envoyer' },
  { value: 'SENT', label: 'Envoyees' },
  { value: 'WAITING_REPLY', label: 'En attente' },
  { value: 'FOLLOW_UP_DUE', label: 'Relance a faire' },
  { value: 'POSITIVE', label: 'Positives' },
  { value: 'NEGATIVE', label: 'Negatives' },
]

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL')

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const candidates = await loadBackofficeIndex()
      const nextRows = candidates.flatMap((candidate) =>
        candidate.applications.map((application) => ({
          candidate,
          id: application.id,
          platform: String(application.platform || ''),
          employer: String(application.employer || ''),
          jobTitle: String(application.jobTitle || ''),
          status: (application.status || 'TO_SEND') as ApplicationStatus,
          submittedAt: toDate(application.submittedAt ?? application.createdAt),
          followUpAt: toDate(application.followUpAt),
          result: String(application.result || ''),
        })),
      )
      nextRows.sort((left, right) => (right.submittedAt?.getTime() ?? 0) - (left.submittedAt?.getTime() ?? 0))
      setRows(nextRows)
    } catch (error: any) {
      console.error('applications-load-error', error)
      toast.error(error?.message || 'Impossible de charger les candidatures')
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
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.candidate.fullName.toLowerCase().includes(query) ||
        row.platform.toLowerCase().includes(query) ||
        row.employer.toLowerCase().includes(query) ||
        row.jobTitle.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '10px', color: '#6B7280' }}>
        <span className="spinner" />
        Chargement des candidatures...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>Candidatures</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            Vue globale de tous les envois, attentes et relances.
          </p>
        </div>
        <button onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : undefined }} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="card" style={{ padding: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,2fr) minmax(200px,1fr)', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Candidat, plateforme, employeur, poste..." style={{ paddingLeft: '38px' }} />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | ApplicationStatus)}>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <SectionCard title={`Toutes les candidatures (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={22} color="#9CA3AF" />} title="Aucune candidature sur ce filtre" description="Les envois apparaitront ici des qu une candidature sera creee dans une fiche candidat." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Candidat</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Plateforme</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Employeur / Poste</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Envoi</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Relance</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Resultat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #F0F2F5' }}>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/candidats/${row.candidate.id}`} style={{ textDecoration: 'none', color: '#1B3A6B', fontWeight: 700 }}>
                        {row.candidate.fullName}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>{row.platform || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{row.employer || '-'}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{row.jobTitle || '-'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <ApplicationStatusPill status={row.status} />
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{row.submittedAt ? fmt_date(row.submittedAt) : '-'}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap', color: isFollowUpDue({ id: row.id, status: row.status, followUpAt: row.followUpAt }) ? '#B45309' : '#374151' }}>
                      {row.followUpAt ? fmt_date(row.followUpAt) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{row.result || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
