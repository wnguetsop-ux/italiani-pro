import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ActivityLogDoc,
  buildDerivedDossierPatch,
  CandidateApplicationDoc,
  CandidateDocumentDoc,
  CandidateDossierDoc,
  CandidateUserDoc,
  normalizeCandidateRecord,
} from '@/lib/backoffice'

function groupByCandidateId<T extends { uid?: string; candidateId?: string }>(items: T[]) {
  return items.reduce<Map<string, T[]>>((groups, item) => {
    const key = item.candidateId || item.uid
    if (!key) return groups
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
    return groups
  }, new Map<string, T[]>())
}

function toActivityLog(docId: string, data: Record<string, unknown>): ActivityLogDoc {
  return { id: docId, ...(data as ActivityLogDoc) }
}

export async function loadBackofficeIndex() {
  const [usersSnap, dossiersSnap, documentsSnap, applicationsSnap, activitiesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'dossiers')),
    getDocs(collection(db, 'documents')),
    getDocs(collection(db, 'applications')),
    getDocs(collection(db, 'activity_logs')),
  ])

  const usersById = new Map<string, CandidateUserDoc>()
  usersSnap.docs.forEach((snapshot) => {
    const data = snapshot.data() as CandidateUserDoc
    if (data.role === 'candidat' || dossiersSnap.docs.some((dossier) => dossier.id === snapshot.id)) {
      usersById.set(snapshot.id, data)
    }
  })

  const dossiersById = new Map<string, CandidateDossierDoc>()
  dossiersSnap.docs.forEach((snapshot) => {
    dossiersById.set(snapshot.id, snapshot.data() as CandidateDossierDoc)
  })

  const documents = documentsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...(snapshot.data() as CandidateDocumentDoc) }))
  const applications = applicationsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...(snapshot.data() as CandidateApplicationDoc) }))
  const activities = activitiesSnap.docs.map((snapshot) => toActivityLog(snapshot.id, snapshot.data() as Record<string, unknown>))

  const documentsByCandidate = groupByCandidateId(documents)
  const applicationsByCandidate = groupByCandidateId(applications)
  const activitiesByCandidate = groupByCandidateId(activities)

  const candidateIds = new Set<string>([
    ...Array.from(usersById.keys()),
    ...Array.from(dossiersById.keys()),
    ...Array.from(documentsByCandidate.keys()),
    ...Array.from(applicationsByCandidate.keys()),
    ...Array.from(activitiesByCandidate.keys()),
  ])

  return Array.from(candidateIds)
    .map((candidateId) =>
      normalizeCandidateRecord({
        id: candidateId,
        user: usersById.get(candidateId) ?? null,
        dossier: dossiersById.get(candidateId) ?? null,
        documents: documentsByCandidate.get(candidateId) ?? [],
        applications: applicationsByCandidate.get(candidateId) ?? [],
        activities: activitiesByCandidate.get(candidateId) ?? [],
      }),
    )
    .sort((left, right) => (right.lastActivityAt?.getTime() ?? 0) - (left.lastActivityAt?.getTime() ?? 0))
}

export async function loadCandidateWorkspace(candidateId: string) {
  const [userSnap, dossierSnap, documentsSnap, applicationsSnap, activitiesSnap] = await Promise.all([
    getDoc(doc(db, 'users', candidateId)),
    getDoc(doc(db, 'dossiers', candidateId)),
    getDocs(query(collection(db, 'documents'), where('uid', '==', candidateId))),
    getDocs(query(collection(db, 'applications'), where('candidateId', '==', candidateId))),
    getDocs(query(collection(db, 'activity_logs'), where('candidateId', '==', candidateId))),
  ])

  const user = userSnap.exists() ? (userSnap.data() as CandidateUserDoc) : null
  const dossier = dossierSnap.exists() ? (dossierSnap.data() as CandidateDossierDoc) : null
  const documents = documentsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...(snapshot.data() as CandidateDocumentDoc) }))
  const applications = applicationsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...(snapshot.data() as CandidateApplicationDoc) }))
  const activities = activitiesSnap.docs.map((snapshot) => toActivityLog(snapshot.id, snapshot.data() as Record<string, unknown>))

  const candidate = normalizeCandidateRecord({
    id: candidateId,
    user,
    dossier,
    documents,
    applications,
    activities,
  })

  return {
    candidate,
    user,
    dossier,
    documents,
    applications,
    activities,
  }
}

export async function recordCandidateActivity(input: {
  candidateId: string
  type: string
  title: string
  description: string
  actorName?: string
  actorRole?: string
  metadata?: Record<string, unknown>
}) {
  await addDoc(collection(db, 'activity_logs'), {
    candidateId: input.candidateId,
    uid: input.candidateId,
    type: input.type,
    title: input.title,
    description: input.description,
    actorName: input.actorName ?? 'System',
    actorRole: input.actorRole ?? 'system',
    metadata: input.metadata ?? {},
    created_at: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

export async function syncCandidateDerivedFields(candidateId: string) {
  const workspace = await loadCandidateWorkspace(candidateId)
  await updateDoc(doc(db, 'dossiers', candidateId), {
    ...buildDerivedDossierPatch(workspace.candidate),
    updated_at: serverTimestamp(),
  })
  return workspace.candidate
}

export async function createCandidateApplication(input: {
  candidateId: string
  platform: string
  employer: string
  jobTitle: string
  status: CandidateApplicationDoc['status']
  followUpAt?: Date | null
  lastContactAt?: Date | null
  submittedAt?: Date | null
  result?: string
  notes?: string
  proofPath?: string
}) {
  await addDoc(collection(db, 'applications'), {
    candidateId: input.candidateId,
    uid: input.candidateId,
    platform: input.platform,
    employer: input.employer,
    jobTitle: input.jobTitle,
    status: input.status ?? 'TO_SEND',
    followUpAt: input.followUpAt ?? null,
    lastContactAt: input.lastContactAt ?? null,
    submittedAt: input.submittedAt ?? null,
    result: input.result ?? '',
    notes: input.notes ?? '',
    proofPath: input.proofPath ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
