import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...i: ClassValue[]) { return twMerge(clsx(i)) }

export function fmt_date(d: any): string {
  if (!d) return '-'
  const date = d?.toDate ? d.toDate() : new Date(d)
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}

export function fmt_time(d: any): string {
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : new Date(d)
  return date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
}

export function fmt_xaf(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'XAF', minimumFractionDigits:0 }).format(n)
}

export function fmt_size(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1048576) return `${(bytes/1024).toFixed(0)} Ko`
  return `${(bytes/1048576).toFixed(1)} Mo`
}

export function initiales(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function days_until(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

export function relative_time(d: any): string {
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : new Date(d)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'a l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`
  return fmt_date(date)
}

export const STATUT_LABEL: Record<string, string> = {
  nouveau: 'Nouveau',
  incomplet: 'Incomplet',
  en_cours: 'En cours',
  en_verification: 'En verification',
  attente_paiement: 'Attente paiement',
  attente_client: 'Attente client',
  pret: 'Pret',
  termine: 'Termine',
  suspendu: 'Suspendu',
  NEW: 'Nouveau dossier',
  TO_REVIEW: 'A verifier',
  WAITING_CANDIDATE: 'En attente candidat',
  READY_FOR_CV: 'Pret CV',
  CV_IN_PROGRESS: 'CV en cours',
  READY_TO_APPLY: 'Pret a postuler',
  APPLYING: 'Candidatures en cours',
  FOLLOW_UP: 'Relance a faire',
  POSITIVE: 'Reponse positive',
  NEGATIVE: 'Refuse',
  ON_HOLD: 'En pause',
  ARCHIVED: 'Archive',
}

export const STATUT_BADGE: Record<string, string> = {
  nouveau: 'badge-draft',
  incomplet: 'badge-pending',
  en_cours: 'badge-progress',
  en_verification: 'badge-review',
  attente_paiement: 'badge-pending',
  attente_client: 'badge-pending',
  pret: 'badge-ready',
  termine: 'badge-done',
  suspendu: 'badge-rejected',
  NEW: 'badge-draft',
  TO_REVIEW: 'badge-review',
  WAITING_CANDIDATE: 'badge-pending',
  READY_FOR_CV: 'badge-progress',
  CV_IN_PROGRESS: 'badge-progress',
  READY_TO_APPLY: 'badge-ready',
  APPLYING: 'badge-progress',
  FOLLOW_UP: 'badge-pending',
  POSITIVE: 'badge-done',
  NEGATIVE: 'badge-rejected',
  ON_HOLD: 'badge-pending',
  ARCHIVED: 'badge-done',
}

export const DOC_STATUT_BADGE: Record<string, string> = {
  uploade: 'badge-uploaded',
  approuve: 'badge-approved',
  rejete: 'badge-rejected',
  en_verification: 'badge-review',
  RECEIVED: 'badge-uploaded',
  TO_TRANSLATE: 'badge-review',
  TRANSLATED: 'badge-progress',
  VALIDATED: 'badge-approved',
  MISSING: 'badge-pending',
  INVALID: 'badge-rejected',
  EXPIRED: 'badge-rejected',
}

export const DOC_STATUT_LABEL: Record<string, string> = {
  uploade: 'Uploade',
  approuve: 'Approuve',
  rejete: 'Rejete',
  en_verification: 'En revision',
  RECEIVED: 'Recu',
  TO_TRANSLATE: 'A traduire',
  TRANSLATED: 'Traduit',
  VALIDATED: 'Valide',
  MISSING: 'Manquant',
  INVALID: 'Invalide',
  EXPIRED: 'Expire',
}
