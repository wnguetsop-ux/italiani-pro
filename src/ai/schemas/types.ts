// ============================================================
// ITALIANIPRO — AI Layer Types
// Extension de l'app existante — ne pas modifier les types core
// ============================================================

// ── Provider ─────────────────────────────────────────────
export type AIProvider = 'openai' | 'claude'

export interface AIProviderConfig {
  provider:    AIProvider
  model:       string
  temperature: number
  maxTokens:   number
}

export interface AIMessage {
  role:    'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content:      string
  usage?:       { inputTokens: number; outputTokens: number }
  model:        string
  finishReason: string
}

// ── Agent Run ─────────────────────────────────────────────
export type AgentName =
  | 'agent_profile_analyzer'
  | 'agent_document_checklist'
  | 'agent_cv_fr'
  | 'agent_cv_it'
  | 'agent_cover_letter'
  | 'agent_client_message'
  | 'agent_proof_summary'
  | 'agent_interview_coach'
  | 'agent_admin_assistant'
  | 'agent_payment_reminder'

export type AgentRunStatus = 'pending' | 'running' | 'success' | 'error' | 'blocked'

export interface AgentRun {
  id:           string
  agentName:    AgentName
  candidateId:  string
  triggeredBy:  string            // uid admin ou 'system'
  triggeredFrom: string           // event name ou 'manual'
  status:       AgentRunStatus
  inputHash:    string            // hash de l'input pour détecter duplicata
  input:        Record<string, unknown>
  output?:      Record<string, unknown>
  rawOutput?:   string
  error?:       string
  provider:     AIProvider
  model:        string
  tokensUsed?:  number
  durationMs?:  number
  createdAt:    Date
  completedAt?: Date
}

// ── Business Events ───────────────────────────────────────
export type BusinessEventType =
  | 'client_created'
  | 'documents_uploaded'
  | 'missing_documents_detected'
  | 'cv_requested'
  | 'cv_ready'
  | 'cover_letter_ready'
  | 'payment_due'
  | 'payment_received'
  | 'proof_added'
  | 'appointment_scheduled'
  | 'dossier_blocked'
  | 'dossier_completed'
  | 'dossier_updated'
  | 'admin_note_added'
  | 'milestone_completed'
  | 'checklist_generated'
  | 'profile_analyzed'

export interface BusinessEvent {
  id:          string
  type:        BusinessEventType
  candidateId: string
  triggeredBy: string
  payload:     Record<string, unknown>
  processed:   boolean
  agentRunId?: string
  createdAt:   Date
  processedAt?: Date
}

// ── Agents Input/Output ───────────────────────────────────

export interface ProfileAnalyzerInput {
  candidateId:       string
  fullName:          string
  nationality:       string
  profession:        string
  experienceYears:   number
  educationLevel:    string
  languagesSpoken:   string[]
  skills:            string[]
  targetSector:      string
  targetRegion:      string
  hasPreviousItaly:  boolean
  documentsUploaded: string[]
  lang:              'fr' | 'en'
}

export interface ProfileAnalyzerOutput {
  strengths:           string[]
  weaknesses:          string[]
  recommendedSectors:  string[]
  preparationLevel:    'low' | 'medium' | 'high'
  preparationScore:    number
  summaryFr:           string
  summaryEn:           string
  nextActions:         string[]
  internalNotes:       string   // admin only - jamais envoyé au client
}

export interface DocumentChecklistInput {
  candidateId:      string
  targetSector:     string
  packType:         string
  documentsPresent: string[]
  lang:             'fr' | 'en'
}

export interface DocumentChecklistOutput {
  missingDocuments:      string[]
  urgentDocuments:       string[]
  optionalDocuments:     string[]
  clientMessageFr:       string
  clientMessageEn:       string
  completenessEstimate:  number
}

export interface CVGeneratorInput {
  candidateId:     string
  fullName:        string
  profession:      string
  experienceYears: number
  educationLevel:  string
  skills:          string[]
  languages:       string[]
  targetSector:    string
  targetRegion:    string
  rawExperiences?: string
  lang:            'fr' | 'it'
}

export interface CVGeneratorOutput {
  cvText:          string
  cvSections:      { title: string; content: string }[]
  suggestedTitle:  string
  keywords:        string[]
  warnings:        string[]
}

