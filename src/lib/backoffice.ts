export type CandidateStatus =
  | 'NEW'
  | 'TO_REVIEW'
  | 'WAITING_CANDIDATE'
  | 'READY_FOR_CV'
  | 'CV_IN_PROGRESS'
  | 'READY_TO_APPLY'
  | 'APPLYING'
  | 'FOLLOW_UP'
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'ON_HOLD'
  | 'ARCHIVED'

export type DocumentWorkflowStatus =
  | 'RECEIVED'
  | 'TO_TRANSLATE'
  | 'TRANSLATED'
  | 'VALIDATED'
  | 'MISSING'
  | 'INVALID'
  | 'EXPIRED'

export type ApplicationStatus =
  | 'TO_SEND'
  | 'SENT'
  | 'WAITING_REPLY'
  | 'FOLLOW_UP_DUE'
  | 'POSITIVE'
  | 'NEGATIVE'

export type ChecklistSectionKey =
  | 'dossier_recu'
  | 'dossier_incomplet'
  | 'dossier_complet'
  | 'cv_pret'
  | 'dossier_pret'
  | 'candidature_envoyee'
  | 'relance_faite'

export interface ChecklistItemDefinition {
  key: string
  label: string
}

export interface ChecklistSectionDefinition {
  key: ChecklistSectionKey
  label: string
  items: ChecklistItemDefinition[]
}

export type ChecklistState = Record<ChecklistSectionKey, Record<string, boolean>>

export interface CandidateUserDoc {
  uid?: string
  full_name?: string
  email?: string
  phone?: string
  whatsapp?: string
  country_code?: string
  role?: string
  [key: string]: unknown
}

export interface CandidateDossierDoc {
  workflow_status?: CandidateStatus
  statut?: string
  pack?: string
  pack_type?: string
  profession?: string
  target_job?: string
  secteur_cible?: string
  sector?: string
  region_italie?: string
  preferred_region_italy?: string
  score_completion?: number
  readiness_score?: number
  priority_score?: number
  dossier_completeness_percent?: number
  next_action?: string
  next_action_at?: unknown
  internal_notes?: string
  checklists?: Partial<ChecklistState>
  click_day_urgent?: boolean
  is_urgent?: boolean
  payment_status?: string
  source_channel?: string
  assigned_to?: string
  tags?: string[]
  updated_at?: unknown
  created_at?: unknown
  [key: string]: unknown
}

export interface CandidateDocumentDoc {
  id: string
  uid?: string
  candidateId?: string
  nom?: string
  original_name?: string
  statut?: string
  workflow_status?: DocumentWorkflowStatus
  type_doc?: string
  doc_type?: string
  source_language?: string
  translated_language?: string
  translation_ready?: boolean
  final_version?: boolean
  file_url?: string | null
  file_path?: string | null
  mime_type?: string
  taille?: number
  generated_by_ai?: boolean
  generated_asset_key?: string
  render_payload?: {
    type?: 'cv' | 'cover_letter'
    lang?: string
    data?: Record<string, unknown>
  }
  created_at?: unknown
  updated_at?: unknown
  received_at?: unknown
  validated_at?: unknown
  content_text?: string
  [key: string]: unknown
}

export interface CandidateApplicationDoc {
  id: string
  candidateId?: string
  uid?: string
  platform?: string
  employer?: string
  jobTitle?: string
  status?: ApplicationStatus
  result?: string
  notes?: string
  proofPath?: string
  submittedAt?: unknown
  followUpAt?: unknown
  lastContactAt?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  [key: string]: unknown
}

export interface ActivityLogDoc {
  id: string
  candidateId?: string
  uid?: string
  type?: string
  title?: string
  description?: string
  actorName?: string
  actorRole?: string
  metadata?: Record<string, unknown>
  created_at?: unknown
  createdAt?: unknown
  [key: string]: unknown
}

