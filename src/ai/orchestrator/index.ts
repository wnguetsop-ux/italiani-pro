// ============================================================
// ITALIANIPRO — AI Orchestrator
// Point d'entrée unique pour déclencher les agents
// ============================================================

import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { AGENT_REGISTRY } from '../agents'
import { Events, saveAutoMessage } from '../events'
import type {
  AgentName,
  ProfileAnalyzerInput,
  DocumentChecklistInput,
  CVGeneratorInput,
  CoverLetterInput,
  InterviewCoachInput,
  AdminAssistantInput,
  PaymentReminderInput,
  ProofSummaryInput,
} from '../schemas/types'

// ── Analyser un profil ────────────────────────────────────
export async function analyzeProfile(candidateId: string, adminUid: string) {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  const userSnap    = await adminDb().collection('users').doc(candidateId).get()

  if (!profileSnap.exists || !userSnap.exists) throw new Error('Candidate not found')

  const p = profileSnap.data()!
  const u = userSnap.data()!

  const docsSnap = await adminDb().collection('documents')
    .where('candidate_id', '==', candidateId).get()
  const docsUploaded = docsSnap.docs.map(d => d.data().name as string)

  const input: ProfileAnalyzerInput = {
    candidateId,
    fullName:          u.full_name ?? '',
    nationality:       p.nationality ?? 'Camerounaise',
    profession:        p.profession ?? '',
    experienceYears:   p.experience_years ?? 0,
    educationLevel:    p.education_level ?? '',
    languagesSpoken:   p.languages_spoken ?? [],
    skills:            p.skills ?? [],
    targetSector:      p.target_sector ?? '',
    targetRegion:      p.target_region_italy ?? '',
    hasPreviousItaly:  p.previous_italy_stay ?? false,
    documentsUploaded: docsUploaded,
    lang:              u.preferred_lang ?? 'fr',
  }

  const result = await AGENT_REGISTRY.agent_profile_analyzer.run(input, adminUid, 'manual')

  // Sauvegarder dans le profil
  await adminDb().collection('candidate_profiles').doc(candidateId).update({
    ai_profile_analysis: result.output,
    quality_score:       result.output.preparationScore,
    updated_at:          FieldValue.serverTimestamp(),
  })

  // Émettre événement
  await Events.documentsUploaded(candidateId, adminUid, docsUploaded)

  return result
}

// ── Générer checklist documents ───────────────────────────
export async function generateChecklist(candidateId: string, adminUid: string) {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  const ordersSnap  = await adminDb().collection('orders')
    .where('candidate_id', '==', candidateId).limit(1).get()

  if (!profileSnap.exists) throw new Error('Profile not found')

  const p = profileSnap.data()!
  const docsSnap = await adminDb().collection('documents')
    .where('candidate_id', '==', candidateId).get()
  const docsPresent = docsSnap.docs.map(d => d.data().name as string)

  const packType = ordersSnap.empty ? 'basic'
    : ordersSnap.docs[0].data().pack_type ?? 'basic'

  const input: DocumentChecklistInput = {
    candidateId,
    targetSector:     p.target_sector ?? 'general',
    packType,
    documentsPresent: docsPresent,
    lang:             'fr',
  }

  const result = await AGENT_REGISTRY.agent_document_checklist.run(input, adminUid, 'manual')

  // Sauvegarder la checklist
  await adminDb().collection('candidate_profiles').doc(candidateId).update({
    ai_checklist:      result.output,
    completeness_score: result.output.completenessEstimate,
    updated_at:        FieldValue.serverTimestamp(),
  })

  // Émettre événement si documents manquants
  if (result.output.missingDocuments.length > 0) {
    await Events.missingDocumentsDetected(candidateId, adminUid, result.output.missingDocuments)
  }

  return result
}

