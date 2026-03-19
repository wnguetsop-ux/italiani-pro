// ============================================================
// ITALIANIPRO — Base Agent
// Classe de base pour tous les agents IA
// ============================================================

import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { createProvider, AGENT_CONFIGS } from '../providers'
import { runComplianceGuard } from '../guards/compliance'
import type { AgentName, AgentRun, AIMessage } from '../schemas/types'
import crypto from 'crypto'

export abstract class BaseAgent<TInput, TOutput> {
  abstract name:         AgentName
  abstract systemPrompt: string
  abstract requiredOutputKeys: string[]

  // Sous-classes implémentent buildMessages()
  abstract buildMessages(input: TInput): AIMessage[]

  // Post-processing optionnel
  protected postProcess(output: TOutput, _input: TInput): TOutput {
    return output
  }

  // ── Run principal ─────────────────────────────────────
  async run(input: TInput, triggeredBy: string, triggeredFrom: string): Promise<{
    runId:   string
    output:  TOutput
    runData: AgentRun
  }> {
    const config      = AGENT_CONFIGS[this.name]
    const provider    = createProvider(config.provider)
    const messages    = this.buildMessages(input)
    const inputHash   = crypto.createHash('md5').update(JSON.stringify(input)).digest('hex')
    const candidateId = (input as Record<string, unknown>).candidateId as string ?? 'unknown'
    const startTime   = Date.now()

    // Créer le run en Firestore
    const runRef = adminDb().collection('aiRuns').doc()
    const runId  = runRef.id

    const runData: Omit<AgentRun, 'id'> = {
      agentName:     this.name,
      candidateId,
      triggeredBy,
      triggeredFrom,
      status:        'running',
      inputHash,
      input:         input as Record<string, unknown>,
      provider:      config.provider,
      model:         config.model,
      createdAt:     new Date(),
    }

    await runRef.set({ ...runData, createdAt: FieldValue.serverTimestamp() })

    try {
      const { data, raw } = await provider.generateStructuredOutput<TOutput>(
        messages,
        config,
        this.requiredOutputKeys
      )

      // Compliance guard sur le raw output
      const guard = runComplianceGuard(raw)
      if (!guard.passed) {
        console.warn(`[${this.name}] Compliance violations:`, guard.violations)
      }

      const processed = this.postProcess(data, input)
      const durationMs = Date.now() - startTime

      // Update Firestore run
      await runRef.update({
        status:      'success',
        output:      processed,
        rawOutput:   raw,
        durationMs,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt:   FieldValue.serverTimestamp(),
      })

      const completeRun: AgentRun = {
        ...runData,
        id: runId,
        status: 'success',
        output: processed as Record<string, unknown>,
        durationMs,
        completedAt: new Date(),
      }

      return { runId, output: processed, runData: completeRun }

    } catch (err) {
      const error      = (err as Error).message
      const durationMs = Date.now() - startTime

      await runRef.update({
        status:      'error',
        error,
        durationMs,
        completedAt: FieldValue.serverTimestamp(),
      })

      console.error(`[${this.name}] Agent failed:`, error)
      throw err
    }
  }
}