export interface CandidateRecord {
  id: string
  code: string
  fullName: string
  email: string
  whatsapp: string
  country: string
  pack: string
  targetJob: string
  sector: string
  preferredRegionItaly: string
  workflowStatus: CandidateStatus
  legacyStatus: string
  statusLabel: string
  nextAction: string
  nextActionAt: Date | null
  internalNotes: string
  priorityScore: number
  readinessScore: number
  dossierCompletenessPercent: number
  documentsReceivedCount: number
  documentsMissingCount: number
  documentsValidatedCount: number
  translationsDoneCount: number
  applicationsCount: number
  followUpsDueToday: number
  invalidDocumentsCount: number
  lastApplicationAt: Date | null
  lastContactAt: Date | null
  lastActivityAt: Date | null
  isUrgent: boolean
  checklist: ChecklistState
  checklistCompleted: number
  checklistTotal: number
  user: CandidateUserDoc
  dossier: CandidateDossierDoc
  documents: CandidateDocumentDoc[]
  applications: CandidateApplicationDoc[]
  activities: ActivityLogDoc[]
}

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'Nouveau dossier',
  TO_REVIEW: 'A verifier',
  WAITING_CANDIDATE: 'En attente candidat',
  READY_FOR_CV: 'Pret CV',
  CV_IN_PROGRESS: 'CV en cours',
  READY_TO_APPLY: 'Pret a postuler',
  APPLYING: 'Candidatures en cours',
  FOLLOW_UP: 'Relances aujourd hui',
  POSITIVE: 'Reponse positive',
  NEGATIVE: 'Refuse',
  ON_HOLD: 'En pause',
  ARCHIVED: 'Archive',
}

export const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, { bg: string; color: string }> = {
  NEW: { bg: '#F3F4F6', color: '#6B7280' },
  TO_REVIEW: { bg: '#EFF6FF', color: '#2563EB' },
  WAITING_CANDIDATE: { bg: '#FFF7ED', color: '#C2410C' },
  READY_FOR_CV: { bg: '#EEF2FF', color: '#4338CA' },
  CV_IN_PROGRESS: { bg: '#F5F3FF', color: '#7C3AED' },
  READY_TO_APPLY: { bg: '#ECFCCB', color: '#4D7C0F' },
  APPLYING: { bg: '#F0FDF4', color: '#15803D' },
  FOLLOW_UP: { bg: '#FEF3C7', color: '#B45309' },
  POSITIVE: { bg: '#DCFCE7', color: '#166534' },
  NEGATIVE: { bg: '#FEE2E2', color: '#B91C1C' },
  ON_HOLD: { bg: '#F3F4F6', color: '#6B7280' },
  ARCHIVED: { bg: '#E5E7EB', color: '#374151' },
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentWorkflowStatus, string> = {
  RECEIVED: 'Recu',
  TO_TRANSLATE: 'A traduire',
  TRANSLATED: 'Traduit',
  VALIDATED: 'Valide',
  MISSING: 'Manquant',
  INVALID: 'Invalide',
  EXPIRED: 'Expire',
}

export const DOCUMENT_STATUS_STYLES: Record<DocumentWorkflowStatus, { bg: string; color: string }> = {
  RECEIVED: { bg: '#EFF6FF', color: '#2563EB' },
  TO_TRANSLATE: { bg: '#F5F3FF', color: '#7C3AED' },
  TRANSLATED: { bg: '#EEF2FF', color: '#4338CA' },
  VALIDATED: { bg: '#DCFCE7', color: '#166534' },
  MISSING: { bg: '#FFF7ED', color: '#C2410C' },
  INVALID: { bg: '#FEE2E2', color: '#B91C1C' },
  EXPIRED: { bg: '#FEF3C7', color: '#B45309' },
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  TO_SEND: 'A envoyer',
  SENT: 'Envoyee',
  WAITING_REPLY: 'En attente',
  FOLLOW_UP_DUE: 'Relance a faire',
  POSITIVE: 'Positive',
  NEGATIVE: 'Negative',
}

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, { bg: string; color: string }> = {
  TO_SEND: { bg: '#EFF6FF', color: '#2563EB' },
  SENT: { bg: '#EEF2FF', color: '#4338CA' },
  WAITING_REPLY: { bg: '#F5F3FF', color: '#7C3AED' },
  FOLLOW_UP_DUE: { bg: '#FEF3C7', color: '#B45309' },
  POSITIVE: { bg: '#DCFCE7', color: '#166534' },
  NEGATIVE: { bg: '#FEE2E2', color: '#B91C1C' },
}

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passeport' },
  { value: 'cv', label: 'CV' },
  { value: 'diploma', label: 'Diplome' },
  { value: 'birth_certificate', label: 'Acte de naissance' },
  { value: 'criminal_record', label: 'Casier judiciaire' },
  { value: 'work_proof', label: 'Preuve d experience' },
  { value: 'cover_letter', label: 'Lettre de motivation' },
  { value: 'other', label: 'Autre' },
] as const

