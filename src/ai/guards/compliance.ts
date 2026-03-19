// ============================================================
// ITALIANIPRO — Compliance Guards
// Garantit que les outputs IA respectent le positionnement légal
// ============================================================

// Termes interdits dans TOUT output destiné au client
const FORBIDDEN_PHRASES = [
  'garantit un emploi',
  'garantit un visa',
  'garantit la nulla osta',
  'garantie d\'emploi',
  'garantie de visa',
  'assure votre embauche',
  'assure votre visa',
  'vous obtiendrez',
  'vous aurez un emploi',
  'vous serez embauché',
  'placement garanti',
  'agence de placement',
  'nous déposons votre demande officielle',
  'nous soumettons votre nulla osta',
  'visa garanti',
  'nulla osta garanti',
  'emploi garanti',
  'certifions votre emploi',
  'certifions votre visa',
  // English
  'guarantees a job',
  'guarantees a visa',
  'guarantees nulla osta',
  'guaranteed employment',
  'guaranteed visa',
  'you will get hired',
  'you will get the visa',
  'placement agency',
  'we submit your official request',
  'we guarantee',
]

// Phrases de remplacement obligatoires
export const COMPLIANT_REPLACEMENTS: Record<string, string> = {
  'emploi garanti': 'accompagnement documentaire pour augmenter vos chances',
  'visa garanti':   'préparation de dossier pour le visa',
  'nulla osta garanti': 'préparation des documents nécessaires au processus',
  'placement':      'accompagnement administratif',
}

// Disclaimer obligatoire à injecter dans certains messages
export const LEGAL_DISCLAIMER_FR = `\n\n---\n⚠️ ItalianiPro est une plateforme d'accompagnement documentaire. Nous n'agissons pas comme agence d'emploi ou de visa. La décision finale appartient à l'employeur et aux autorités italiennes.`

export const LEGAL_DISCLAIMER_EN = `\n\n---\n⚠️ ItalianiPro is a document support platform. We do not act as an employment or visa agency. The final decision belongs to the employer and Italian authorities.`

// ── Guard principal ───────────────────────────────────────
export interface GuardResult {
  passed:       boolean
  violations:   string[]
  sanitized?:   string
}

export function runComplianceGuard(text: string, lang: 'fr' | 'en' | 'it' = 'fr'): GuardResult {
  const lower      = text.toLowerCase()
  const violations: string[] = []

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      violations.push(phrase)
    }
  }

  if (violations.length > 0) {
    let sanitized = text
    for (const v of violations) {
      const regex = new RegExp(v, 'gi')
      const replacement = COMPLIANT_REPLACEMENTS[v.toLowerCase()] ?? '[accompagnement documentaire]'
      sanitized = sanitized.replace(regex, replacement)
    }
    return { passed: false, violations, sanitized }
  }

  return { passed: true, violations: [] }
}

// ── Injecter disclaimer si message client ─────────────────
export function addDisclaimerIfNeeded(text: string, lang: 'fr' | 'en' | 'it', addDisclaimer: boolean): string {
  if (!addDisclaimer) return text
  const disclaimer = lang === 'en' ? LEGAL_DISCLAIMER_EN : LEGAL_DISCLAIMER_FR
  return text + disclaimer
}

// ── Valider JSON output agent ─────────────────────────────
export function validateAgentOutput<T>(raw: string, requiredKeys: string[]): { valid: boolean; data?: T; error?: string } {
  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean) as T
    for (const key of requiredKeys) {
      if (!(key in (parsed as object))) {
        return { valid: false, error: `Missing required key: ${key}` }
      }
    }
    return { valid: true, data: parsed }
  } catch (e) {
    return { valid: false, error: `JSON parse failed: ${(e as Error).message}` }
  }
}

// ── Prompt guard à injecter dans chaque système prompt ────
export const SYSTEM_COMPLIANCE_BLOCK = `
RÈGLES DE CONFORMITÉ ABSOLUES (priorité maximale) :
- Ne JAMAIS promettre un emploi, un visa, une nulla osta ou une embauche garantie.
- Ne JAMAIS affirmer que la plateforme dépose une demande officielle de nulla osta.
- Ne JAMAIS présenter ItalianiPro comme une agence de placement ou d'immigration.
- Rester strictement dans le cadre : accompagnement documentaire, préparation administrative, amélioration du dossier, coaching, suivi.
- Si une formulation risque de tromper le client sur ses chances réelles, la reformuler.
- Ton : professionnel, rassurant, honnête, sans promesses non tenues.
`
