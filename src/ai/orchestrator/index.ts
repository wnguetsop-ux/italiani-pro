// ============================================================
// ITALIANIPRO — AI Orchestrator
// Point d'entrée unique pour déclencher les agents
// ============================================================

import OpenAI, { toFile } from 'openai'
import { adminDb, adminStorage } from '@/lib/admin'
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
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function buildCvSourceText(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('\n\n')
}

type OrchestratorDocument = Record<string, unknown> & { id: string }
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

function isLikelyCvDocument(document: OrchestratorDocument) {
  const type = String(document.doc_type ?? document.type_doc ?? '').toLowerCase()
  const name = String(document.nom ?? document.original_name ?? '').toLowerCase()
  return type === 'cv' || /cv|resume|curriculum/.test(name)
}

function pickBestSourceDocument(documents: OrchestratorDocument[], sourceDocumentId?: string) {
  if (sourceDocumentId) {
    const directMatch = documents.find((item) => item.id === sourceDocumentId)
    if (directMatch) return directMatch
  }

  return (
    documents.find((item) => isLikelyCvDocument(item) && typeof item.content_text === 'string' && item.content_text.trim()) ??
    documents.find((item) => isLikelyCvDocument(item) && typeof item.file_url === 'string' && item.file_url.trim()) ??
    documents.find((item) => typeof item.content_text === 'string' && item.content_text.trim()) ??
    documents.find((item) => typeof item.file_url === 'string' && item.file_url.trim()) ??
    null
  )
}

function inferDocumentFilename(document: OrchestratorDocument) {
  const original = String(document.original_name ?? document.nom ?? '').trim()
  if (original) return original

  const type = String(document.doc_type ?? document.type_doc ?? 'document').toLowerCase()
  const mime = String(document.mime_type ?? '').toLowerCase()
  const extension =
    mime === 'application/pdf'
      ? 'pdf'
      : mime === 'image/png'
        ? 'png'
        : mime === 'image/webp'
          ? 'webp'
          : mime === 'image/jpeg' || mime === 'image/jpg'
            ? 'jpg'
            : 'txt'

  return `${type || 'document'}.${extension}`
}