export const CHECKLIST_SECTIONS: ChecklistSectionDefinition[] = [
  {
    key: 'dossier_recu',
    label: 'Dossier recu',
    items: [
      { key: 'profil_minimum_ok', label: 'Profil minimum complete' },
      { key: 'pieces_listees', label: 'Pieces recues listees' },
      { key: 'manquants_identifies', label: 'Pieces manquantes identifiees' },
      { key: 'prochaine_action_fixee', label: 'Prochaine action definie' },
    ],
  },
  {
    key: 'dossier_incomplet',
    label: 'Dossier incomplet',
    items: [
      { key: 'manquants_nommes', label: 'Manquants nommes clairement' },
      { key: 'message_envoye', label: 'Message envoye au candidat' },
      { key: 'relance_planifiee', label: 'Date de relance definie' },
      { key: 'statut_attente_active', label: 'Statut attente candidat pose' },
    ],
  },
  {
    key: 'dossier_complet',
    label: 'Dossier complet',
    items: [
      { key: 'pieces_obligatoires_validees', label: 'Pieces obligatoires validees' },
      { key: 'traductions_terminees', label: 'Traductions terminees' },
      { key: 'dossier_local_prepare', label: 'Structure locale preparee' },
      { key: 'passage_ready_for_cv', label: 'Pret pour adaptation du CV' },
    ],
  },
  {
    key: 'cv_pret',
    label: 'CV pret',
    items: [
      { key: 'metier_verrouille', label: 'Metier cible verrouille' },
      { key: 'cv_fr_it_final', label: 'CV FR/IT finalise' },
      { key: 'relecture_interne', label: 'Relecture interne faite' },
      { key: 'cv_classe', label: 'CV et lettres ranges' },
    ],
  },
  {
    key: 'dossier_pret',
    label: 'Pret a postuler',
    items: [
      { key: 'bundle_final_pret', label: 'Bundle final pret' },
      { key: 'plateformes_cibles_notees', label: 'Plateformes cibles notees' },
      { key: 'premiere_vague_planifiee', label: 'Premiere vague planifiee' },
    ],
  },
  {
    key: 'candidature_envoyee',
    label: 'Candidature envoyee',
    items: [
      { key: 'ligne_creee', label: 'Ligne candidature creee' },
      { key: 'preuve_enregistree', label: 'Preuve enregistree' },
      { key: 'prochaine_relance_datee', label: 'Prochaine relance datee' },
    ],
  },
  {
    key: 'relance_faite',
    label: 'Relance faite',
    items: [
      { key: 'canal_note', label: 'Canal de relance note' },
      { key: 'resultat_note', label: 'Resultat note' },
      { key: 'prochaine_action_definie', label: 'Prochaine action definie' },
    ],
  },
]

