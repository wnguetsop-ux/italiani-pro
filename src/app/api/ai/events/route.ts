// ============================================================
// /api/ai/events — Émettre événement ou approuver message IA
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/firebase-admin'
import { emitEvent, approveAIMessage } from '@/ai/events'
import type { BusinessEventType } from '@/ai/schemas/types'

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, candidateId, payload } = body as {
    type:        string
    candidateId: string
    payload?:    Record<string, unknown>
  }

  if (!type || !candidateId) {
    return NextResponse.json({ error: 'Missing type or candidateId' }, { status: 400 })
  }

  try {
    const eventId = await emitEvent(type as BusinessEventType, candidateId, user.uid, payload ?? {})
    return NextResponse.json({ success: true, eventId })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Approuver un message IA
export async function PATCH(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user || !['admin','super_admin','agent'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { conversationId, messageId } = body as {
    conversationId: string
    messageId:      string
  }

  if (!conversationId || !messageId) {
    return NextResponse.json({ error: 'Missing conversationId or messageId' }, { status: 400 })
  }

  try {
    await approveAIMessage(conversationId, messageId, user.uid)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
