// ============================================================
// ITALIANIPRO — All AI Agents
// ============================================================

import { BaseAgent } from './base'
import { PROMPTS }   from '../prompts'
import type { AIMessage } from '../schemas/types'
import type {
  ProfileAnalyzerInput,   ProfileAnalyzerOutput,
  DocumentChecklistInput, DocumentChecklistOutput,
  CVGeneratorInput,       CVGeneratorOutput,
  CoverLetterInput,       CoverLetterOutput,
  ClientMessageInput,     ClientMessageOutput,
  ProofSummaryInput,      ProofSummaryOutput,
  InterviewCoachInput,    InterviewCoachOutput,
  AdminAssistantInput,    AdminAssistantOutput,
  PaymentReminderInput,   PaymentReminderOutput,
} from '../schemas/types'

// ── 1. Profile Analyzer ───────────────────────────────────
export class ProfileAnalyzerAgent extends BaseAgent<ProfileAnalyzerInput, ProfileAnalyzerOutput> {
  name           = 'agent_profile_analyzer' as const
  systemPrompt   = PROMPTS.agent_profile_analyzer
  requiredOutputKeys = ['strengths','weaknesses','recommendedSectors','preparationScore','summaryFr','nextActions','internalNotes']

  buildMessages(input: ProfileAnalyzerInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Analyse le profil suivant et retourne le JSON demandé.

Candidat : ${input.fullName}
Nationalité : ${input.nationality}
Profession actuelle : ${input.profession}
Années d'expérience : ${input.experienceYears}
Niveau d'études : ${input.educationLevel}
Langues parlées : ${input.languagesSpoken.join(', ')}
Compétences : ${input.skills.join(', ')}
Secteur ciblé en Italie : ${input.targetSector}
Région ciblée : ${input.targetRegion}
Séjour antérieur en Italie : ${input.hasPreviousItaly ? 'Oui' : 'Non'}
Documents déjà uploadés : ${input.documentsUploaded.join(', ')}
Langue de réponse principale : ${input.lang}
      `.trim() },
    ]
  }
}

// ── 2. Document Checklist ─────────────────────────────────
export class DocumentChecklistAgent extends BaseAgent<DocumentChecklistInput, DocumentChecklistOutput> {
  name           = 'agent_document_checklist' as const
  systemPrompt   = PROMPTS.agent_document_checklist
  requiredOutputKeys = ['missingDocuments','urgentDocuments','optionalDocuments','clientMessageFr','completenessEstimate']

  buildMessages(input: DocumentChecklistInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Secteur ciblé : ${input.targetSector}
Pack acheté : ${input.packType}
Documents déjà présents : ${input.documentsPresent.length > 0 ? input.documentsPresent.join(', ') : 'Aucun pour l\'instant'}
Langue du client : ${input.lang}

Génère la checklist complète des documents manquants, urgents et optionnels.
      `.trim() },
    ]
  }
}

// ── 3. CV Français ────────────────────────────────────────
export class CVFrAgent extends BaseAgent<CVGeneratorInput, CVGeneratorOutput> {
  name           = 'agent_cv_fr' as const
  systemPrompt   = PROMPTS.agent_cv_fr
  requiredOutputKeys = ['cvText','cvSections','suggestedTitle','keywords','warnings']

  buildMessages(input: CVGeneratorInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Crée un CV professionnel en français pour ce candidat.

Nom complet : ${input.fullName}
Profession actuelle : ${input.profession}
Années d'expérience : ${input.experienceYears}
Niveau d'études : ${input.educationLevel}
Compétences : ${input.skills.join(', ')}
Langues : ${input.languages.join(', ')}
Secteur ciblé en Italie : ${input.targetSector}
Région ciblée : ${input.targetRegion}
${input.rawExperiences ? `Expériences brutes fournies par le candidat :\n${input.rawExperiences}` : ''}
      `.trim() },
    ]
  }
}

// ── 4. CV Italien ─────────────────────────────────────────
export class CVItAgent extends BaseAgent<CVGeneratorInput, CVGeneratorOutput> {
  name           = 'agent_cv_it' as const
  systemPrompt   = PROMPTS.agent_cv_it
  requiredOutputKeys = ['cvText','cvSections','suggestedTitle','keywords','warnings']

  buildMessages(input: CVGeneratorInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Crea un CV professionale in italiano per questo candidato.

Nome completo : ${input.fullName}
Professione attuale : ${input.profession}
Anni di esperienza : ${input.experienceYears}
Livello di istruzione : ${input.educationLevel}
Competenze : ${input.skills.join(', ')}
Lingue : ${input.languages.join(', ')}
Settore target in Italia : ${input.targetSector}
Regione target : ${input.targetRegion}
${input.rawExperiences ? `Esperienze fornite dal candidato :\n${input.rawExperiences}` : ''}
      `.trim() },
    ]
  }
}

// ── 5. Cover Letter ───────────────────────────────────────
export class CoverLetterAgent extends BaseAgent<CoverLetterInput, CoverLetterOutput> {
  name           = 'agent_cover_letter' as const
  systemPrompt   = PROMPTS.agent_cover_letter
  requiredOutputKeys = ['letterText','subject','salutation','closing','wordCount','warnings']

