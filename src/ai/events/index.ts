// ============================================================
// ITALIANIPRO — Business Event System
// Branché sur l'app existante — ne remplace rien
// ============================================================

import { adminDb } from '@/lib/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { AGENT_REGISTRY } from '../agents'
import { AUTO_MESSAGE_TEMPLATES } from '../schemas/types'
import type { BusinessEvent, BusinessEventType, ClientMessageInput } from '../schemas/types'

// ── Émettre un événement métier ───────────────────────────
export async function emitEvent(
  type:        BusinessEventType,
  candidateId: string,
  triggeredBy: string,
  payload:     Record<string, unknown> = {}
): Promise<string> {
  const ref = adminDb().collection('aiEvents').doc()

  await ref.set({
    type,
    candidateId,
    triggeredBy,
    payload,
    processed:   false,
    createdAt:   FieldValue.serverTimestamp(),
  })

  // Traiter l'événement de manière asynchrone (non-bloquant)
  processEvent(ref.id, type, candidateId, triggeredBy, payload).catch(err => {
    console.error(`[EventSystem] Failed to process event ${type}:`, err)
  })

  return ref.id
}

// ── Processeur d'événements ───────────────────────────────
async function processEvent(
  eventId:     string,
  type:        BusinessEventType,
  candidateId: string,
  triggeredBy: string,
  payload:     Record<string, unknown>
): Promise<void> {
  const template = AUTO_MESSAGE_TEMPLATES.find(t => t.eventType === type)
  if (!template) return

  try {
    // Récupérer les données du candidat
    const profileSnap = await adminDb().collection('candidate_profiles').doc(candidateId).get()
    const userSnap    = await adminDb().collection('users').doc(candidateId).get()

    if (!profileSnap.exists || !userSnap.exists) return

    const profile    = profileSnap.data()!
    const user       = userSnap.data()!
    const lang       = user.preferred_lang ?? template.defaultLang

    // Générer le message via agent_client_message
    const input: ClientMessageInput = {
      candidateId,
      candidateName: user.full_name ?? 'Client',
      eventType:     type,
      context:       { ...payload, dossierStatus: profile.dossier_status },
      lang,
      tone:          'warm',
    }

    const agent  = AGENT_REGISTRY.agent_client_message
    const result = await agent.run(input, 'system', type)

    // Sauvegarder le message dans conversations/messages
    await saveAutoMessage(
      candidateId,
      result.output.messageText,
      result.output.requiresReview,
      result.runId,
      type
    )

    // Marquer l'événement comme traité
    await adminDb().collection('aiEvents').doc(eventId).update({
      processed:    true,
      agentRunId:   result.runId,
      processedAt:  FieldValue.serverTimestamp(),
    })

  } catch (err) {
    console.error(`[EventSystem] processEvent error for ${type}:`, err)
    await adminDb().collection('aiEvents').doc(eventId).update({
      processed:  false,
      error:      (err as Error).message,
      updatedAt:  FieldValue.serverTimestamp(),
    })
  }
}

