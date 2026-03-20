'use client'

import type { ReactNode } from 'react'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  ApplicationStatus,
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_STYLES,
  CandidateStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  DocumentWorkflowStatus,
} from '@/lib/backoffice'

function Pill(props: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '999px',
        background: props.bg,
        color: props.color,
        fontSize: '12px',
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      {props.label}
    </span>
  )
}

export function CandidateStatusPill({ status }: { status: CandidateStatus }) {
  const style = CANDIDATE_STATUS_STYLES[status]
  return <Pill label={CANDIDATE_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function DocumentStatusPill({ status }: { status: DocumentWorkflowStatus }) {
  const style = DOCUMENT_STATUS_STYLES[status]
  return <Pill label={DOCUMENT_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  const style = APPLICATION_STATUS_STYLES[status]
  return <Pill label={APPLICATION_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function PriorityPill({ score, value }: { score?: number; value?: number }) {
  const actualScore = typeof score === 'number' ? score : value ?? 0
  let bg = '#F3F4F6'
  let color = '#4B5563'
  let label = `Priorite ${actualScore}`

  if (actualScore >= 80) {
    bg = '#FEE2E2'
    color = '#B91C1C'
    label = `Priorite haute ${actualScore}`
  } else if (actualScore >= 60) {
    bg = '#FEF3C7'
    color = '#B45309'
  } else if (actualScore >= 40) {
    bg = '#DBEAFE'
    color = '#1D4ED8'
  }

  return <Pill label={label} bg={bg} color={color} />
}

export function ScoreBar({
  label,
  value,
  footnote,
  color,
}: {
  label?: string
  value: number
  footnote?: string
  color?: string
}) {
  const safeValue = Math.max(0, Math.min(100, value))
  const barColor = color ?? (safeValue >= 70 ? '#15803D' : safeValue >= 40 ? '#B45309' : '#6B7280')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{label ?? 'Score'}</span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: barColor }}>{safeValue}%</span>
      </div>
      <div style={{ height: '8px', borderRadius: '999px', background: '#E5E7EB', overflow: 'hidden' }}>
        <div style={{ width: `${safeValue}%`, height: '100%', borderRadius: '999px', background: barColor }} />
      </div>
      {footnote ? <span style={{ fontSize: '12px', color: '#6B7280' }}>{footnote}</span> : null}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111827' }}>{title}</h2>
          {description ? <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6B7280' }}>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function MetricCard({
  label,
  value,
  icon,
  helper,
  tone = '#1B3A6B',
}: {
  label: string
  value: string | number
  icon: ReactNode
  helper?: string
  tone?: string
}) {
  return (
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `${tone}14`,
          color: tone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{label}</div>
      {helper ? <div style={{ fontSize: '12px', color: '#6B7280' }}>{helper}</div> : null}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div style={{ border: '1px dashed #D1D5DB', borderRadius: '16px', padding: '28px 20px', textAlign: 'center', color: '#6B7280' }}>
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}
