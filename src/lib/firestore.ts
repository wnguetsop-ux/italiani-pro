// ============================================================
// ITALIANIPRO — Firestore CRUD helpers
// ============================================================
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, Timestamp,
  DocumentData, QueryConstraint, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ── COLLECTION NAMES ─────────────────────────────────────────
export const COLLECTIONS = {
  USERS:               'users',
  CANDIDATE_PROFILES:  'candidate_profiles',
  DOCUMENTS:           'documents',
  DOCUMENT_TYPES:      'document_types',
  DOCUMENT_REQUESTS:   'document_requests',
  ORDERS:              'orders',
  PAYMENTS:            'payments',
  MILESTONES:          'milestones',
  INVOICES:            'invoices',
  PACKAGES:            'packages',
  PROMO_CODES:         'promo_codes',
  REFERRALS:           'referrals',
  CONVERSATIONS:       'conversations',
  MESSAGES:            'messages',
  APPOINTMENTS:        'appointments',
  NOTIFICATIONS:       'notifications',
  LEGAL_CONSENTS:      'legal_consents',
  SUPPORT_TICKETS:     'support_tickets',
  TICKET_REPLIES:      'ticket_replies',
  INTERNAL_NOTES:      'internal_notes',
  ACTIVITY_LOGS:       'activity_logs',
  ADMIN_TASKS:         'admin_tasks',
  PROOFS:              'proofs',
  PROOF_FILES:         'proof_files',
  CV_VERSIONS:         'cv_versions',
  COVER_LETTERS:       'cover_letters',
  LETTER_TEMPLATES:    'letter_templates',
  APPLICATIONS:        'applications',
  FLUSSI_EVENTS:       'flussi_calendar_events',
  KNOWLEDGE_ARTICLES:  'knowledge_articles',
  TAGS:                'tags',
} as const

// ── GENERIC HELPERS ──────────────────────────────────────────

export async function getDocument<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
  id?: string
): Promise<string> {
  const payload = { ...data, created_at: serverTimestamp(), updated_at: serverTimestamp() }
  if (id) {
    await setDoc(doc(db, collectionName, id), payload)
    return id
  }
  const ref = await addDoc(collection(db, collectionName), payload)
  return ref.id
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updated_at: serverTimestamp(),
  })
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id))
}

// ── ACTIVITY LOG ─────────────────────────────────────────────
export async function logActivity(params: {
  actor_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, unknown>
}) {
  await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
    ...params,
    created_at: serverTimestamp(),
  })
}

// ── NOTIFICATIONS ────────────────────────────────────────────
export async function createNotification(params: {
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  action_url?: string
}) {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    ...params,
    is_read: false,
    created_at: serverTimestamp(),
  })
}

// ── CANDIDATE SCORE ──────────────────────────────────────────
export async function recalculateCompletenessScore(candidateId: string): Promise<number> {
  // Get required document types
  const typesSnap = await getDocs(
    query(collection(db, COLLECTIONS.DOCUMENT_TYPES), where('is_required', '==', true), where('is_active', '==', true))
  )
  const totalRequired = typesSnap.size
  if (totalRequired === 0) return 0

  // Get validated docs for candidate
  const docsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.DOCUMENTS),
      where('candidate_id', '==', candidateId),
      where('status', 'in', ['uploaded', 'in_review', 'approved'])
    )
  )

  const score = Math.min(Math.round((docsSnap.size / totalRequired) * 100), 100)

  // Update candidate profile
  await updateDocument(COLLECTIONS.CANDIDATE_PROFILES, candidateId, {
    completeness_score: score,
  })

  return score
}

// ── REALTIME LISTENER ────────────────────────────────────────
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: DocumentData[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('user_id', '==', userId),
    where('is_read', '==', false),
    orderBy('created_at', 'desc'),
    limit(20)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: DocumentData[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('conversation_id', '==', conversationId),
    orderBy('created_at', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── TIMESTAMP HELPER ─────────────────────────────────────────
export function tsToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null
  return ts.toDate()
}

export function tsToString(ts: Timestamp | null | undefined): string {
  const d = tsToDate(ts)
  if (!d) return ''
  return d.toISOString()
}
