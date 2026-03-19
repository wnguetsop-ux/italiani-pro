// ============================================================
// POST /api/ai/run
// Déclencher un agent IA manuellement depuis l'admin
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/firebase-admin'
import {
  analyzeProfile,
  generateChecklist,
  generateCV,
  generateCoverLetter,
  summarizeProofs,
  assistAdmin,
  sendPaymentReminder,
  prepareInterview,
} from '@/ai/orchestrator'

const ADMIN_ROLES = ['admin', 'super_admin', 'agent', 'coach']

export async function POST(req: NextRequest) {
  // Auth
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, candidateId, options = {} } = body as {
    action:      string
    candidateId: string
    options?:    Record<string, unknown>
  }

  if (!action || !candidateId) {
    return NextResponse.json({ error: 'Missing action or candidateId' }, { status: 400 })
  }

  try {
    let result: unknown

    switch (action) {
      case 'analyze_profile':
        result = await analyzeProfile(candidateId, user.uid)
        break

      case 'generate_checklist':
        result = await generateChecklist(candidateId, user.uid)
        break

      case 'generate_cv_fr':
        result = await generateCV(candidateId, user.uid, 'fr')
        break

      case 'generate_cv_it':
        result = await generateCV(candidateId, user.uid, 'it')
        break

      case 'generate_cover_letter':
        result = await generateCoverLetter(
          candidateId,
          user.uid,
          (options.lang as 'fr'|'it'|'en') ?? 'fr',
          options.customNotes as string | undefined
        )
        break

      case 'summarize_proofs':
        result = await summarizeProofs(candidateId, user.uid)
        break

      case 'assist_admin':
        result = await assistAdmin(candidateId, user.uid)
        break

      case 'payment_reminder':
        if (!options.milestoneId) return NextResponse.json({ error: 'Missing milestoneId' }, { status: 400 })
        result = await sendPaymentReminder(candidateId, user.uid, options.milestoneId as string)
        break

      case 'prepare_interview':
        result = await prepareInterview(
          candidateId,
          user.uid,
          (options.lang as 'fr'|'en'|'it') ?? 'fr'
        )
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })

  } catch (err) {
    console.error('[API/AI/run] Error:', err)
    return NextResponse.json(
      { error: 'Agent execution failed', details: (err as Error).message },
      { status: 500 }
    )
  }
}