export const KANBAN_COLUMNS = [
  { key: 'new', label: 'Nouveaux', statuses: ['NEW'] as CandidateStatus[] },
  { key: 'review', label: 'A verifier', statuses: ['TO_REVIEW'] as CandidateStatus[] },
  { key: 'waiting', label: 'En attente candidat', statuses: ['WAITING_CANDIDATE'] as CandidateStatus[] },
  { key: 'ready_cv', label: 'Pret CV', statuses: ['READY_FOR_CV'] as CandidateStatus[] },
  { key: 'cv_progress', label: 'CV en cours', statuses: ['CV_IN_PROGRESS'] as CandidateStatus[] },
  { key: 'ready_apply', label: 'Pret a postuler', statuses: ['READY_TO_APPLY'] as CandidateStatus[] },
  { key: 'applying', label: 'Candidatures en cours', statuses: ['APPLYING'] as CandidateStatus[] },
  { key: 'follow_up', label: 'Relances aujourd hui', statuses: ['FOLLOW_UP'] as CandidateStatus[] },
  { key: 'closed', label: 'Clotures', statuses: ['POSITIVE', 'NEGATIVE', 'ARCHIVED'] as CandidateStatus[] },
] as const

const LEGACY_TO_WORKFLOW_STATUS: Record<string, CandidateStatus> = {
  nouveau: 'NEW',
  incomplet: 'WAITING_CANDIDATE',
  en_cours: 'CV_IN_PROGRESS',
  en_verification: 'TO_REVIEW',
  attente_paiement: 'ON_HOLD',
  attente_client: 'WAITING_CANDIDATE',
  pret: 'READY_TO_APPLY',
  termine: 'ARCHIVED',
  suspendu: 'ON_HOLD',
}

const WORKFLOW_TO_LEGACY_STATUS: Record<CandidateStatus, string> = {
  NEW: 'nouveau',
  TO_REVIEW: 'en_verification',
  WAITING_CANDIDATE: 'incomplet',
  READY_FOR_CV: 'en_cours',
  CV_IN_PROGRESS: 'en_cours',
  READY_TO_APPLY: 'pret',
  APPLYING: 'en_cours',
  FOLLOW_UP: 'en_cours',
  POSITIVE: 'termine',
  NEGATIVE: 'termine',
  ON_HOLD: 'suspendu',
  ARCHIVED: 'termine',
}

const LEGACY_DOCUMENT_STATUS: Record<string, DocumentWorkflowStatus> = {
  uploade: 'RECEIVED',
  approuve: 'VALIDATED',
  rejete: 'INVALID',
  en_verification: 'RECEIVED',
  recu: 'RECEIVED',
  traduit: 'TRANSLATED',
  a_traduire: 'TO_TRANSLATE',
  manquant: 'MISSING',
  expire: 'EXPIRED',
}

const WORKFLOW_TO_LEGACY_DOCUMENT_STATUS: Record<DocumentWorkflowStatus, string> = {
  RECEIVED: 'uploade',
  TO_TRANSLATE: 'en_verification',
  TRANSLATED: 'approuve',
  VALIDATED: 'approuve',
  MISSING: 'rejete',
  INVALID: 'rejete',
  EXPIRED: 'rejete',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sortByDateDesc<T>(items: T[], pickDate: (item: T) => Date | null): T[] {
  return [...items].sort((a, b) => (pickDate(b)?.getTime() ?? 0) - (pickDate(a)?.getTime() ?? 0))
}

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number }
    if (typeof candidate.toDate === 'function') {
      try { return candidate.toDate() } catch { return null }
    }
    if (typeof candidate.seconds === 'number') return new Date(candidate.seconds * 1000)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function normalizeCandidateStatus(dossier?: CandidateDossierDoc | null): CandidateStatus {
  if (dossier?.workflow_status && CANDIDATE_STATUS_LABELS[dossier.workflow_status]) return dossier.workflow_status
  return LEGACY_TO_WORKFLOW_STATUS[dossier?.statut ?? ''] ?? 'NEW'
}

export function mapCandidateStatusToLegacy(status: CandidateStatus) {
  return WORKFLOW_TO_LEGACY_STATUS[status]
}

export function normalizeDocumentStatus(document?: CandidateDocumentDoc | null): DocumentWorkflowStatus {
  if (document?.workflow_status && DOCUMENT_STATUS_LABELS[document.workflow_status]) return document.workflow_status
  return LEGACY_DOCUMENT_STATUS[document?.statut ?? ''] ?? 'RECEIVED'
}

