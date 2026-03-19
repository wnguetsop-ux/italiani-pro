// ============================================================
// ITALIANIPRO — AI Providers
// Interface commune pour OpenAI et Claude
// ============================================================

import type { AIMessage, AIResponse, AIProviderConfig } from '../schemas/types'

// ── Interface commune ─────────────────────────────────────
export interface AIProvider {
  generateText(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse>
  generateStructuredOutput<T>(
    messages: AIMessage[],
    config:   AIProviderConfig,
    requiredKeys: string[]
  ): Promise<{ data: T; raw: string }>
}

// ── OpenAI Provider ───────────────────────────────────────
export class OpenAIProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model:       config.model,
        messages:    messages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        max_tokens:  config.maxTokens,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const choice = data.choices?.[0]

    return {
      content:      choice?.message?.content ?? '',
      usage:        { inputTokens: data.usage?.prompt_tokens ?? 0, outputTokens: data.usage?.completion_tokens ?? 0 },
      model:        data.model,
      finishReason: choice?.finish_reason ?? 'stop',
    }
  }

  async generateStructuredOutput<T>(
    messages:     AIMessage[],
    config:       AIProviderConfig,
    requiredKeys: string[]
  ): Promise<{ data: T; raw: string }> {
    const systemMsg = messages.find(m => m.role === 'system')
    const augmented: AIMessage[] = messages.map(m =>
      m.role === 'system'
        ? { ...m, content: m.content + '\n\nRéponds UNIQUEMENT en JSON valide, sans backticks, sans texte avant ou après.' }
        : m
    )

    const response  = await this.generateText(augmented, { ...config, temperature: 0.2 })
    const raw       = response.content.trim()
    const { validateAgentOutput } = await import('../guards/compliance')
    const result    = validateAgentOutput<T>(raw, requiredKeys)

    if (!result.valid || !result.data) {
      throw new Error(`Structured output invalid: ${result.error}\nRaw: ${raw.slice(0, 200)}`)
    }

    return { data: result.data, raw }
  }
}

// ── Claude Provider ───────────────────────────────────────
export class ClaudeProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
    const userMsgs  = messages.filter(m => m.role !== 'system')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      config.model,
        max_tokens: config.maxTokens,
        system:     systemMsg,
        messages:   userMsgs.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return {
      content:      data.content?.[0]?.text ?? '',
      usage:        { inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0 },
      model:        data.model,
      finishReason: data.stop_reason ?? 'end_turn',
    }
  }

  async generateStructuredOutput<T>(
    messages:     AIMessage[],
    config:       AIProviderConfig,
    requiredKeys: string[]
  ): Promise<{ data: T; raw: string }> {
    const augmented: AIMessage[] = messages.map(m =>
      m.role === 'system'
        ? { ...m, content: m.content + '\n\nRéponds UNIQUEMENT en JSON valide, sans backticks, sans texte avant ou après.' }
        : m
    )
    const response = await this.generateText(augmented, { ...config, temperature: 0.2 })
    const raw      = response.content.trim()
    const { validateAgentOutput } = await import('../guards/compliance')
    const result   = validateAgentOutput<T>(raw, requiredKeys)

    if (!result.valid || !result.data) {
      throw new Error(`Structured output invalid: ${result.error}\nRaw: ${raw.slice(0, 200)}`)
    }

    return { data: result.data, raw }
  }
}

// ── Factory ───────────────────────────────────────────────
export function createProvider(type: 'openai' | 'claude'): AIProvider {
  if (type === 'claude') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY not set')
    return new ClaudeProvider(key)
  }
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY not set')
  return new OpenAIProvider(key)
}

// ── Default configs par agent ─────────────────────────────
export const AGENT_CONFIGS: Record<string, { provider: 'openai' | 'claude'; model: string; temperature: number; maxTokens: number }> = {
  agent_profile_analyzer:   { provider: 'openai', model: 'gpt-4o',      temperature: 0.3, maxTokens: 1200 },
  agent_document_checklist: { provider: 'openai', model: 'gpt-4o-mini',  temperature: 0.1, maxTokens: 800  },
  agent_cv_fr:              { provider: 'openai', model: 'gpt-4o',      temperature: 0.4, maxTokens: 2000 },
  agent_cv_it:              { provider: 'openai', model: 'gpt-4o',      temperature: 0.4, maxTokens: 2000 },
  agent_cover_letter:       { provider: 'openai', model: 'gpt-4o',      temperature: 0.5, maxTokens: 1500 },
  agent_client_message:     { provider: 'openai', model: 'gpt-4o-mini',  temperature: 0.4, maxTokens: 600  },
  agent_proof_summary:      { provider: 'openai', model: 'gpt-4o-mini',  temperature: 0.3, maxTokens: 800  },
  agent_interview_coach:    { provider: 'openai', model: 'gpt-4o',      temperature: 0.5, maxTokens: 2000 },
  agent_admin_assistant:    { provider: 'claude', model: 'claude-sonnet-4-6', temperature: 0.2, maxTokens: 1000 },
  agent_payment_reminder:   { provider: 'openai', model: 'gpt-4o-mini',  temperature: 0.3, maxTokens: 600  },
}
