'use client'

import { ReactNode } from 'react'
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

export function StatusPill(props: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '999px',
        background: props.bg,
        color: props.color,
        whiteSpace: 'nowrap',
      }}
    >
      {props.label}
    </span>
  )
}

export function CandidateStatusPill({ status }: { status: CandidateStatus }) {
  const style = CANDIDATE_STATUS_STYLES[status]
  return <StatusPill label={CANDIDATE_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function DocumentStatusPill({ status }: { status: DocumentWorkflowStatus }) {
  const style = DOCUMENT_STATUS_STYLES[status]
  return <StatusPill label={DOCUMENT_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  const style = APPLICATION_STATUS_STYLES[status]
  return <StatusPill label={APPLICATION_STATUS_LABELS[status]} bg={style.bg} color={style.color} />
}

export function PriorityPill({ value }: { value: number }) {
  const color =
    value >= 80 ? { bg: '#FEE2E2', color: '#B91C1C' } :
    value >= 60 ? { bg: '#FEF3C7', color: '#B45309' } :
    { bg: '#ECFDF5', color: '#166534' }

  return <StatusPill label={`Priorite ${value}`} bg={color.bg} color={color.color} />
}

export function ScoreBar({ value, color = '#1B3A6B' }: { value: number; color?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
      <div style={{ width:'72px', height:'6px', background:'#E5E7EB', borderRadius:'999px', overflow:'hidden' }}>
        <div style={{ width:`${Math.max(0, Math.min(100, value))}%`, height:'100%', background:color, borderRadius:'999px' }} />
      </div>
      <span style={{ fontSize:'12px', fontWeight:'700', color }}>{value}%</span>
    </div>
  )
}

export function MetricCard(props: {
  label: string
  value: string | number
  hint?: string
  color?: string
  bg?: string
}) {
  return (
    <div className="card" style={{ padding:'14px', background:props.bg ?? 'white' }}>
      <div style={{ fontSize:'24px', fontWeight:'900', color:props.color ?? '#111827', lineHeight:1 }}>{props.value}</div>
      <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>{props.label}</div>
      {props.hint && <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>{props.hint}</div>}
    </div>
  )
}

export function SectionCard(props: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card" style={{ padding:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
        <h2 style={{ fontSize:'16px', fontWeight:'800', margin:0 }}>{props.title}</h2>
        {props.action}
      </div>
      {props.children}
    </div>
  )
}

export function EmptyState(props: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div style={{ padding:'32px 20px', textAlign:'center' }}>
      <div style={{ width:'52px', height:'52px', margin:'0 auto 12px', borderRadius:'14px', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {props.icon}
      </div>
      <h3 style={{ fontSize:'15px', fontWeight:'700', margin:'0 0 6px' }}>{props.title}</h3>
      <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 auto', maxWidth:'420px', lineHeight:'1.6' }}>{props.description}</p>
      {props.action && <div style={{ marginTop:'14px' }}>{props.action}</div>}
    </div>
  )
}
