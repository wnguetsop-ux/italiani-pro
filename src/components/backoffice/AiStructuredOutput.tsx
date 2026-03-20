import React from 'react'

const LABELS: Record<string, string> = {
  strengths: 'Points forts',
  weaknesses: 'Points faibles',
  recommendedSectors: 'Secteurs recommandes',
  preparationLevel: 'Niveau de preparation',
  preparationScore: 'Score de preparation',
  summaryFr: 'Resume FR',
  summaryEn: 'Resume EN',
  nextActions: 'Prochaines actions',
  internalNotes: 'Notes internes',
  missingDocuments: 'Documents manquants',
  urgentDocuments: 'Documents urgents',
  optionalDocuments: 'Documents optionnels',
  clientMessageFr: 'Message client FR',
  clientMessageEn: 'Message client EN',
  completenessEstimate: 'Completude estimee',
  warnings: 'Points a verifier',
  wordCount: 'Nombre de mots',
  summaryText: 'Synthese',
  actionsListed: 'Actions listees',
  totalHours: 'Heures totales',
  clientMessage: 'Message client',
  questions: 'Questions et reponses',
  generalAdvice: 'Conseils generaux',
  keyPhrases: 'Phrases utiles',
  thingsToAvoid: 'A eviter',
  summary: 'Synthese',
  suggestedAction: 'Action recommandee',
  priority: 'Priorite',
  isBlocked: 'Dossier bloque',
  blockReason: 'Raison du blocage',
  suggestedMessage: 'Message suggere',
  messageText: 'Message',
  urgencyLevel: 'Niveau d urgence',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toLabel(key: string) {
  if (LABELS[key]) return LABELS[key]
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/^\w/, (char) => char.toUpperCase())
}

function stringifyPrimitive(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function hasRenderableValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isRecord(value)) return Object.keys(value).length > 0
  return true
}

function renderObject(value: Record<string, unknown>, keyPrefix: string) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {Object.entries(value).map(([key, nestedValue]) => {
        if (!hasRenderableValue(nestedValue)) return null
        return (
          <div key={`${keyPrefix}-${key}`} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '10px 12px', background: 'white' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {toLabel(key)}
            </div>
            {renderValue(nestedValue, `${keyPrefix}-${key}`)}
          </div>
        )
      })}
    </div>
  )
}

function renderArray(value: unknown[], keyPrefix: string) {
  if (value.every((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
    return (
      <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
        {value.map((item, index) => (
          <li key={`${keyPrefix}-${index}`} style={{ marginBottom: '6px' }}>
            {stringifyPrimitive(item as string | number | boolean)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {value.map((item, index) => {
        if (isRecord(item)) {
          return (
            <div key={`${keyPrefix}-${index}`} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', background: 'white' }}>
              {renderObject(item, `${keyPrefix}-${index}`)}
            </div>
          )
        }
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return (
            <div key={`${keyPrefix}-${index}`} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '10px 12px', background: 'white', color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
              {stringifyPrimitive(item)}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

function renderValue(value: unknown, keyPrefix: string): React.ReactNode {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return renderArray(value, keyPrefix)
  if (isRecord(value)) return renderObject(value, keyPrefix)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <div style={{ color: '#334155', fontSize: '13px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{stringifyPrimitive(value)}</div>
  }
  return <div style={{ color: '#334155', fontSize: '13px', lineHeight: 1.75 }}>{String(value)}</div>
}

export function AiStructuredOutput({
  output,
  excludeKeys = [],
}: {
  output: Record<string, unknown>
  excludeKeys?: string[]
}) {
  const visibleEntries = Object.entries(output).filter(
    ([key, value]) => !excludeKeys.includes(key) && hasRenderableValue(value),
  )

  if (!visibleEntries.length) return null

  return (
    <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
      {visibleEntries.map(([key, value]) => (
        <div key={key} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', background: 'white' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            {toLabel(key)}
          </div>
          {renderValue(value, key)}
        </div>
      ))}
    </div>
  )
}