async function downloadDocumentBinary(document: OrchestratorDocument) {
  const filePath = typeof document.file_path === 'string' ? document.file_path.trim() : ''
  const fileUrl = typeof document.file_url === 'string' ? document.file_url.trim() : ''

  if (filePath) {
    const [buffer] = await adminStorage().bucket().file(filePath).download()
    return {
      buffer,
      filename: inferDocumentFilename(document),
    }
  }

  if (fileUrl) {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Document download failed ${response.status}`)
    }
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      filename: inferDocumentFilename(document),
    }
  }

  throw new Error('Missing file reference for document extraction')
}

async function extractDocumentTextFromFile(document: OrchestratorDocument) {
  if (!openaiClient) return ''

  const { buffer, filename } = await downloadDocumentBinary(document)
  const uploadedFile = await openaiClient.files.create({
    file: await toFile(buffer, filename),
    purpose: 'user_data',
  })

  try {
    const response = await openaiClient.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                'Tu lis un CV ou un document professionnel de candidat.',
                'Extrais uniquement le texte utile en plain text UTF-8.',
                'Conserve les titres, listes, dates, noms de postes, competences et langues.',
                'Ne fais aucun commentaire, aucune analyse, aucun JSON.',
                'Si certaines parties sont illisibles, ignore-les.',
              ].join(' '),
            },
            {
              type: 'input_file',
              file_id: uploadedFile.id,
            },
          ],
        },
      ],
    })

    return typeof response.output_text === 'string' ? response.output_text.trim() : ''
  } finally {
    await openaiClient.files.del(uploadedFile.id).catch(() => undefined)
  }
}

async function ensureDocumentText(document: OrchestratorDocument | null) {
  if (!document) return ''
  if (typeof document.content_text === 'string' && document.content_text.trim()) {
    return document.content_text.trim()
  }

  try {
    const extractedText = await extractDocumentTextFromFile(document)
    if (extractedText) {
      await adminDb().collection('documents').doc(document.id).update({
        content_text: extractedText,
        extracted_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      })
      document.content_text = extractedText
    }
    return extractedText
  } catch (error) {
    console.warn('[document-extraction] failed:', document.id, error)
    return ''
  }
}

export async function extractCandidateDocumentText(candidateId: string, sourceDocumentId?: string) {
  const docsSnap = await adminDb().collection('documents').where('uid', '==', candidateId).get()
  const documents: OrchestratorDocument[] = docsSnap.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Record<string, unknown>),
  }))
  const selectedDocument = pickBestSourceDocument(documents, sourceDocumentId)
  const extractedText = await ensureDocumentText(selectedDocument)

  return {
    sourceDocumentId: selectedDocument?.id ?? null,
    sourceDocumentName: String(selectedDocument?.nom ?? selectedDocument?.original_name ?? ''),
    contentText: extractedText,
  }
}

function buildCvRenderPayload(candidateId: string, fullName: string, email: string, phone: string, country: string, dossier: Record<string, unknown>, output: any, lang: 'fr' | 'it') {
  const sections = Array.isArray(output.cvSections)
    ? output.cvSections
        .filter((section: any) => section && typeof section.title === 'string' && typeof section.content === 'string')
        .map((section: any) => ({ title: String(section.title), content: String(section.content) }))
    : []

  const summarySection = sections.find((section: { title: string; content: string }) => /profil|profile|profilo/i.test(section.title))

  return {
    type: 'cv',
    lang,
    data: {
      candidateId,
      fullName,
      title: String(output.suggestedTitle || dossier.target_job || dossier.profession || 'Profil professionnel'),
      email,
      phone,
      location: [dossier.region_italie, country].filter(Boolean).join(' · '),
      summary: summarySection?.content ?? '',
      sections,
      keywords: Array.isArray(output.keywords) ? output.keywords.map((item: unknown) => String(item)) : [],
      lang,
    },
  }
}

function splitLetterParagraphs(letterText: string, salutation?: string, closing?: string, signature?: string) {
  return letterText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => paragraph !== salutation && paragraph !== closing && paragraph !== signature)
}

function buildLetterRenderPayload(candidateId: string, fullName: string, email: string, phone: string, country: string, dossier: Record<string, unknown>, output: any, lang: 'fr' | 'it' | 'en') {
  return {
    type: 'cover_letter',
    lang,
    data: {
      candidateId,
      fullName,
      title: String(dossier.target_job || dossier.profession || 'Candidat ItalianiPro'),
      email,
      phone,
      location: [dossier.region_italie, country].filter(Boolean).join(' | '),
      subject: String(output.subject || ''),
      salutation: String(output.salutation || ''),
      bodyParagraphs: splitLetterParagraphs(String(output.letterText || ''), output.salutation, output.closing, fullName),
      closing: String(output.closing || ''),
      signature: fullName,
      lang,
    },
  }
}

async function upsertGeneratedDocument(input: {
  candidateId: string
  assetKey: string
  name: string
  docType: string
  lang: string
  contentText: string
  renderPayload: Record<string, unknown>
}) {
  const generatedDocId = `generated_${input.candidateId}_${input.assetKey}`.replace(/[^a-zA-Z0-9_-]+/g, '_')
  const generatedRef = adminDb().collection('documents').doc(generatedDocId)

  const payload = {
    uid: input.candidateId,
    candidateId: input.candidateId,
    nom: input.name,
    original_name: input.name,
    workflow_status: 'VALIDATED',
    statut: 'approuve',
    doc_type: input.docType,
    type_doc: input.docType,
    source_language: input.lang,
    translated_language: '',
    final_version: true,
    generated_by_ai: true,
    generated_asset_key: input.assetKey,
    content_text: input.contentText,
    render_payload: input.renderPayload,
    file_url: null,
    file_path: null,
    mime_type: 'text/plain',
    validated_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  }

  const existingSnap = await generatedRef.get()
  if (existingSnap.exists) {
    await generatedRef.update(payload)
    return generatedDocId
  }

  await generatedRef.set({
    ...payload,
    received_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  })
  return generatedDocId
}

export async function generateCV(
  candidateId: string,
  adminUid: string,
  lang: 'fr' | 'it' = 'fr',
  options?: { sourceText?: string; sourceDocumentId?: string },
) {
  const [profileSnap, userSnap, dossierSnap, docsSnap] = await Promise.all([
    adminDb().collection('candidate_profiles').doc(candidateId).get(),
    adminDb().collection('users').doc(candidateId).get(),
    adminDb().collection('dossiers').doc(candidateId).get(),
    adminDb().collection('documents').where('uid', '==', candidateId).get(),
  ])

  if (!userSnap.exists) throw new Error('Candidate not found')

  const profile = profileSnap.exists ? profileSnap.data()! : null
  const user = userSnap.data()!
  const dossier = dossierSnap.exists ? dossierSnap.data()! : {}
  const documents: Array<Record<string, unknown> & { id: string }> = docsSnap.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Record<string, unknown>),
  }))
  const selectedDocument = pickBestSourceDocument(documents, options?.sourceDocumentId)
  const extractedSelectedText = await ensureDocumentText(selectedDocument)

  const documentsText = documents
    .filter((item) => typeof item.content_text === 'string' && item.content_text.trim().length > 0)
    .map((item) => `Document ${item.nom || item.original_name || item.doc_type || item.id}:\n${String(item.content_text).trim()}`)
    .join('\n\n')

  const rawExperiences = buildCvSourceText([
    typeof profile?.raw_experiences === 'string' ? profile.raw_experiences : '',
    typeof dossier.target_job === 'string' ? `Metier vise en Italie: ${dossier.target_job}` : '',
    typeof dossier.experiences === 'string' ? dossier.experiences : '',
    typeof dossier.competences === 'string' ? `Competences et formations:\n${dossier.competences}` : '',
    typeof dossier.driving_license === 'string' ? `Permis de conduire: ${dossier.driving_license}` : '',
    typeof dossier.availability === 'string' ? `Disponibilite: ${dossier.availability}` : '',
    typeof dossier.italy_motivation === 'string' ? `Motivation Italie:\n${dossier.italy_motivation}` : '',
    extractedSelectedText
      ? `Document source selectionne:\n${extractedSelectedText}`
      : '',
    documentsText ? `Autres textes disponibles du dossier:\n${documentsText}` : '',
    options?.sourceText ? `Notes brutes ajoutees par l operateur:\n${options.sourceText}` : '',
  ])

  const input: CVGeneratorInput = {
    candidateId,
    fullName: user.full_name ?? '',
    profession: profile?.profession ?? dossier.target_job ?? dossier.profession ?? '',
    experienceYears: Number(profile?.experience_years ?? dossier.annees_experience ?? 0) || 0,
    educationLevel: profile?.education_level ?? dossier.niveau_etudes ?? '',
    skills: Array.isArray(profile?.skills) ? profile.skills : asStringArray(dossier.competences),
    languages: Array.isArray(profile?.languages_spoken) ? profile.languages_spoken : asStringArray(dossier.langues),
    targetSector: profile?.target_sector ?? dossier.secteur_cible ?? dossier.sector ?? '',
    targetRegion: profile?.target_region_italy ?? dossier.region_italie ?? dossier.preferred_region_italy ?? '',
    rawExperiences,
    lang,
  }

  const agent  = lang === 'it' ? AGENT_REGISTRY.agent_cv_it : AGENT_REGISTRY.agent_cv_fr
  const result = await agent.run(input, adminUid, 'manual')

  await adminDb().collection('cv_versions').add({
    candidate_id: candidateId,
    lang,
    content:      result.output.cvText,
    sections:     result.output.cvSections,
    keywords:     result.output.keywords,
    warnings:     result.output.warnings,
    source_document_id: options?.sourceDocumentId ?? null,
    source_excerpt: rawExperiences.slice(0, 5000),
    agent_run_id: result.runId,
    is_current:   true,
    created_by:   adminUid,
    created_at:   FieldValue.serverTimestamp(),
  })

  await upsertGeneratedDocument({
    candidateId,
    assetKey: `cv_${lang}_final`,
    name: lang === 'it' ? 'CV italien final' : 'CV francais final',
    docType: 'cv',
    lang,
    contentText: result.output.cvText,
    renderPayload: buildCvRenderPayload(candidateId, user.full_name ?? '', user.email ?? '', user.phone ?? '', user.country_code ?? '', dossier, result.output, lang),
  })

  await Events.cvReady(candidateId, adminUid, lang)
  return result
}

// ── Générer Lettre de Motivation ──────────────────────────
export async function generateCoverLetter(
  candidateId: string,
  adminUid: string,
  lang: 'fr' | 'it' | 'en' = 'fr',
  options?: { customNotes?: string; sourceDocumentId?: string },
) {
  const [profileSnap, userSnap, dossierSnap, ordersSnap, docsSnap] = await Promise.all([
    adminDb().collection('candidate_profiles').doc(candidateId).get(),
    adminDb().collection('users').doc(candidateId).get(),
    adminDb().collection('dossiers').doc(candidateId).get(),
    adminDb().collection('orders').where('candidate_id', '==', candidateId).limit(1).get(),
    adminDb().collection('documents').where('uid', '==', candidateId).get(),
  ])

  if (!userSnap.exists) throw new Error('Candidate not found')

  const p = profileSnap.exists ? profileSnap.data()! : null
  const u = userSnap.data()!
  const dossier = dossierSnap.exists ? dossierSnap.data()! : {}
  const documents: OrchestratorDocument[] = docsSnap.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Record<string, unknown>),
  }))
  const selectedDocument = pickBestSourceDocument(documents, options?.sourceDocumentId)
  const extractedSelectedText = await ensureDocumentText(selectedDocument)
  const packType = ordersSnap.empty ? dossier.pack ?? 'basic' : ordersSnap.docs[0].data().pack_type ?? dossier.pack ?? 'basic'

  const input: CoverLetterInput = {
    candidateId,
    fullName:      u.full_name ?? '',
    profession:    p?.profession ?? dossier.target_job ?? dossier.profession ?? '',
    targetSector:  p?.target_sector ?? dossier.secteur_cible ?? dossier.sector ?? '',
    targetRegion:  p?.target_region_italy ?? dossier.region_italie ?? dossier.preferred_region_italy ?? '',
    packType,
    lang,
    customNotes: buildCvSourceText([
      options?.customNotes,
      extractedSelectedText ? `Texte utile du CV source:\n${extractedSelectedText}` : '',
      typeof dossier.italy_motivation === 'string' ? `Motivation Italie:\n${dossier.italy_motivation}` : '',
      typeof dossier.experiences === 'string' ? `Experience:\n${dossier.experiences}` : '',
    ]),
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

  await upsertGeneratedDocument({
    candidateId,
    assetKey: `cover_letter_${lang}_final`,
    name: lang === 'it' ? 'Lettre motivation italienne finale' : `Lettre motivation ${lang} finale`,
    docType: 'cover_letter',
    lang,
    contentText: result.output.letterText,
    renderPayload: buildLetterRenderPayload(candidateId, u.full_name ?? '', u.email ?? '', u.phone ?? '', u.country_code ?? '', dossier, result.output, lang),
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