export interface CoverLetterInput {
  candidateId:   string
  fullName:      string
  profession:    string
  targetSector:  string
  targetRegion:  string
  packType:      string
  lang:          'fr' | 'it' | 'en'
  customNotes?:  string
}

export interface CoverLetterOutput {
  letterText:   string
  subject:      string
  salutation:   string
  closing:      string
  wordCount:    number
  warnings:     string[]
}

export interface ClientMessageInput {
  candidateId:   string
  candidateName: string
  eventType:     BusinessEventType
  context:       Record<string, unknown>
  lang:          'fr' | 'en'
  tone:          'formal' | 'warm' | 'neutral'
}

export interface ClientMessageOutput {
  messageText:    string
  subject?:       string
  requiresReview: boolean   // si true → admin doit valider avant envoi
  confidence:     number    // 0-1
}

export interface ProofSummaryInput {
  candidateId:  string
  proofsData:   {
    title:      string
    type:       string
    date:       string
    agentName:  string
    hoursSpent: number
    details:    string
  }[]
  lang: 'fr' | 'en'
}

export interface ProofSummaryOutput {
  summaryText:    string
  actionsListed:  string[]
  totalHours:     number
  clientMessage:  string
}

export interface InterviewCoachInput {
  candidateId:    string
  targetSector:   string
  targetRegion:   string
  profession:     string
  experienceYears: number
  lang:           'fr' | 'en' | 'it'
}

export interface InterviewCoachOutput {
  questions:      { question: string; tipAnswer: string }[]
  generalAdvice:  string
  keyPhrases:     string[]
  thingsToAvoid:  string[]
}

export interface AdminAssistantInput {
  candidateId:    string
  dossierStatus:  string
  lastActivity:   string
  documentsState: Record<string, string>
  paymentState:   string
  notes:          string[]
  openTasks:      string[]
}

export interface AdminAssistantOutput {
  summary:          string
  suggestedAction:  string
  priority:         'low' | 'medium' | 'high' | 'urgent'
  isBlocked:        boolean
  blockReason?:     string
  suggestedMessage: string
}

export interface PaymentReminderInput {
  candidateId:    string
  candidateName:  string
  amountDue:      number
  currency:       string
  milestoneName:  string
  workDone:       string[]
  daysOverdue:    number
  lang:           'fr' | 'en'
}

export interface PaymentReminderOutput {
  messageText:  string
  subject:      string
  urgencyLevel: 'gentle' | 'normal' | 'firm'
}

// ── Firestore Chat Message ────────────────────────────────
export type MessageSender = 'client' | 'admin' | 'system' | 'ai'

export interface ChatMessage {
  id:             string
  conversationId: string
  candidateId:    string
  sender:         MessageSender
  senderUid?:     string
  senderName:     string
  content:        string
  isInternal:     boolean       // true = visible admin seulement
  requiresReview: boolean       // true = message IA en attente validation admin
  approved:       boolean
  approvedBy?:    string
  approvedAt?:    Date
  agentRunId?:    string
  eventType?:     BusinessEventType
  attachmentUrl?: string
  createdAt:      Date
  readBy:         string[]
}

// ── Auto-message template ─────────────────────────────────
export interface AutoMessageTemplate {
  eventType:      BusinessEventType
  requiresReview: boolean
  defaultLang:    'fr' | 'en'
  agentName:      AgentName
}

export const AUTO_MESSAGE_TEMPLATES: AutoMessageTemplate[] = [
  { eventType: 'client_created',             requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'documents_uploaded',         requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'missing_documents_detected', requiresReview: true,  defaultLang: 'fr', agentName: 'agent_document_checklist' },
  { eventType: 'cv_ready',                   requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'cover_letter_ready',         requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'payment_due',                requiresReview: true,  defaultLang: 'fr', agentName: 'agent_payment_reminder' },
  { eventType: 'payment_received',           requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'proof_added',                requiresReview: false, defaultLang: 'fr', agentName: 'agent_proof_summary' },
  { eventType: 'appointment_scheduled',      requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'dossier_blocked',            requiresReview: true,  defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'dossier_completed',          requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
  { eventType: 'milestone_completed',        requiresReview: false, defaultLang: 'fr', agentName: 'agent_client_message' },
]
