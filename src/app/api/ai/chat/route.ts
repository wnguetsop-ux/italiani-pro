// ============================================================
// /api/ai/chat — Lire et envoyer des messages de conversation
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifyToken } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// ── GET — lire messages d'une conversation ────────────────
export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidate_id') ?? user.uid

  // Admin peut lire n'importe quel candidat, le candidat ne peut lire que le sien
  const isAdmin = ['admin','super_admin','agent','coach'].includes(user.role)
  if (!isAdmin && candidateId !== user.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Trouver la conversation
  const convSnap = await adminDb().collection('conversations')
    .where('candidateId', '==', candidateId)
    .limit(1)
    .get()

  if (convSnap.empty) {
    return NextResponse.json({ messages: [], conversationId: null })
  }

  const convId  = convSnap.docs[0].id
  const msgsRef = adminDb().collection('conversations').doc(convId).collection('messages')

  let query = msgsRef.orderBy('createdAt', 'asc')

  // Si candidat, ne voir que les messages approuvés et non-internes
  if (!isAdmin) {
    query = query.where('isInternal', '==', false).where('approved', '==', true) as any
  }

  const msgsSnap = await query.limit(100).get()

  const messages = msgsSnap.docs.map(d => ({
    id:             d.id,
    ...d.data(),
    createdAt:      d.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
    approvedAt:     d.data().approvedAt?.toDate?.()?.toISOString?.() ?? null,
  }))

  // Marquer comme lu
  const batch = adminDb().batch()
  msgsSnap.docs.forEach(d => {
    const readBy = d.data().readBy ?? []
    if (!readBy.includes(user.uid)) {
      batch.update(d.ref, { readBy: FieldValue.arrayUnion(user.uid) })
    }
  })
  await batch.commit().catch(() => {})

  return NextResponse.json({ messages, conversationId: convId })
}

// ── POST — envoyer un message manuel ─────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { candidateId, content, isInternal = false } = body as {
    candidateId: string
    content:     string
    isInternal?: boolean
  }

  if (!candidateId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing candidateId or content' }, { status: 400 })
  }

  const isAdmin  = ['admin','super_admin','agent','coach'].includes(user.role)
  const isCandidateSelf = user.uid === candidateId

  // Le candidat ne peut pas envoyer de message interne
  if (!isAdmin && isInternal) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Trouver ou créer la conversation
  const convSnap = await adminDb().collection('conversations')
    .where('candidateId', '==', candidateId).limit(1).get()

  let convId: string
  if (convSnap.empty) {
    const convRef = adminDb().collection('conversations').doc()
    await convRef.set({ candidateId, createdAt: FieldValue.serverTimestamp(), unreadCount: 0 })
    convId = convRef.id
  } else {
    convId = convSnap.docs[0].id
  }

  // Récupérer le nom de l'émetteur
  const senderSnap = await adminDb().collection('users').doc(user.uid).get()
  const senderName = senderSnap.data()?.full_name ?? (isAdmin ? 'Équipe ItalianiPro' : 'Client')
  const sender     = isAdmin ? 'admin' : 'client'

  const msgRef = adminDb().collection('conversations').doc(convId).collection('messages').doc()

  await msgRef.set({
    candidateId,
    conversationId: convId,
    sender,
    senderUid:      user.uid,
    senderName,
    content:        content.trim(),
    isInternal:     isAdmin ? isInternal : false,
    requiresReview: false,
    approved:       true,
    readBy:         [user.uid],
    createdAt:      FieldValue.serverTimestamp(),
  })

  // Notification pour l'autre partie
  if (isAdmin && !isInternal) {
    await adminDb().collection('notifications').add({
      user_id:    candidateId,
      type:       'message_received',
      title:      '💬 Nouveau message de votre équipe',
      message:    content.trim().slice(0, 100),
      is_read:    false,
      action_url: '/messages',
      createdAt:  FieldValue.serverTimestamp(),
    })
  }

  return NextResponse.json({ success: true, messageId: msgRef.id, conversationId: convId })
}