export function mapDocumentStatusToLegacy(status: DocumentWorkflowStatus) {
  return WORKFLOW_TO_LEGACY_DOCUMENT_STATUS[status]
}

export function normalizeApplicationStatus(application?: CandidateApplicationDoc | null): ApplicationStatus {
  if (application?.status && APPLICATION_STATUS_LABELS[application.status]) return application.status
  return 'TO_SEND'
}

export function buildDefaultChecklist(): ChecklistState {
  return CHECKLIST_SECTIONS.reduce((state, section) => {
    state[section.key] = section.items.reduce<Record<string, boolean>>((items, item) => {
      items[item.key] = false
      return items
    }, {})
    return state
  }, {} as ChecklistState)
}

export function mergeChecklist(input: unknown): ChecklistState {
  const merged = buildDefaultChecklist()
  if (!input || typeof input !== 'object') return merged
  for (const section of CHECKLIST_SECTIONS) {
    const sourceSection = (input as Record<string, unknown>)[section.key]
    if (!sourceSection || typeof sourceSection !== 'object') continue
    for (const item of section.items) {
      merged[section.key][item.key] = (sourceSection as Record<string, unknown>)[item.key] === true
    }
  }
  return merged
}

export function getChecklistProgress(checklist: ChecklistState) {
  let completed = 0
  let total = 0
  for (const section of CHECKLIST_SECTIONS) {
    for (const item of section.items) {
      total += 1
      if (checklist[section.key][item.key]) completed += 1
    }
  }
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) }
}

export function isChecklistSectionComplete(checklist: ChecklistState, sectionKey: ChecklistSectionKey) {
  const section = CHECKLIST_SECTIONS.find((item) => item.key === sectionKey)
  if (!section) return false
  return section.items.every((item) => checklist[sectionKey][item.key])
}

export function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function getCandidateCode(candidateId: string) {
  const digits = candidateId.replace(/\D/g, '').slice(-6)
  if (digits) return `CAND-${digits.padStart(6, '0')}`
  const compact = candidateId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return `CAND-${compact.slice(0, 6).padEnd(6, 'X')}`
}

export function getCandidateFolderName(candidate: Pick<CandidateRecord, 'id' | 'fullName'>) {
  const code = getCandidateCode(candidate.id)
  const tokens = candidate.fullName.split(' ').filter(Boolean)
  const lastName = slugify(tokens[0] ?? 'CANDIDAT')
  const firstName = slugify(tokens.slice(1).join('_') || 'SANS_PRENOM')
  return `${code}_${lastName}_${firstName}`
}

export function inferDocumentType(document: CandidateDocumentDoc) {
  return document.doc_type || document.type_doc || 'other'
}

export function inferDocumentExtension(document: CandidateDocumentDoc) {
  const original = document.original_name ?? document.nom ?? ''
  const extension = original.includes('.') ? original.split('.').pop() : ''
  if (extension) return extension.toLowerCase()
  if (document.mime_type === 'application/pdf') return 'pdf'
  if (document.mime_type === 'image/png') return 'png'
  if (document.mime_type === 'image/jpeg' || document.mime_type === 'image/jpg') return 'jpg'
  if (document.mime_type === 'image/webp') return 'webp'
  if (document.content_text) return 'txt'
  return 'dat'
}

export function buildDocumentDownloadName(candidate: Pick<CandidateRecord, 'id' | 'fullName'>, document: CandidateDocumentDoc) {
  const date = toDate(document.validated_at ?? document.received_at ?? document.created_at) ?? new Date()
  const iso = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  const folder = getCandidateFolderName(candidate)
  const docType = slugify(inferDocumentType(document)).toUpperCase() || 'OTHER'
  const sourceLanguage = slugify(document.source_language || 'FR').toUpperCase()
  const version = document.final_version ? 'FINAL' : 'V1'
  return `${folder}_${docType}_${sourceLanguage}_${version}_${iso}.${inferDocumentExtension(document)}`
}

