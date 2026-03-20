'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ClipboardList, Flame, RefreshCw, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { loadBackofficeIndex } from '@/lib/backoffice-data'
import { CandidateRecord, getBlockerReason, isFollowUpDue, sortCandidatesForWork, toDate } from '@/lib/backoffice'
import { fmt_date, relative_time } from '@/lib/utils'
import { CandidateStatusPill, EmptyState, MetricCard, PriorityPill, ScoreBar, SectionCard } from '@/components/backoffice/BackofficeUi'

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString()
}

export default function AdminDashboardPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await loadBackofficeIndex()
      setCandidates(result)
    } catch (error: any) {
      console.error('admin-dashboard-load-error', error)
      toast.error(error?.message || 'Impossible de charger le back-office')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const view = useMemo(() => {
    const today = new Date()
    const workQueue = sortCandidatesForWork(candidates).slice(0, 10)
    const allApplications = candidates.flatMap((candidate) =>
      candidate.applications.map((application) => ({
        candidate,
        application,
      })),
    )
    const followUps = allApplications
      .filter(({ application }) => isFollowUpDue(application, today))
      .sort((left, right) => (toDate(left.application.followUpAt)?.getTime() ?? 0) - (toDate(right.application.followUpAt)?.getTime() ?? 0))
      .slice(0, 10)
    const blockers = candidates
      .map((candidate) => ({ candidate, blocker: getBlockerReason(candidate) }))
      .filter((item) => Boolean(item.blocker))
      .slice(0, 10)
    const latestActivities = candidates
      .flatMap((candidate) =>
        candidate.activities.map((activity) => ({
          candidate,
          activity,
          createdAt: toDate(activity.created_at ?? activity.createdAt),
        })),
      )
      .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0))
      .slice(0, 8)

    const sentToday = allApplications.filter(({ application }) => {
      const submittedAt = toDate(application.submittedAt ?? application.createdAt)
      return Boolean(submittedAt && isSameDay(submittedAt, today))
    }).length

    const sentThisWeek = allApplications.filter(({ application }) => {
      const submittedAt = toDate(application.submittedAt ?? application.createdAt)
      if (!submittedAt) return false
      return today.getTime() - submittedAt.getTime() <= 7 * 24 * 60 * 60 * 1000
    }).length

    return {
      newCount: candidates.filter((candidate) => candidate.workflowStatus === 'NEW').length,
      reviewCount: candidates.filter((candidate) => candidate.workflowStatus === 'TO_REVIEW').length,
      waitingCount: candidates.filter((candidate) => candidate.workflowStatus === 'WAITING_CANDIDATE').length,
      readyCount: candidates.filter((candidate) => candidate.workflowStatus === 'READY_TO_APPLY').length,
      followUpCount: candidates.reduce((total, candidate) => total + candidate.followUpsDueToday, 0),
      sentToday,
      sentThisWeek,
      workQueue,
      followUps,
      blockers,
      latestActivities,
    }
  }, [candidates])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#6B7280', gap: '10px' }}>
        <span className="spinner" />
        Chargement du dashboard...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>Dashboard back-office</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
            Pilotage quotidien des dossiers, candidatures et relances.
          </p>
        </div>
        <button onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : undefined }} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
        <MetricCard label="Nouveaux dossiers" value={view.newCount} icon={<Users size={18} />} helper="A trier et qualifier" />
        <MetricCard label="A verifier" value={view.reviewCount} icon={<ClipboardList size={18} />} tone="#2563EB" helper="Documents recus a controler" />
        <MetricCard label="Incomplets" value={view.waitingCount} icon={<AlertTriangle size={18} />} tone="#B45309" helper="En attente du candidat" />
        <MetricCard label="Prets a postuler" value={view.readyCount} icon={<Flame size={18} />} tone="#15803D" helper="Peuvent partir en vague d envoi" />
        <MetricCard label="Envoyes aujourd hui" value={view.sentToday} icon={<Send size={18} />} tone="#4338CA" helper={`Cette semaine: ${view.sentThisWeek}`} />
        <MetricCard label="Relances dues" value={view.followUpCount} icon={<RefreshCw size={18} />} tone="#B45309" helper="A traiter en priorite" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: '16px' }}>
        <SectionCard title="A traiter maintenant" description="Top 10 tries par relances dues, priorite puis date d action." action={<Link href="/admin/candidats" className="btn btn-secondary btn-sm">Vue candidats</Link>}>
          {view.workQueue.length === 0 ? (
            <EmptyState icon={<Users size={20} color="#9CA3AF" />} title="Aucun dossier a traiter" description="Les nouveaux dossiers et relances apparaitront ici automatiquement." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {view.workQueue.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/admin/candidats/${candidate.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #EEF2F7', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>{candidate.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                        {candidate.targetJob || 'Metier non defini'} · {candidate.pack || 'Pack non defini'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <CandidateStatusPill status={candidate.workflowStatus} />
                      <PriorityPill score={candidate.priorityScore} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{candidate.nextAction}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {candidate.nextActionAt ? fmt_date(candidate.nextActionAt) : 'Sans date'}
                    </div>
                    <div style={{ fontSize: '12px', color: candidate.followUpsDueToday > 0 ? '#B45309' : '#6B7280', whiteSpace: 'nowrap' }}>
                      {candidate.followUpsDueToday > 0 ? `${candidate.followUpsDueToday} relance(s)` : `${candidate.applicationsCount} candidature(s)`}
                    </div>
                  </div>
                  <ScoreBar label="Completude dossier" value={candidate.dossierCompletenessPercent} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard title="Relances du jour" description="Candidatures avec suivi du jour ou en retard.">
            {view.followUps.length === 0 ? (
              <EmptyState icon={<RefreshCw size={20} color="#9CA3AF" />} title="Aucune relance aujourd hui" description="La file des relances apparaitra ici quand des dates de suivi seront dues." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {view.followUps.map(({ candidate, application }) => (
                  <Link
                    key={application.id}
                    href={`/admin/candidats/${candidate.id}?tab=candidatures`}
                    style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #EEF2F7', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{candidate.fullName}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>
                      {application.jobTitle || 'Poste a preciser'} · {application.employer || application.platform || 'Plateforme a preciser'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#B45309' }}>
                      Relance: {application.followUpAt ? fmt_date(application.followUpAt) : 'A dater'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Blocages" description="Dossiers a debloquer rapidement.">
            {view.blockers.length === 0 ? (
              <EmptyState icon={<AlertTriangle size={20} color="#9CA3AF" />} title="Aucun blocage critique" description="Les dossiers avec pieces invalides ou actions en retard s afficheront ici." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {view.blockers.map(({ candidate, blocker }) => (
                  <Link
                    key={candidate.id}
                    href={`/admin/candidats/${candidate.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #FEE2E2', background: '#FFFBFB', borderRadius: '12px', padding: '12px' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{candidate.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px' }}>{blocker}</div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Dernieres activites" description="Trace recente des validations, relances et mises a jour.">
        {view.latestActivities.length === 0 ? (
          <EmptyState icon={<ClipboardList size={20} color="#9CA3AF" />} title="Aucune activite recente" description="Les validations, relances et envois apparaitront ici." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Candidat</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Quand</th>
                </tr>
              </thead>
              <tbody>
                {view.latestActivities.map(({ candidate, activity, createdAt }) => (
                  <tr key={activity.id} style={{ borderTop: '1px solid #F0F2F5' }}>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/candidats/${candidate.id}`} style={{ color: '#1B3A6B', textDecoration: 'none', fontWeight: 700 }}>
                        {candidate.fullName}
                      </Link>
                    </td>
                    <td style={{ padding: '12px', color: '#111827', fontWeight: 600 }}>{activity.title || activity.type || '-'}</td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{activity.description || '-'}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#6B7280' }}>{createdAt ? relative_time(createdAt) : '-'}</td>
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