// ── Générer CV ────────────────────────────────────────────
export async function generateCV(candidateId: string, adminUid: string, lang: 'fr' | 'it' = 'fr') {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  const userSnap    = await adminDb().collection('users').doc(candidateId).get()

  if (!profileSnap.exists || !userSnap.exists) throw new Error('Candidate not found')

  const p = profileSnap.data()!
  const u = userSnap.data()!

  const input: CVGeneratorInput = {
    candidateId,
    fullName:        u.full_name ?? '',
    profession:      p.profession ?? '',
    experienceYears: p.experience_years ?? 0,
    educationLevel:  p.education_level ?? '',
    skills:          p.skills ?? [],
    languages:       p.languages_spoken ?? [],
    targetSector:    p.target_sector ?? '',
    targetRegion:    p.target_region_italy ?? '',
    rawExperiences:  p.raw_experiences,
    lang,
  }

  const agent  = lang === 'it' ? AGENT_REGISTRY.agent_cv_it : AGENT_REGISTRY.agent_cv_fr
  const result = await agent.run(input, adminUid, 'manual')

  // Sauvegarder le CV généré
  await adminDb().collection('cv_versions').add({
    candidate_id: candidateId,
    lang,
    content:      result.output.cvText,
    sections:     result.output.cvSections,
    keywords:     result.output.keywords,
    warnings:     result.output.warnings,
    agent_run_id: result.runId,
    is_current:   true,
    created_by:   adminUid,
    created_at:   FieldValue.serverTimestamp(),
  })

  await Events.cvReady(candidateId, adminUid, lang)
  return result
}

// ── Générer Lettre de Motivation ──────────────────────────
export async function generateCoverLetter(candidateId: string, adminUid: string, lang: 'fr' | 'it' | 'en' = 'fr', customNotes?: string) {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  const userSnap    = await adminDb().collection('users').doc(candidateId).get()
  const ordersSnap  = await adminDb().collection('orders')
    .where('candidate_id', '==', candidateId).limit(1).get()

  if (!profileSnap.exists || !userSnap.exists) throw new Error('Candidate not found')

  const p = profileSnap.data()!
  const u = userSnap.data()!

  const input: CoverLetterInput = {
    candidateId,
    fullName:      u.full_name ?? '',
    profession:    p.profession ?? '',
    targetSector:  p.target_sector ?? '',
    targetRegion:  p.target_region_italy ?? '',
    packType:      ordersSnap.empty ? 'basic' : ordersSnap.docs[0].data().pack_type,
    lang,
    customNotes,
  }

  const result = await AGENT_REGISTRY.agent_cover_letter.run(input, adminUid, 'manual')

  await adminDb().collection('cover_letters').add({
    candidate_id:  candidateId,
    lang,
    title:         result.output.subject,
    content:       result.output.letterText,
    agent_run_id:  result.runId,
    is_final:      false,
    created_by:    adminUid,
    created_at:    FieldValue.serverTimestamp(),
  })

  await Events.coverLetterReady(candidateId, adminUid)
  return result
}

// ── Résumer preuves de travail ────────────────────────────
export async function summarizeProofs(candidateId: string, adminUid: string) {
  const proofsSnap = await adminDb().collection('proofs')
    .where('candidate_id', '==', candidateId)
    .where('status', '==', 'validated')
    .orderBy('created_at', 'desc')
    .get()

  if (proofsSnap.empty) throw new Error('No validated proofs found')

  const userSnap = await adminDb().collection('users').doc(candidateId).get()
  const lang     = userSnap.data()?.preferred_lang ?? 'fr'

  const proofsData = proofsSnap.docs.map(d => {
    const p = d.data()
    return {
      title:      p.title ?? '',
      type:       p.proof_type ?? '',
      date:       p.created_at?.toDate?.()?.toISOString?.() ?? '',
      agentName:  p.submitted_by ?? 'Équipe ItalianiPro',
      hoursSpent: p.hours_spent ?? 0,
      details:    p.description ?? '',
    }
  })

  const input: ProofSummaryInput = { candidateId, proofsData, lang }
  const result = await AGENT_REGISTRY.agent_proof_summary.run(input, adminUid, 'manual')

  await saveAutoMessage(candidateId, result.output.clientMessage, false, result.runId, 'proof_added')
  return result
}