export function getRecommendedLocalArchivePath(candidate: CandidateRecord) {
  const createdAt = toDate(candidate.dossier.created_at) ?? new Date()
  return `/Candidats/${createdAt.getFullYear()}/${getCandidateFolderName(candidate)}`
}

export function isFollowUpDue(application: CandidateApplicationDoc, referenceDate = new Date()) {
  const status = normalizeApplicationStatus(application)
  if (status === 'POSITIVE' || status === 'NEGATIVE') return false
  const followUpAt = toDate(application.followUpAt)
  return Boolean(followUpAt && followUpAt.getTime() <= referenceDate.getTime())
}

function isFollowUpDueToday(application: CandidateApplicationDoc, now = new Date()) {
  const followUpAt = toDate(application.followUpAt)
  return Boolean(followUpAt && isFollowUpDue(application, now) && followUpAt.toDateString() === now.toDateString())
}

function deriveDocumentMetrics(documents: CandidateDocumentDoc[]) {
  const normalized = documents.map((document) => normalizeDocumentStatus(document))
  return {
    received: documents.length,
    validated: normalized.filter((status) => status === 'VALIDATED').length,
    missing: normalized.filter((status) => status === 'MISSING').length,
    invalid: normalized.filter((status) => status === 'INVALID' || status === 'EXPIRED').length,
    translated: documents.filter((document) => {
      const status = normalizeDocumentStatus(document)
      return status === 'TRANSLATED' || Boolean(document.translated_language) || document.translation_ready === true
    }).length,
  }
}

function deriveNextAction(status: CandidateStatus, dossier: CandidateDossierDoc, applications: CandidateApplicationDoc[]) {
  if (typeof dossier.next_action === 'string' && dossier.next_action.trim()) return dossier.next_action.trim()
  switch (status) {
    case 'NEW': return 'Verifier le profil et les premiers documents'
    case 'TO_REVIEW': return 'Verifier les nouveaux documents recus'
    case 'WAITING_CANDIDATE': return 'Relancer le candidat sur les pieces manquantes'
    case 'READY_FOR_CV': return 'Lancer l adaptation du CV'
    case 'CV_IN_PROGRESS': return 'Finaliser le CV et la lettre'
    case 'READY_TO_APPLY': return 'Planifier la premiere vague de candidatures'
    case 'APPLYING': return 'Envoyer les candidatures prevues'
    case 'FOLLOW_UP': return applications.some((application) => isFollowUpDueToday(application)) ? 'Traiter les relances du jour' : 'Verifier les reponses en attente'
    case 'POSITIVE':
    case 'NEGATIVE': return 'Clore puis archiver le dossier'
    case 'ON_HOLD': return 'Verifier les conditions de reprise du dossier'
    case 'ARCHIVED': return 'Aucune action'
    default: return 'Verifier le dossier'
  }
}

function deriveLastContactAt(applications: CandidateApplicationDoc[], activities: ActivityLogDoc[], dossier: CandidateDossierDoc) {
  const dates = [
    ...applications.map((application) => toDate(application.lastContactAt ?? application.updatedAt ?? application.submittedAt)),
    ...activities.map((activity) => toDate(activity.created_at ?? activity.createdAt)),
    toDate(dossier.updated_at),
  ].filter(Boolean) as Date[]
  return sortByDateDesc(dates, (date) => date)[0] ?? null
}

export function computeReadinessScore(args: { checklist: ChecklistState; documents: CandidateDocumentDoc[]; applications: CandidateApplicationDoc[] }) {
  const checklistProgress = getChecklistProgress(args.checklist)
  const metrics = deriveDocumentMetrics(args.documents)
  const docsComponent = metrics.received === 0 ? 0 : Math.round((metrics.validated / metrics.received) * 100)
  const applicationsComponent = args.applications.length > 0 ? 10 : 0
  return clamp(Math.round(checklistProgress.percent * 0.7 + docsComponent * 0.2 + applicationsComponent), 0, 100)
}