  buildMessages(input: CoverLetterInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Génère une lettre de motivation pour ce candidat.

Nom : ${input.fullName}
Profession : ${input.profession}
Secteur ciblé : ${input.targetSector}
Région ciblée en Italie : ${input.targetRegion}
Pack acheté : ${input.packType}
Langue : ${input.lang}
${input.customNotes ? `Notes personnalisées : ${input.customNotes}` : ''}
      `.trim() },
    ]
  }
}

// ── 6. Client Message ─────────────────────────────────────
export class ClientMessageAgent extends BaseAgent<ClientMessageInput, ClientMessageOutput> {
  name           = 'agent_client_message' as const
  systemPrompt   = PROMPTS.agent_client_message
  requiredOutputKeys = ['messageText','requiresReview','confidence']

  buildMessages(input: ClientMessageInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Génère un message automatique pour le client.

Nom du client : ${input.candidateName}
Type d'événement : ${input.eventType}
Contexte : ${JSON.stringify(input.context, null, 2)}
Langue : ${input.lang}
Ton demandé : ${input.tone}
      `.trim() },
    ]
  }
}

// ── 7. Proof Summary ──────────────────────────────────────
export class ProofSummaryAgent extends BaseAgent<ProofSummaryInput, ProofSummaryOutput> {
  name           = 'agent_proof_summary' as const
  systemPrompt   = PROMPTS.agent_proof_summary
  requiredOutputKeys = ['summaryText','actionsListed','totalHours','clientMessage']

  buildMessages(input: ProofSummaryInput): AIMessage[] {
    const proofsText = input.proofsData.map(p =>
      `- ${p.title} (${p.type}) — ${p.date} — ${p.agentName} — ${p.hoursSpent}h\n  Détails : ${p.details}`
    ).join('\n')

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Résume le travail effectué pour ce client et génère un message de preuve.

Langue du client : ${input.lang}

Travaux effectués :
${proofsText}
      `.trim() },
    ]
  }
}

// ── 8. Interview Coach ────────────────────────────────────
export class InterviewCoachAgent extends BaseAgent<InterviewCoachInput, InterviewCoachOutput> {
  name           = 'agent_interview_coach' as const
  systemPrompt   = PROMPTS.agent_interview_coach
  requiredOutputKeys = ['questions','generalAdvice','keyPhrases','thingsToAvoid']

  buildMessages(input: InterviewCoachInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Prépare ce candidat pour un entretien avec un employeur italien.

Profession : ${input.profession}
Secteur ciblé : ${input.targetSector}
Région d'Italie : ${input.targetRegion}
Années d'expérience : ${input.experienceYears}
Langue de la préparation : ${input.lang}
      `.trim() },
    ]
  }
}

// ── 9. Admin Assistant ────────────────────────────────────
export class AdminAssistantAgent extends BaseAgent<AdminAssistantInput, AdminAssistantOutput> {
  name           = 'agent_admin_assistant' as const
  systemPrompt   = PROMPTS.agent_admin_assistant
  requiredOutputKeys = ['summary','suggestedAction','priority','isBlocked','suggestedMessage']

  buildMessages(input: AdminAssistantInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Analyse l'état de ce dossier et retourne tes recommandations.

Statut du dossier : ${input.dossierStatus}
Dernière activité : ${input.lastActivity}
État des documents : ${JSON.stringify(input.documentsState)}
État des paiements : ${input.paymentState}
Notes internes : ${input.notes.join(' | ')}
Tâches ouvertes : ${input.openTasks.join(', ')}
      `.trim() },
    ]
  }
}

// ── 10. Payment Reminder ──────────────────────────────────
export class PaymentReminderAgent extends BaseAgent<PaymentReminderInput, PaymentReminderOutput> {
  name           = 'agent_payment_reminder' as const
  systemPrompt   = PROMPTS.agent_payment_reminder
  requiredOutputKeys = ['messageText','subject','urgencyLevel']

  buildMessages(input: PaymentReminderInput): AIMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user',   content: `
Génère une relance de paiement professionnelle.

Nom du client : ${input.candidateName}
Montant dû : ${input.amountDue.toLocaleString()} ${input.currency}
Étape concernée : ${input.milestoneName}
Travaux déjà réalisés pour justifier ce paiement :
${input.workDone.map(w => `- ${w}`).join('\n')}
Jours de retard : ${input.daysOverdue}
Langue : ${input.lang}
      `.trim() },
    ]
  }
}

// ── Registry des agents ───────────────────────────────────
export const AGENT_REGISTRY = {
  agent_profile_analyzer:   new ProfileAnalyzerAgent(),
  agent_document_checklist: new DocumentChecklistAgent(),
  agent_cv_fr:              new CVFrAgent(),
  agent_cv_it:              new CVItAgent(),
  agent_cover_letter:       new CoverLetterAgent(),
  agent_client_message:     new ClientMessageAgent(),
  agent_proof_summary:      new ProofSummaryAgent(),
  agent_interview_coach:    new InterviewCoachAgent(),
  agent_admin_assistant:    new AdminAssistantAgent(),
  agent_payment_reminder:   new PaymentReminderAgent(),
} as const
