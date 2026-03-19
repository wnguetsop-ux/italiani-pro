// ============================================================
// ITALIANIPRO — Firestore Collections Documentation
// Nouvelles collections ajoutées pour la couche IA
// ============================================================

/*
COLLECTIONS EXISTANTES (inchangées)
====================================
- users
- candidate_profiles
- documents
- orders
- payments
- milestones
- proofs
- proof_files
- cv_versions
- cover_letters
- appointments
- notifications
- support_tickets
- ticket_replies
- packages
- promo_codes
- referrals
- activity_logs
- invoices

NOUVELLES COLLECTIONS AJOUTÉES
================================

1. aiEvents
-----------
Rôle : Stocker les événements métier émis par l'application
Déclencheurs : inscription, upload, paiement, milestone, etc.

Structure :
{
  id: string (auto)
  type: BusinessEventType
  candidateId: string
  triggeredBy: string (uid)
  payload: object
  processed: boolean
  agentRunId?: string
  error?: string
  createdAt: Timestamp
  processedAt?: Timestamp
}

Index nécessaires :
- candidateId + createdAt DESC
- processed + createdAt ASC (pour retry worker)

2. aiRuns
---------
Rôle : Journaliser toutes les exécutions d'agents IA
Traçabilité complète, audit, debug

Structure :
{
  id: string (auto)
  agentName: AgentName
  candidateId: string
  triggeredBy: string
  triggeredFrom: string
  status: 'pending'|'running'|'success'|'error'|'blocked'
  inputHash: string (MD5 pour détecter duplicatas)
  input: object (données entrée)
  output?: object (résultat structuré)
  rawOutput?: string
  error?: string
  provider: 'openai'|'claude'
  model: string
  tokensUsed?: number
  durationMs?: number
  createdAt: Timestamp
  completedAt?: Timestamp
  updatedAt: Timestamp
}

Index nécessaires :
- candidateId + createdAt DESC
- agentName + createdAt DESC
- status + createdAt ASC (pour monitoring)

3. conversations
----------------
Rôle : Une conversation par candidat (1:1 avec l'équipe)
Racine des messages sous-collection

Structure :
{
  id: string (candidateId ou auto)
  candidateId: string
  unreadCount: number
  lastMessageAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

  Sub-collection: messages
  {
    id: string (auto)
    candidateId: string
    conversationId: string
    sender: 'client'|'admin'|'system'|'ai'
    senderUid?: string
    senderName: string
    content: string
    isInternal: boolean
    requiresReview: boolean
    approved: boolean
    approvedBy?: string
    approvedAt?: Timestamp
    agentRunId?: string
    eventType?: BusinessEventType
    attachmentUrl?: string
    readBy: string[]
    createdAt: Timestamp
  }

Index nécessaires :
- candidateId + createdAt ASC
- isInternal + approved + createdAt ASC (filtrage candidat)
- requiresReview + approved (pour file admin review)

4. adminTasks
-------------
Rôle : Tâches générées automatiquement pour les admins
(ex: messages IA à valider, dossiers bloqués, etc.)

Structure :
{
  id: string (auto)
  type: 'review_ai_message'|'missing_docs'|'payment_follow'|'manual'
  candidateId?: string
  messageId?: string
  title: string
  description: string
  priority: 1|2|3 (1=urgent)
  assignedTo?: string (uid agent)
  isCompleted: boolean
  completedAt?: Timestamp
  completedBy?: string
  createdAt: Timestamp
}

Index nécessaires :
- isCompleted + priority + createdAt ASC
- assignedTo + isCompleted (tâches par agent)
- type + isCompleted

5. flussi_events (remplace le SQL existant)
--------------------------------------------
Rôle : Calendrier des click days Flussi (lecture publique)

Structure :
{
  id: string (auto)
  year: number
  click_day_date: string (YYYY-MM-DD)
  category: FlussiCategory
  title_fr: string
  title_en: string
  description_fr: string
  max_quota?: number
  status: 'upcoming'|'active'|'passed'
  required_docs: string[]
  is_active: boolean
  createdAt: Timestamp
}

SEED DATA À INSÉRER (Firebase Console → Firestore)
===================================================

Collection: flussi_events

Document 1:
  year: 2027
  click_day_date: "2027-01-12"
  category: "agricultural_seasonal"
  title_fr: "Saisonniers Agricoles"
  title_en: "Agricultural Seasonal Workers"
  description_fr: "Quota pour les travailleurs saisonniers dans le secteur agricole."
  status: "upcoming"
  required_docs: ["Passeport valide", "CV en français", "Acte de naissance", "Casier judiciaire"]
  is_active: true

Document 2:
  year: 2027
  click_day_date: "2027-02-09"
  category: "tourism_seasonal"
  title_fr: "Saisonniers Tourisme"
  title_en: "Tourism Seasonal Workers"
  description_fr: "Quota pour les travailleurs saisonniers dans le tourisme."
  status: "upcoming"
  required_docs: ["Passeport valide", "CV optimisé", "Attestation tourisme/hôtellerie"]
  is_active: true

Document 3:
  year: 2027
  click_day_date: "2027-02-16"
  category: "non_seasonal_general"
  title_fr: "Non Saisonniers Généraux"
  title_en: "Non-Seasonal General Workers"
  status: "upcoming"
  required_docs: ["Passeport", "Diplômes", "CV technique", "Lettre de motivation"]
  is_active: true

Document 4:
  year: 2027
  click_day_date: "2027-02-18"
  category: "home_care"
  title_fr: "Assistance Familiale"
  title_en: "Home Care Workers"
  status: "upcoming"
  required_docs: ["Passeport", "Diplôme soins", "CV détaillé", "Casier judiciaire"]
  is_active: true

(Répéter pour 2028)
*/

export {}