// ── Sauvegarder un message auto dans Firestore ────────────
export async function saveAutoMessage(
  candidateId:    string,
  messageText:    string,
  requiresReview: boolean,
  agentRunId:     string,
  eventType:      BusinessEventType
): Promise<string> {
  // Trouver ou créer la conversation du candidat
  const convSnap = await adminDb().collection('conversations')
    .where('candidateId', '==', candidateId)
    .limit(1)
    .get()

  let conversationId: string

  if (convSnap.empty) {
    const convRef = adminDb().collection('conversations').doc()
    await convRef.set({
      candidateId,
      createdAt:    FieldValue.serverTimestamp(),
      updatedAt:    FieldValue.serverTimestamp(),
      unreadCount:  0,
    })
    conversationId = convRef.id
  } else {
    conversationId = convSnap.docs[0].id
  }

  // Créer le message
  const msgRef = adminDb().collection('conversations').doc(conversationId)
    .collection('messages').doc()

  await msgRef.set({
    candidateId,
    conversationId,
    sender:         'ai',
    senderName:     'ItalianiPro Assistant',
    content:        messageText,
    isInternal:     false,
    requiresReview,
    approved:       !requiresReview,  // auto-approuvé si pas de review
    agentRunId,
    eventType,
    readBy:         [],
    createdAt:      FieldValue.serverTimestamp(),
  })

  // Créer une notification pour le candidat si message approuvé
  if (!requiresReview) {
    await adminDb().collection('notifications').add({
      user_id:    candidateId,
      type:       'message_received',
      title:      '💬 Nouveau message de votre équipe',
      message:    messageText.slice(0, 100) + (messageText.length > 100 ? '...' : ''),
      is_read:    false,
      action_url: '/messages',
      createdAt:  FieldValue.serverTimestamp(),
    })
  }

  // Créer une tâche admin si review requise
  if (requiresReview) {
    await adminDb().collection('adminTasks').add({
      type:        'review_ai_message',
      candidateId,
      messageId:   msgRef.id,
      title:       `Message IA à valider pour ${candidateId}`,
      description: `Événement: ${eventType} — Vérifier avant envoi au client`,
      priority:    2,
      isCompleted: false,
      createdAt:   FieldValue.serverTimestamp(),
    })
  }

  return msgRef.id
}

// ── Approuver un message IA en attente ────────────────────
export async function approveAIMessage(
  conversationId: string,
  messageId:      string,
  adminUid:       string
): Promise<void> {
  const msgRef = adminDb()
    .collection('conversations').doc(conversationId)
    .collection('messages').doc(messageId)

  const snap = await msgRef.get()
  if (!snap.exists) throw new Error('Message not found')

  const msg = snap.data()!

  await msgRef.update({
    approved:   true,
    approvedBy: adminUid,
    approvedAt: FieldValue.serverTimestamp(),
  })

  // Notifier le candidat maintenant que c'est approuvé
  await adminDb().collection('notifications').add({
    user_id:    msg.candidateId,
    type:       'message_received',
    title:      '💬 Nouveau message de votre équipe',
    message:    msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''),
    is_read:    false,
    action_url: '/messages',
    createdAt:  FieldValue.serverTimestamp(),
  })
}

// ── Fonctions helper pour déclencher facilement ───────────
export const Events = {
  clientCreated:            (uid: string, by: string) =>
    emitEvent('client_created', uid, by),

  documentsUploaded:        (uid: string, by: string, docs: string[]) =>
    emitEvent('documents_uploaded', uid, by, { uploadedDocs: docs }),

  missingDocumentsDetected: (uid: string, by: string, missing: string[]) =>
    emitEvent('missing_documents_detected', uid, by, { missingDocs: missing }),

  cvReady:                  (uid: string, by: string, lang: string) =>
    emitEvent('cv_ready', uid, by, { cvLang: lang }),

  coverLetterReady:         (uid: string, by: string) =>
    emitEvent('cover_letter_ready', uid, by),

  paymentDue:               (uid: string, by: string, amount: number, milestone: string) =>
    emitEvent('payment_due', uid, by, { amount, milestone }),

  paymentReceived:          (uid: string, by: string, amount: number) =>
    emitEvent('payment_received', uid, by, { amount }),

  proofAdded:               (uid: string, by: string, proofTitle: string) =>
    emitEvent('proof_added', uid, by, { proofTitle }),

  appointmentScheduled:     (uid: string, by: string, date: string, type: string) =>
    emitEvent('appointment_scheduled', uid, by, { date, type }),

  dossierBlocked:           (uid: string, by: string, reason: string) =>
    emitEvent('dossier_blocked', uid, by, { reason }),

  dossierCompleted:         (uid: string, by: string) =>
    emitEvent('dossier_completed', uid, by),

  milestoneCompleted:       (uid: string, by: string, milestone: string) =>
    emitEvent('milestone_completed', uid, by, { milestone }),
}
