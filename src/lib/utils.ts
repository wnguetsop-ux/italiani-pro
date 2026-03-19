import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, locale: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy', { locale: locale === 'fr' ? fr : enUS })
}

export function formatRelative(date: string | Date, locale: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: locale === 'fr' ? fr : enUS })
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return differenceInDays(d, new Date())
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft:           'bg-gray-100 text-gray-600',
    submitted:       'bg-blue-100 text-blue-700',
    incomplete:      'bg-red-100 text-red-700',
    in_review:       'bg-blue-100 text-blue-700',
    pending_payment: 'bg-orange-100 text-orange-700',
    in_progress:     'bg-indigo-100 text-indigo-700',
    awaiting_client: 'bg-yellow-100 text-yellow-700',
    ready:           'bg-green-100 text-green-700',
    suspended:       'bg-red-100 text-red-700',
    archived:        'bg-gray-100 text-gray-500',
    completed:       'bg-emerald-100 text-emerald-700',
    pending:         'bg-yellow-100 text-yellow-700',
    uploaded:        'bg-blue-100 text-blue-700',
    approved:        'bg-green-100 text-green-700',
    rejected:        'bg-red-100 text-red-700',
    expired:         'bg-red-100 text-red-600',
    paid:            'bg-green-100 text-green-700',
    failed:          'bg-red-100 text-red-700',
    scheduled:       'bg-blue-100 text-blue-700',
    confirmed:       'bg-indigo-100 text-indigo-700',
    cancelled:       'bg-red-100 text-red-600',
    open:            'bg-blue-100 text-blue-700',
    resolved:        'bg-green-100 text-green-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function getStatusLabel(status: string, lang: 'fr' | 'en' = 'fr'): string {
  const fr_labels: Record<string, string> = {
    draft:           'Brouillon',
    submitted:       'Soumis',
    incomplete:      'Incomplet',
    in_review:       'En vérification',
    pending_payment: 'En attente paiement',
    in_progress:     'En cours',
    awaiting_client: 'En attente client',
    ready:           'Prêt',
    suspended:       'Suspendu',
    archived:        'Archivé',
    completed:       'Terminé',
    pending:         'En attente',
    uploaded:        'Uploadé',
    approved:        'Validé',
    rejected:        'Rejeté',
    expired:         'Expiré',
    paid:            'Payé',
    failed:          'Échoué',
    scheduled:       'Planifié',
    confirmed:       'Confirmé',
    cancelled:       'Annulé',
    open:            'Ouvert',
    resolved:        'Résolu',
  }
  const en_labels: Record<string, string> = {
    draft:           'Draft',
    submitted:       'Submitted',
    incomplete:      'Incomplete',
    in_review:       'Under Review',
    pending_payment: 'Awaiting Payment',
    in_progress:     'In Progress',
    awaiting_client: 'Awaiting Client',
    ready:           'Ready',
    suspended:       'Suspended',
    archived:        'Archived',
    completed:       'Completed',
    pending:         'Pending',
    uploaded:        'Uploaded',
    approved:        'Approved',
    rejected:        'Rejected',
    expired:         'Expired',
    paid:            'Paid',
    failed:          'Failed',
    scheduled:       'Scheduled',
    confirmed:       'Confirmed',
    cancelled:       'Cancelled',
    open:            'Open',
    resolved:        'Resolved',
  }
  const labels = lang === 'fr' ? fr_labels : en_labels
  return labels[status] ?? status
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}