export function computePriorityScore(args: {
  checklist: ChecklistState
  documents: CandidateDocumentDoc[]
  applications: CandidateApplicationDoc[]
  dossier: CandidateDossierDoc
  workflowStatus: CandidateStatus
  lastContactAt: Date | null
}) {
  const metrics = deriveDocumentMetrics(args.documents)
  let score = 0
  if (isChecklistSectionComplete(args.checklist, 'dossier_complet')) score += 30
  if (metrics.validated > 0 && metrics.invalid === 0 && metrics.translated >= Math.max(1, metrics.validated)) score += 20
  if (isChecklistSectionComplete(args.checklist, 'cv_pret')) score += 15
  if (args.dossier.click_day_urgent || args.dossier.is_urgent) score += 15
  if (args.dossier.target_job || args.dossier.profession || args.dossier.secteur_cible) score += 10
  if (args.lastContactAt && Date.now() - args.lastContactAt.getTime() <= 7 * 86400000) score += 5
  if (args.applications.some((application) => Boolean(application.platform))) score += 5
  if (args.workflowStatus === 'WAITING_CANDIDATE' || args.workflowStatus === 'ON_HOLD') score -= 20
  if (metrics.invalid > 0) score -= 10
  return clamp(score, 0, 100)
}

function computeCompletenessPercent(checklist: ChecklistState, documents: CandidateDocumentDoc[]) {
  const checklistProgress = getChecklistProgress(checklist)
  const metrics = deriveDocumentMetrics(documents)
  const docsProgress = metrics.received === 0 ? 0 : Math.round((metrics.validated / metrics.received) * 100)
  return clamp(Math.round(checklistProgress.percent * 0.65 + docsProgress * 0.35), 0, 100)
}

export function canMoveToReadyForCv(candidate: Pick<CandidateRecord, 'checklist'>) {
  return isChecklistSectionComplete(candidate.checklist, 'dossier_complet')
}

export function canMoveToReadyToApply(candidate: Pick<CandidateRecord, 'checklist'>) {
  return isChecklistSectionComplete(candidate.checklist, 'cv_pret')
}

export function canCreateApplication(candidate: Pick<CandidateRecord, 'workflowStatus' | 'checklist'>) {
  return candidate.workflowStatus === 'READY_TO_APPLY' || candidate.workflowStatus === 'APPLYING' || (candidate.workflowStatus === 'FOLLOW_UP' && canMoveToReadyToApply(candidate))
}