// ── Assistant admin ───────────────────────────────────────
export async function assistAdmin(candidateId: string, adminUid: string) {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  const docsSnap    = await adminDb().collection('documents')
    .where('candidate_id', '==', candidateId).get()
  const notesSnap   = await adminDb().collection('internal_notes')
    .where('candidate_id', '==', candidateId).orderBy('created_at', 'desc').limit(5).get()
  const tasksSnap   = await adminDb().collection('adminTasks')
    .where('candidateId', '==', candidateId).where('isCompleted', '==', false).get()

  if (!profileSnap.exists) throw new Error('Profile not found')

  const p = profileSnap.data()!

  const docsState: Record<string, string> = {}
  docsSnap.docs.forEach(d => { docsState[d.data().name] = d.data().status })

  const input: AdminAssistantInput = {
    candidateId,
    dossierStatus: p.dossier_status ?? 'draft',
    lastActivity:  p.updated_at?.toDate?.()?.toISOString?.() ?? 'unknown',
    documentsState: docsState,
    paymentState:  'see Firestore',
    notes:         notesSnap.docs.map(d => d.data().content as string),
    openTasks:     tasksSnap.docs.map(d => d.data().title as string),
  }

  return await AGENT_REGISTRY.agent_admin_assistant.run(input, adminUid, 'manual')
}

// ── Rappel paiement ───────────────────────────────────────
export async function sendPaymentReminder(
  candidateId: string,
  adminUid:    string,
  milestoneId: string
) {
  const userSnap      = await adminDb().collection('users').doc(candidateId).get()
  const milestoneSnap = await adminDb().collection('milestones').doc(milestoneId).get()
  const proofsSnap    = await adminDb().collection('proofs')
    .where('candidate_id', '==', candidateId).where('status', '==', 'validated').get()

  if (!userSnap.exists || !milestoneSnap.exists) throw new Error('Data not found')

  const u = userSnap.data()!
  const m = milestoneSnap.data()!

  const workDone = proofsSnap.docs.map(d => d.data().title as string)
  const daysOverdue = m.due_date
    ? Math.max(0, Math.floor((Date.now() - m.due_date.toDate().getTime()) / 86400000))
    : 0

  const input: PaymentReminderInput = {
    candidateId,
    candidateName: u.full_name ?? '',
    amountDue:     m.amount_xaf ?? 0,
    currency:      'XAF',
    milestoneName: m.title_fr ?? m.title_en ?? 'Étape',
    workDone:      workDone.length > 0 ? workDone : ['Préparation du dossier en cours'],
    daysOverdue,
    lang:          u.preferred_lang ?? 'fr',
  }

  const result = await AGENT_REGISTRY.agent_payment_reminder.run(input, adminUid, 'manual')

  await saveAutoMessage(candidateId, result.output.messageText, true, result.runId, 'payment_due')
  await Events.paymentDue(candidateId, adminUid, m.amount_xaf ?? 0, m.title_fr ?? '')

  return result
}

// ── Préparer entretien ────────────────────────────────────
export async function prepareInterview(candidateId: string, adminUid: string, lang: 'fr'|'en'|'it' = 'fr') {
  const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
  if (!profileSnap.exists) throw new Error('Profile not found')

  const p = profileSnap.data()!

  const input: InterviewCoachInput = {
    candidateId,
    targetSector:    p.target_sector ?? '',
    targetRegion:    p.target_region_italy ?? '',
    profession:      p.profession ?? '',
    experienceYears: p.experience_years ?? 0,
    lang,
  }

  const result = await AGENT_REGISTRY.agent_interview_coach.run(input, adminUid, 'manual')

  await adminDb().collection('candidate_profiles').doc(candidateId).update({
    ai_interview_prep: result.output,
    updated_at:        FieldValue.serverTimestamp(),
  })

  return result
}