export function normalizeCandidateRecord(args: {
  id: string
  user?: CandidateUserDoc | null
  dossier?: CandidateDossierDoc | null
  documents?: CandidateDocumentDoc[]
  applications?: CandidateApplicationDoc[]
  activities?: ActivityLogDoc[]
}): CandidateRecord {
  const user = args.user ?? {}
  const dossier = args.dossier ?? {}
  const documents = sortByDateDesc(args.documents ?? [], (document) => toDate(document.created_at ?? document.received_at))
  const applications = sortByDateDesc(args.applications ?? [], (application) => toDate(application.submittedAt ?? application.createdAt))
  const activities = sortByDateDesc(args.activities ?? [], (activity) => toDate(activity.created_at ?? activity.createdAt))
  const workflowStatus = normalizeCandidateStatus(dossier)
  const checklist = mergeChecklist(dossier.checklists)
  const checklistProgress = getChecklistProgress(checklist)
  const metrics = deriveDocumentMetrics(documents)
  const followUpsDueToday = applications.filter((application) => isFollowUpDueToday(application)).length
  const lastApplicationAt = toDate(applications[0]?.submittedAt ?? applications[0]?.createdAt)
  const lastActivityAt = toDate(activities[0]?.created_at ?? activities[0]?.createdAt)
  const lastContactAt = deriveLastContactAt(applications, activities, dossier)
  const dossierCompletenessPercent = typeof dossier.dossier_completeness_percent === 'number' ? dossier.dossier_completeness_percent : computeCompletenessPercent(checklist, documents)
  const readinessScore = typeof dossier.readiness_score === 'number' ? dossier.readiness_score : computeReadinessScore({ checklist, documents, applications })
  const priorityScore = typeof dossier.priority_score === 'number' ? dossier.priority_score : computePriorityScore({ checklist, documents, applications, dossier, workflowStatus, lastContactAt })

  return {
    id: args.id,
    code: getCandidateCode(args.id),
    fullName: String(user.full_name ?? 'Sans nom'),
    email: String(user.email ?? ''),
    whatsapp: String(user.phone ?? user.whatsapp ?? ''),
    country: String(user.country_code ?? ''),
    pack: String(dossier.pack ?? dossier.pack_type ?? ''),
    targetJob: String(dossier.target_job ?? dossier.profession ?? ''),
    sector: String(dossier.secteur_cible ?? dossier.sector ?? ''),
    preferredRegionItaly: String(dossier.region_italie ?? dossier.preferred_region_italy ?? ''),
    workflowStatus,
    legacyStatus: String(dossier.statut ?? mapCandidateStatusToLegacy(workflowStatus)),
    statusLabel: CANDIDATE_STATUS_LABELS[workflowStatus],
    nextAction: deriveNextAction(workflowStatus, dossier, applications),
    nextActionAt: toDate(dossier.next_action_at),
    internalNotes: String(dossier.internal_notes ?? ''),
    priorityScore,
    readinessScore,
    dossierCompletenessPercent,
    documentsReceivedCount: metrics.received,
    documentsMissingCount: metrics.missing,
    documentsValidatedCount: metrics.validated,
    translationsDoneCount: metrics.translated,
    applicationsCount: applications.length,
    followUpsDueToday,
    invalidDocumentsCount: metrics.invalid,
    lastApplicationAt,
    lastContactAt,
    lastActivityAt,
    isUrgent: Boolean(dossier.click_day_urgent || dossier.is_urgent),
    checklist,
    checklistCompleted: checklistProgress.completed,
    checklistTotal: checklistProgress.total,
    user,
    dossier,
    documents,
    applications,
    activities,
  }
}

export function buildDerivedDossierPatch(candidate: CandidateRecord) {
  return {
    workflow_status: candidate.workflowStatus,
    statut: mapCandidateStatusToLegacy(candidate.workflowStatus),
    next_action: candidate.nextAction,
    next_action_at: candidate.nextActionAt ?? null,
    internal_notes: candidate.internalNotes,
    priority_score: candidate.priorityScore,
    readiness_score: candidate.readinessScore,
    dossier_completeness_percent: candidate.dossierCompletenessPercent,
    score_completion: candidate.dossierCompletenessPercent,
    documents_received_count: candidate.documentsReceivedCount,
    documents_missing_count: candidate.documentsMissingCount,
    documents_validated_count: candidate.documentsValidatedCount,
    translations_done_count: candidate.translationsDoneCount,
    applications_count: candidate.applicationsCount,
    follow_ups_due_today: candidate.followUpsDueToday,
    last_application_at: candidate.lastApplicationAt ?? null,
    last_contact_at: candidate.lastContactAt ?? null,
    last_activity_at: candidate.lastActivityAt ?? null,
    checklists: candidate.checklist,
  }
}

export function sortCandidatesForWork(candidates: CandidateRecord[]) {
  return [...candidates].sort((left, right) => {
    const leftDue = left.followUpsDueToday > 0 ? 1 : 0
    const rightDue = right.followUpsDueToday > 0 ? 1 : 0
    if (leftDue !== rightDue) return rightDue - leftDue
    if (left.priorityScore !== right.priorityScore) return right.priorityScore - left.priorityScore
    return (left.nextActionAt?.getTime() ?? 0) - (right.nextActionAt?.getTime() ?? 0)
  })
}

export function getBlockerReason(candidate: CandidateRecord) {
  if (candidate.invalidDocumentsCount > 0) return 'Document critique invalide ou expire'
  if (candidate.workflowStatus === 'WAITING_CANDIDATE') return 'En attente d une action du candidat'
  if (candidate.nextActionAt && Date.now() - candidate.nextActionAt.getTime() > 48 * 3600000) return 'Action en retard de plus de 48h'
  return ''
}
