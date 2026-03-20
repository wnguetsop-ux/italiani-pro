'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Flame,
  Loader2,
  PlusCircle,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { auth, db } from '@/lib/firebase'
import {
  buildDocumentDownloadName,
  canCreateApplication,
  canMoveToReadyForCv,
  canMoveToReadyToApply,
  CandidateRecord,
  CandidateStatus,
  CHECKLIST_SECTIONS,
  DOCUMENT_TYPE_OPTIONS,
  DocumentWorkflowStatus,
  ApplicationStatus,
  getRecommendedLocalArchivePath,
  mapCandidateStatusToLegacy,
  mapDocumentStatusToLegacy,
  normalizeDocumentStatus,
  APPLICATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  toDate,
} from '@/lib/backoffice'
import {
  createCandidateApplication,
  loadCandidateWorkspace,
  recordCandidateActivity,
  syncCandidateDerivedFields,
} from '@/lib/backoffice-data'
import { fmt_date, fmt_size, relative_time } from '@/lib/utils'
import {
  ApplicationStatusPill,
  CandidateStatusPill,
  DocumentStatusPill,
  PriorityPill,
  ScoreBar,
  SectionCard,
} from '@/components/backoffice/BackofficeUi'
import { AiStructuredOutput } from '@/components/backoffice/AiStructuredOutput'
import { buildCvPrintHtml, CvProfessionalPreview, type CvRenderData } from '@/components/backoffice/CvProfessionalPreview'
import {
  buildLetterPrintHtml,
  LetterProfessionalPreview,
  type LetterRenderData,
} from '@/components/backoffice/LetterProfessionalPreview'

const AGENTS = [
  { id:'analyze_profile', label:'Analyser le profil', desc:'Forces, faiblesses et score de preparation' },
  { id:'generate_checklist', label:'Checklist documents', desc:'Pieces manquantes et prochaines actions' },
  { id:'generate_cv_fr', label:'Generer CV (FR)', desc:'Version francaise optimisee' },
  { id:'generate_cv_it', label:'Generer CV (IT)', desc:'Version italienne pour la candidature' },
  { id:'generate_cover_letter', label:'Lettre motivation (IT)', desc:'Version italienne exportable en PDF' },
  { id:'assist_admin', label:'Assistant admin', desc:'Synthese du dossier et action recommande' },
] as const

type Tab = 'pilotage' | 'documents' | 'candidatures' | 'messages' | 'ia'
type CandidateWorkspace = Awaited<ReturnType<typeof loadCandidateWorkspace>>
type CandidateDocument = CandidateRecord['documents'][number]

interface PlanFormState {
  workflowStatus: CandidateStatus
  targetJob: string
  sector: string
  pack: string
  preferredRegionItaly: string
  nextAction: string
  nextActionAt: string
  internalNotes: string
  country: string
  whatsapp: string
  isUrgent: boolean
}

interface DocumentDraftState {
  doc_type: string
  workflow_status: DocumentWorkflowStatus
  source_language: string
  translated_language: string
  final_version: boolean
}

interface ApplicationDraftState {
  platform: string
  employer: string
  jobTitle: string
  status: ApplicationStatus
  submittedAt: string
  followUpAt: string
  lastContactAt: string
  result: string
  notes: string
  proofPath: string
}

const DEFAULT_APPLICATION_FORM: ApplicationDraftState = {
  platform: '',
  employer: '',
  jobTitle: '',
  status: 'SENT',
  submittedAt: '',
  followUpAt: '',
  lastContactAt: '',
  result: '',
  notes: '',
  proofPath: '',
}

function toDateInput(value: Date | null) {
  if (!value) return ''
  return value.toISOString().slice(0, 10)
}

function parseDateInput(value: string) {
  if (!value) return null
  return new Date(`${value}T09:00:00`)
}

function inferNextStatusFromApplication(status: ApplicationStatus) {
  if (status === 'FOLLOW_UP_DUE') return 'FOLLOW_UP' as CandidateStatus
  if (status === 'POSITIVE') return 'POSITIVE' as CandidateStatus
  if (status === 'SENT' || status === 'WAITING_REPLY') return 'APPLYING' as CandidateStatus
  return null
}

function looksLikePdf(document: CandidateDocument) {
  return document.mime_type === 'application/pdf' || document.file_url?.toLowerCase().includes('.pdf')
}

function looksLikeImage(document: CandidateDocument) {
  return Boolean(document.mime_type?.startsWith('image/'))
}

function buildAiSource(candidate: CandidateRecord, document: CandidateDocument | null) {
  const sections = [
    `Nom: ${candidate.fullName}`,
    `Metier vise: ${candidate.targetJob || candidate.dossier.profession || 'A preciser'}`,
    candidate.sector ? `Secteur cible: ${candidate.sector}` : '',
    candidate.preferredRegionItaly ? `Region Italie: ${candidate.preferredRegionItaly}` : '',
    candidate.dossier.experiences ? `Experiences brutes:\n${String(candidate.dossier.experiences)}` : '',
    candidate.dossier.competences ? `Competences et formations:\n${String(candidate.dossier.competences)}` : '',
    document?.content_text ? `Contenu du document selectionne:\n${document.content_text}` : '',
  ]

  return sections.filter(Boolean).join('\n\n')
}

function buildCvPreviewData(candidate: CandidateRecord, output: any, language: 'fr' | 'it'): CvRenderData | null {
  if (!output?.cvText) return null

  const sections = Array.isArray(output.cvSections) && output.cvSections.length > 0
    ? output.cvSections
        .filter((section: any) => section && typeof section.title === 'string' && typeof section.content === 'string')
        .map((section: any) => ({ title: String(section.title), content: String(section.content) }))
    : [{ title: language === 'it' ? 'Curriculum' : 'CV', content: String(output.cvText) }]

  const summarySection = sections.find((section: { title: string; content: string }) => /profil|profile|profilo/i.test(section.title))

  return {
    fullName: candidate.fullName,
    title: String(output.suggestedTitle || candidate.targetJob || candidate.dossier.profession || 'Profil professionnel'),
    email: candidate.email || '',
    phone: candidate.whatsapp || '',
    location: [candidate.preferredRegionItaly, candidate.country].filter(Boolean).join(' · '),
    summary: summarySection?.content,
    sections,
    keywords: Array.isArray(output.keywords) ? output.keywords.map((item: unknown) => String(item)) : [],
    lang: language,
  }
}

function buildLetterPreviewData(candidate: CandidateRecord, output: any, language: 'fr' | 'it' | 'en'): LetterRenderData | null {
  if (!output?.letterText) return null

  const paragraphs = String(output.letterText)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => paragraph !== output.salutation && paragraph !== output.closing && paragraph !== candidate.fullName)

  return {
    fullName: candidate.fullName,
    title: String(output.suggestedTitle || candidate.targetJob || candidate.dossier.profession || 'Candidat ItalianiPro'),
    email: candidate.email || '',
    phone: candidate.whatsapp || '',
    location: [candidate.preferredRegionItaly, candidate.country].filter(Boolean).join(' | '),
    subject: typeof output.subject === 'string' ? output.subject : '',
    salutation: typeof output.salutation === 'string' ? output.salutation : '',
    bodyParagraphs: paragraphs.length ? paragraphs : [String(output.letterText)],
    closing: typeof output.closing === 'string' ? output.closing : '',
    signature: candidate.fullName,
    lang: language,
  }
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [tab, setTab] = useState<Tab>('pilotage')
  const [workspace, setWorkspace] = useState<CandidateWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savingChecklist, setSavingChecklist] = useState<string | null>(null)
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null)
  const [savingApplicationId, setSavingApplicationId] = useState<string | null>(null)
  const [creatingApplication, setCreatingApplication] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [adminName, setAdminName] = useState('Equipe ItalianiPro')
  const [agentLoading, setAgentLoading] = useState<string | null>(null)
  const [agentResults, setAgentResults] = useState<Record<string, any>>({})
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [aiSourceText, setAiSourceText] = useState('')

  const [planForm, setPlanForm] = useState<PlanFormState>({
    workflowStatus: 'NEW',
    targetJob: '',
    sector: '',
    pack: '',
    preferredRegionItaly: '',
    nextAction: '',
    nextActionAt: '',
    internalNotes: '',
    country: '',
    whatsapp: '',
    isUrgent: false,
  })
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, DocumentDraftState>>({})
  const [applicationDrafts, setApplicationDrafts] = useState<Record<string, ApplicationDraftState>>({})
  const [newApplication, setNewApplication] = useState<ApplicationDraftState>(DEFAULT_APPLICATION_FORM)

  const hydrateForms = useCallback((candidate: CandidateRecord) => {
    setPlanForm({
      workflowStatus: candidate.workflowStatus,
      targetJob: candidate.targetJob,
      sector: candidate.sector,
      pack: candidate.pack,
      preferredRegionItaly: candidate.preferredRegionItaly,
      nextAction: candidate.nextAction,
      nextActionAt: toDateInput(candidate.nextActionAt),
      internalNotes: candidate.internalNotes,
      country: candidate.country,
      whatsapp: candidate.whatsapp,
      isUrgent: candidate.isUrgent,
    })

    const nextDocumentDrafts: Record<string, DocumentDraftState> = {}
    candidate.documents.forEach((document) => {
      nextDocumentDrafts[document.id] = {
        doc_type: document.doc_type || document.type_doc || 'other',
        workflow_status: normalizeDocumentStatus(document),
        source_language: String(document.source_language || ''),
        translated_language: String(document.translated_language || ''),
        final_version: document.final_version === true,
      }
    })
    setDocumentDrafts(nextDocumentDrafts)

    const nextApplicationDrafts: Record<string, ApplicationDraftState> = {}
    candidate.applications.forEach((application) => {
      nextApplicationDrafts[application.id] = {
        platform: String(application.platform || ''),
        employer: String(application.employer || ''),
        jobTitle: String(application.jobTitle || ''),
        status: (application.status || 'TO_SEND') as ApplicationStatus,
        submittedAt: toDateInput(toDate(application.submittedAt)),
        followUpAt: toDateInput(toDate(application.followUpAt)),
        lastContactAt: toDateInput(toDate(application.lastContactAt)),
        result: String(application.result || ''),
        notes: String(application.notes || ''),
        proofPath: String(application.proofPath || ''),
      }
    })
    setApplicationDrafts(nextApplicationDrafts)
  }, [])

  const ensureConversation = useCallback(async () => {
    const convSnap = await getDocs(query(collection(db, 'conversations'), where('uid', '==', id)))
    if (!convSnap.empty) {
      setConvId(convSnap.docs[0].id)
      await updateDoc(doc(db, 'conversations', convSnap.docs[0].id), {
        unread_admin_count: 0,
      })
      return
    }

    const created = await addDoc(collection(db, 'conversations'), {
      uid: id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      unread_admin_count: 0,
      unread_candidate_count: 0,
      last_message_at: null,
      last_message_excerpt: '',
      last_sender: '',
    })
    setConvId(created.id)
  }, [id])

  const loadAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [candidateWorkspace, adminSnap] = await Promise.all([
        loadCandidateWorkspace(id),
        auth.currentUser?.uid ? getDoc(doc(db, 'users', auth.currentUser.uid)) : Promise.resolve(null),
      ])
      setWorkspace(candidateWorkspace)
      hydrateForms(candidateWorkspace.candidate)
      if (adminSnap && adminSnap.exists()) {
        setAdminName(String(adminSnap.data().full_name || 'Equipe ItalianiPro'))
      }
      await ensureConversation()
    } catch (error: any) {
      console.error('candidate-detail-load-error', error)
      toast.error(error?.message || 'Impossible de charger ce dossier')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [ensureConversation, hydrateForms, id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!convId) return

    const messagesQuery = query(collection(db, 'conversations', convId, 'messages'), orderBy('created_at', 'asc'))

    return onSnapshot(messagesQuery, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setMessages(list.filter((message: any) => message.interne !== true))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    })
  }, [convId])

  const candidate = workspace?.candidate ?? null
  const selectedDocument = candidate?.documents.find((item) => item.id === selectedDocumentId) ?? candidate?.documents[0] ?? null

  useEffect(() => {
    if (!candidate) return

    if (!selectedDocumentId || !candidate.documents.some((item) => item.id === selectedDocumentId)) {
      setSelectedDocumentId(candidate.documents[0]?.id ?? null)
    }

    if (!aiSourceText.trim()) {
      setAiSourceText(buildAiSource(candidate, candidate.documents[0] ?? null))
    }
  }, [candidate, selectedDocumentId, aiSourceText])

  const savePlan = async () => {
    if (!candidate) return
    if (planForm.workflowStatus === 'READY_FOR_CV' && !canMoveToReadyForCv(candidate)) {
      toast.error('Terminez le checklist "Dossier complet" avant de passer en Pret CV.')
      return
    }
    if (planForm.workflowStatus === 'READY_TO_APPLY' && !canMoveToReadyToApply(candidate)) {
      toast.error('Terminez le checklist "CV pret" avant de passer en Pret a postuler.')
      return
    }

    setSavingPlan(true)
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', id), {
          phone: planForm.whatsapp,
          country_code: planForm.country,
          updated_at: serverTimestamp(),
        }),
        updateDoc(doc(db, 'dossiers', id), {
          workflow_status: planForm.workflowStatus,
          statut: mapCandidateStatusToLegacy(planForm.workflowStatus),
          target_job: planForm.targetJob,
          profession: planForm.targetJob,
          secteur_cible: planForm.sector,
          pack: planForm.pack,
          region_italie: planForm.preferredRegionItaly,
          next_action: planForm.nextAction,
          next_action_at: parseDateInput(planForm.nextActionAt),
          internal_notes: planForm.internalNotes,
          is_urgent: planForm.isUrgent,
          click_day_urgent: planForm.isUrgent,
          updated_at: serverTimestamp(),
        }),
      ])
      await recordCandidateActivity({
        candidateId: id,
        type: 'candidate_plan_updated',
        title: 'Pilotage du dossier mis a jour',
        description: `Workflow place sur ${planForm.workflowStatus}.`,
        actorName: adminName,
        actorRole: 'admin',
        metadata: {
          workflow_status: planForm.workflowStatus,
          next_action: planForm.nextAction,
        },
      })
      await syncCandidateDerivedFields(id)
      toast.success('Pilotage enregistre')
      await loadAll()
    } catch (error: any) {
      console.error('candidate-plan-save-error', error)
      toast.error(error?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingPlan(false)
    }
  }

  const toggleChecklistItem = async (sectionKey: string, itemKey: string) => {
    if (!candidate) return

    const nextChecklist = {
      ...candidate.checklist,
      [sectionKey]: {
        ...candidate.checklist[sectionKey as keyof typeof candidate.checklist],
        [itemKey]: !candidate.checklist[sectionKey as keyof typeof candidate.checklist][itemKey],
      },
    }

    setSavingChecklist(`${sectionKey}.${itemKey}`)
    try {
      await updateDoc(doc(db, 'dossiers', id), {
        checklists: nextChecklist,
        updated_at: serverTimestamp(),
      })
      await recordCandidateActivity({
        candidateId: id,
        type: 'checklist_updated',
        title: 'Checklist mise a jour',
        description: `${sectionKey} · ${itemKey}`,
        actorName: adminName,
        actorRole: 'admin',
        metadata: {
          sectionKey,
          itemKey,
          checked: nextChecklist[sectionKey as keyof typeof nextChecklist][itemKey],
        },
      })
      await syncCandidateDerivedFields(id)
      await loadAll()
    } catch (error: any) {
      console.error('checklist-toggle-error', error)
      toast.error(error?.message || 'Impossible de mettre a jour le checklist')
    } finally {
      setSavingChecklist(null)
    }
  }

  const saveDocument = async (documentId: string) => {
    const draft = documentDrafts[documentId]
    if (!draft) return

    setSavingDocumentId(documentId)
    try {
      await updateDoc(doc(db, 'documents', documentId), {
        doc_type: draft.doc_type,
        type_doc: draft.doc_type,
        workflow_status: draft.workflow_status,
        statut: mapDocumentStatusToLegacy(draft.workflow_status),
        source_language: draft.source_language,
        translated_language: draft.translated_language,
        final_version: draft.final_version,
        validated_at: draft.workflow_status === 'VALIDATED' ? new Date() : null,
        updated_at: serverTimestamp(),
      })
      await recordCandidateActivity({
        candidateId: id,
        type: 'document_updated',
        title: 'Document mis a jour',
        description: `Document ${documentId} classe en ${draft.workflow_status}.`,
        actorName: adminName,
        actorRole: 'admin',
      })
      await syncCandidateDerivedFields(id)
      toast.success('Document mis a jour')
      await loadAll()
    } catch (error: any) {
      console.error('document-save-error', error)
      toast.error(error?.message || 'Impossible de sauver le document')
    } finally {
      setSavingDocumentId(null)
    }
  }

  const saveApplication = async (applicationId: string) => {
    const draft = applicationDrafts[applicationId]
    if (!draft) return

    setSavingApplicationId(applicationId)
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        platform: draft.platform,
        employer: draft.employer,
        jobTitle: draft.jobTitle,
        status: draft.status,
        submittedAt: parseDateInput(draft.submittedAt),
        followUpAt: parseDateInput(draft.followUpAt),
        lastContactAt: parseDateInput(draft.lastContactAt),
        result: draft.result,
        notes: draft.notes,
        proofPath: draft.proofPath,
        updatedAt: serverTimestamp(),
      })

      const nextCandidateStatus = inferNextStatusFromApplication(draft.status)
      if (nextCandidateStatus) {
        await updateDoc(doc(db, 'dossiers', id), {
          workflow_status: nextCandidateStatus,
          statut: mapCandidateStatusToLegacy(nextCandidateStatus),
          next_action: nextCandidateStatus === 'FOLLOW_UP' ? 'Faire les relances dues' : 'Suivre les candidatures envoyees',
          next_action_at: draft.followUpAt ? parseDateInput(draft.followUpAt) : serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      }

      await recordCandidateActivity({
        candidateId: id,
        type: 'application_updated',
        title: 'Candidature mise a jour',
        description: `${draft.platform || 'Plateforme'} · ${draft.employer || 'Employeur'} · ${draft.status}`,
        actorName: adminName,
        actorRole: 'admin',
      })
      await syncCandidateDerivedFields(id)
      toast.success('Candidature mise a jour')
      await loadAll()
    } catch (error: any) {
      console.error('application-save-error', error)
      toast.error(error?.message || 'Impossible de mettre a jour la candidature')
    } finally {
      setSavingApplicationId(null)
    }
  }

  const addApplication = async () => {
    if (!candidate) return
    if (!canCreateApplication(candidate)) {
      toast.error('Le dossier doit etre pret a postuler avant de creer une candidature.')
      return
    }
    if (!newApplication.platform.trim() || !newApplication.jobTitle.trim()) {
      toast.error('Plateforme et poste sont obligatoires.')
      return
    }

    setCreatingApplication(true)
    try {
      await createCandidateApplication({
        candidateId: id,
        platform: newApplication.platform,
        employer: newApplication.employer,
        jobTitle: newApplication.jobTitle,
        status: newApplication.status,
        submittedAt: parseDateInput(newApplication.submittedAt),
        followUpAt: parseDateInput(newApplication.followUpAt),
        lastContactAt: parseDateInput(newApplication.lastContactAt),
        result: newApplication.result,
        notes: newApplication.notes,
        proofPath: newApplication.proofPath,
      })

      const nextCandidateStatus = inferNextStatusFromApplication(newApplication.status) ?? 'APPLYING'
      await updateDoc(doc(db, 'dossiers', id), {
        workflow_status: nextCandidateStatus,
        statut: mapCandidateStatusToLegacy(nextCandidateStatus),
        next_action: nextCandidateStatus === 'FOLLOW_UP' ? 'Faire les relances dues' : 'Suivre les candidatures envoyees',
        next_action_at: newApplication.followUpAt ? parseDateInput(newApplication.followUpAt) : serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      await recordCandidateActivity({
        candidateId: id,
        type: 'application_created',
        title: 'Nouvelle candidature creee',
        description: `${newApplication.platform} · ${newApplication.jobTitle}`,
        actorName: adminName,
        actorRole: 'admin',
      })
      await syncCandidateDerivedFields(id)
      setNewApplication(DEFAULT_APPLICATION_FORM)
      toast.success('Candidature ajoutee')
      await loadAll()
    } catch (error: any) {
      console.error('application-create-error', error)
      toast.error(error?.message || 'Impossible de creer la candidature')
    } finally {
      setCreatingApplication(false)
    }
  }

  const sendMessage = async () => {
    if (!convId || !newMessage.trim()) return
    setSendingMessage(true)
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        uid: id,
        convId,
        expediteur: 'admin',
        nom_expediteur: adminName,
        contenu: newMessage.trim(),
        interne: false,
        approuve: true,
        lu_par: [],
        created_at: serverTimestamp(),
      })
      await updateDoc(doc(db, 'conversations', convId), {
        updated_at: serverTimestamp(),
        last_message_at: serverTimestamp(),
        last_message_excerpt: newMessage.trim().slice(0, 120),
        last_sender: 'admin',
        unread_admin_count: 0,
        unread_candidate_count: increment(1),
      })
      await recordCandidateActivity({
        candidateId: id,
        type: 'message_sent',
        title: 'Message envoye',
        description: newMessage.trim().slice(0, 120),
        actorName: adminName,
        actorRole: 'admin',
      })
      setNewMessage('')
    } catch (error: any) {
      console.error('message-send-error', error)
      toast.error(error?.message || 'Erreur lors de l envoi')
    } finally {
      setSendingMessage(false)
    }
  }

  const loadDocumentIntoAi = (document: CandidateDocument) => {
    if (!candidate) return
    setSelectedDocumentId(document.id)
    setAiSourceText(buildAiSource(candidate, document))
    setTab('ia')
    toast.success('Document charge comme base de travail IA')
  }

  const runAgent = async (agentId: string) => {
    setAgentLoading(agentId)
    try {
      const token = document.cookie.match(/ip_token=([^;]+)/)?.[1] ?? ''
      const options = agentId.startsWith('generate_cv_')
        ? {
            sourceText: aiSourceText.trim(),
            sourceDocumentId: selectedDocument?.id ?? undefined,
          }
        : agentId === 'generate_cover_letter'
          ? {
              lang: 'it',
              customNotes: aiSourceText.trim(),
            }
          : {}
      const response = await fetch('/api/ai/run', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: agentId, candidateId: id, options }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Erreur agent')
      setAgentResults((current) => ({ ...current, [agentId]: data.result }))
      toast.success(`${agentId} termine`)
      await loadAll()
    } catch (error: any) {
      console.error('agent-run-error', error)
      toast.error(error?.message || 'Erreur IA')
    } finally {
      setAgentLoading(null)
    }
  }

  const downloadCv = (language: 'fr' | 'it') => {
    const cv = agentResults[`generate_cv_${language}`]?.output?.cvText
    if (!cv || !candidate) {
      toast.error('Generez d abord le CV')
      return
    }
    const blob = new Blob([cv], { type:'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${candidate.code}_${language.toUpperCase()}_CV.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadLetter = () => {
    const letter = agentResults.generate_cover_letter?.output?.letterText
    if (!letter || !candidate) {
      toast.error('Generez d abord la lettre')
      return
    }
    const blob = new Blob([letter], { type:'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${candidate.code}_IT_LETTRE.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openCvPreviewWindow = (language: 'fr' | 'it', printImmediately = false) => {
    if (!candidate) return

    const output = agentResults[`generate_cv_${language}`]?.output
    const previewData = buildCvPreviewData(candidate, output, language)

    if (!previewData) {
      toast.error('Generez d abord le CV')
      return
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900')
    if (!popup) {
      toast.error('Autorisez les popups pour ouvrir l apercu PDF')
      return
    }

    popup.document.open()
    popup.document.write(buildCvPrintHtml(previewData))
    popup.document.close()

    if (printImmediately) {
      window.setTimeout(() => {
        popup.focus()
        popup.print()
      }, 350)
    }
  }

  const openLetterPreviewWindow = (printImmediately = false) => {
    if (!candidate) return

    const output = agentResults.generate_cover_letter?.output
    const previewData = buildLetterPreviewData(candidate, output, 'it')

    if (!previewData) {
      toast.error('Generez d abord la lettre')
      return
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900')
    if (!popup) {
      toast.error('Autorisez les popups pour ouvrir l apercu PDF')
      return
    }

    popup.document.open()
    popup.document.write(buildLetterPrintHtml(previewData))
    popup.document.close()

    if (printImmediately) {
      window.setTimeout(() => {
        popup.focus()
        popup.print()
      }, 350)
    }
  }

  if (loading || !candidate) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'240px', gap:'10px', color:'#6B7280' }}>
        <span className="spinner" /> Chargement du dossier...
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
          <button onClick={() => router.push('/admin/candidats')} className="btn btn-secondary btn-icon btn-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              <h1 style={{ fontSize:'24px', fontWeight:'900', margin:0 }}>{candidate.fullName}</h1>
              <CandidateStatusPill status={candidate.workflowStatus} />
              <PriorityPill value={candidate.priorityScore} />
              {candidate.isUrgent && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'700', color:'#B91C1C', background:'#FEE2E2', padding:'4px 8px', borderRadius:'999px' }}>
                  <Flame size={12} /> Urgent
                </span>
              )}
            </div>
            <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>
              {candidate.email || 'Email absent'} {candidate.whatsapp ? `· ${candidate.whatsapp}` : ''} {candidate.country ? `· ${candidate.country}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <button onClick={loadAll} disabled={refreshing} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : undefined }} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
          <Link href="/admin/candidatures" className="btn btn-secondary btn-sm">
            <ClipboardList size={14} /> Toutes les candidatures
          </Link>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'10px' }}>
        <div className="card" style={{ padding:'14px' }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color:'#1B3A6B' }}>{candidate.readinessScore}%</div>
          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>Readiness score</div>
        </div>
        <div className="card" style={{ padding:'14px' }}>
          <ScoreBar value={candidate.dossierCompletenessPercent} color="#15803D" />
          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'8px' }}>Completude dossier</div>
        </div>
        <div className="card" style={{ padding:'14px' }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color:'#2563EB' }}>{candidate.documentsValidatedCount}/{candidate.documentsReceivedCount}</div>
          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>Documents valides</div>
        </div>
        <div className="card" style={{ padding:'14px' }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color:'#4338CA' }}>{candidate.applicationsCount}</div>
          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>Candidatures</div>
        </div>
        <div className="card" style={{ padding:'14px' }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color:'#B45309' }}>{candidate.followUpsDueToday}</div>
          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>Relances dues</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', background:'#F3F4F6', padding:'4px', borderRadius:'12px' }}>
        {[
          { key:'pilotage', label:'Pilotage' },
          { key:'documents', label:`Documents (${candidate.documents.length})` },
          { key:'candidatures', label:`Candidatures (${candidate.applications.length})` },
          { key:'messages', label:`Messages (${messages.length})` },
          { key:'ia', label:'IA' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as Tab)}
            style={{
              border:'none',
              borderRadius:'10px',
              background: tab === item.key ? '#1B3A6B' : 'transparent',
              color: tab === item.key ? 'white' : '#6B7280',
              padding:'8px 14px',
              fontWeight: tab === item.key ? '700' : '500',
              cursor:'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'pilotage' && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.2fr) minmax(320px,0.8fr)', gap:'14px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <SectionCard title="Pilotage du dossier" action={
              <button onClick={savePlan} disabled={savingPlan} className="btn btn-primary btn-sm">
                {savingPlan ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> Sauvegarde...</> : <><Save size={14} /> Sauvegarder</>}
              </button>
            }>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'12px' }}>
                <div>
                  <label className="field-label">Statut workflow</label>
                  <select value={planForm.workflowStatus} onChange={(event) => setPlanForm((current) => ({ ...current, workflowStatus: event.target.value as CandidateStatus }))}>
                    {Object.entries({
                      NEW:'Nouveau dossier',
                      TO_REVIEW:'A verifier',
                      WAITING_CANDIDATE:'En attente candidat',
                      READY_FOR_CV:'Pret CV',
                      CV_IN_PROGRESS:'CV en cours',
                      READY_TO_APPLY:'Pret a postuler',
                      APPLYING:'Candidatures en cours',
                      FOLLOW_UP:'Relances',
                      POSITIVE:'Positive',
                      NEGATIVE:'Negative',
                      ON_HOLD:'En pause',
                      ARCHIVED:'Archive',
                    }).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Date de prochaine action</label>
                  <input type="date" value={planForm.nextActionAt} onChange={(event) => setPlanForm((current) => ({ ...current, nextActionAt: event.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Metier vise</label>
                  <input value={planForm.targetJob} onChange={(event) => setPlanForm((current) => ({ ...current, targetJob: event.target.value }))} placeholder="Ex: ouvrier agricole" />
                </div>
                <div>
                  <label className="field-label">Secteur</label>
                  <input value={planForm.sector} onChange={(event) => setPlanForm((current) => ({ ...current, sector: event.target.value }))} placeholder="Ex: agriculture" />
                </div>
                <div>
                  <label className="field-label">Pack</label>
                  <input value={planForm.pack} onChange={(event) => setPlanForm((current) => ({ ...current, pack: event.target.value }))} placeholder="Pack CV / Dossier / Premium" />
                </div>
                <div>
                  <label className="field-label">Region Italie</label>
                  <input value={planForm.preferredRegionItaly} onChange={(event) => setPlanForm((current) => ({ ...current, preferredRegionItaly: event.target.value }))} placeholder="Ex: Veneto" />
                </div>
                <div>
                  <label className="field-label">WhatsApp</label>
                  <input value={planForm.whatsapp} onChange={(event) => setPlanForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="+237..." />
                </div>
                <div>
                  <label className="field-label">Pays</label>
                  <input value={planForm.country} onChange={(event) => setPlanForm((current) => ({ ...current, country: event.target.value }))} placeholder="CM" />
                </div>
              </div>

              <div style={{ marginTop:'12px' }}>
                <label className="field-label">Prochaine action</label>
                <input value={planForm.nextAction} onChange={(event) => setPlanForm((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Ex: Finaliser le CV italien" />
              </div>

              <div style={{ marginTop:'12px' }}>
                <label className="field-label">Notes internes</label>
                <textarea value={planForm.internalNotes} onChange={(event) => setPlanForm((current) => ({ ...current, internalNotes: event.target.value }))} rows={5} placeholder="Blocages, consignes, plateformes deja teste es..." />
              </div>

              <label style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontSize:'13px', marginTop:'12px', cursor:'pointer' }}>
                <input type="checkbox" checked={planForm.isUrgent} onChange={(event) => setPlanForm((current) => ({ ...current, isUrgent: event.target.checked }))} />
                Dossier urgent / avant click day
              </label>
            </SectionCard>

            <SectionCard title={`Checklists operationnelles (${candidate.checklistCompleted}/${candidate.checklistTotal})`}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'12px' }}>
                {CHECKLIST_SECTIONS.map((section) => {
                  const completed = section.items.filter((item) => candidate.checklist[section.key][item.key]).length
                  return (
                    <div key={section.key} style={{ border:'1px solid #F0F2F5', borderRadius:'12px', padding:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', marginBottom:'10px' }}>
                        <div>
                          <div style={{ fontSize:'14px', fontWeight:'800' }}>{section.label}</div>
                          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>{completed}/{section.items.length} coche(s)</div>
                        </div>
                        <ScoreBar value={Math.round((completed / section.items.length) * 100)} color={completed === section.items.length ? '#15803D' : '#1B3A6B'} />
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {section.items.map((item) => {
                          const checked = candidate.checklist[section.key][item.key]
                          const busy = savingChecklist === `${section.key}.${item.key}`
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleChecklistItem(section.key, item.key)}
                              disabled={Boolean(savingChecklist)}
                              style={{
                                display:'flex',
                                alignItems:'center',
                                gap:'10px',
                                padding:'9px 10px',
                                border:'1px solid #E5E7EB',
                                borderRadius:'10px',
                                background: checked ? '#F0FDF4' : 'white',
                                color: checked ? '#166534' : '#111827',
                                cursor:'pointer',
                                textAlign:'left',
                              }}
                            >
                              <span style={{ width:'18px', height:'18px', borderRadius:'6px', display:'inline-flex', alignItems:'center', justifyContent:'center', background: checked ? '#22C55E' : '#E5E7EB', color:'white', flexShrink:0 }}>
                                {busy ? <Loader2 size={12} style={{ animation:'spin 0.7s linear infinite' }} /> : checked ? <CheckCircle2 size={12} /> : null}
                              </span>
                              <span style={{ fontSize:'13px', fontWeight:'600' }}>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <SectionCard title="Resume operationnel">
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', fontSize:'13px' }}>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'3px' }}>Prochaine action</div>
                  <div style={{ fontWeight:'700' }}>{candidate.nextAction}</div>
                </div>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'3px' }}>Date due</div>
                  <div style={{ fontWeight:'700' }}>{candidate.nextActionAt ? fmt_date(candidate.nextActionAt) : 'A fixer'}</div>
                </div>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'3px' }}>Dernier contact</div>
                  <div style={{ fontWeight:'700' }}>{candidate.lastContactAt ? relative_time(candidate.lastContactAt) : 'Aucun'}</div>
                </div>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'3px' }}>Docs / traductions / relances</div>
                  <div style={{ fontWeight:'700' }}>
                    {candidate.documentsValidatedCount}/{candidate.documentsReceivedCount} valides · {candidate.translationsDoneCount} traduits · {candidate.followUpsDueToday} relances
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Archive locale recommandee">
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', fontSize:'13px' }}>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'4px' }}>Chemin candidat</div>
                  <code style={{ display:'block', background:'#F9FAFB', padding:'10px 12px', borderRadius:'10px', color:'#111827' }}>{getRecommendedLocalArchivePath(candidate)}</code>
                </div>
                <div>
                  <div style={{ color:'#9CA3AF', marginBottom:'4px' }}>Sous-dossiers</div>
                  <code style={{ display:'block', background:'#F9FAFB', padding:'10px 12px', borderRadius:'10px', color:'#111827', whiteSpace:'pre-line' }}>
                    01_recu{'\n'}02_traduction{'\n'}03_valide{'\n'}04_cv-lettres{'\n'}05_candidatures{'\n'}99_archive
                  </code>
                </div>
                {candidate.documents[0] && (
                  <div>
                    <div style={{ color:'#9CA3AF', marginBottom:'4px' }}>Exemple de nommage export</div>
                    <code style={{ display:'block', background:'#F9FAFB', padding:'10px 12px', borderRadius:'10px', color:'#111827' }}>
                      {buildDocumentDownloadName(candidate, candidate.documents[0])}
                    </code>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Journal du dossier">
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {candidate.activities.length === 0 ? (
                  <div style={{ fontSize:'13px', color:'#6B7280' }}>Aucune activite tracee pour le moment.</div>
                ) : (
                  candidate.activities.slice(0, 12).map((activity) => (
                    <div key={activity.id} style={{ borderBottom:'1px solid #F3F4F6', paddingBottom:'10px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'10px' }}>
                        <div style={{ fontSize:'13px', fontWeight:'700' }}>{activity.title || 'Activite'}</div>
                        <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{relative_time(activity.created_at ?? activity.createdAt)}</div>
                      </div>
                      <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>
                        {activity.description || 'Mise a jour du dossier'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <SectionCard title={`Documents (${candidate.documents.length})`}>
            {candidate.documents.length === 0 ? (
              <div style={{ fontSize:'13px', color:'#6B7280' }}>Aucun document recu pour ce candidat.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {candidate.documents.map((document) => {
                  const draft = documentDrafts[document.id]
                  const isSelected = selectedDocument?.id === document.id
                  return (
                    <div key={document.id} style={{ border:`1.5px solid ${isSelected ? '#1B3A6B' : '#EEF2F7'}`, borderRadius:'14px', padding:'14px', background:isSelected ? '#FAFBFF' : 'white' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', flexWrap:'wrap', marginBottom:'10px' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                          <div style={{ fontSize:'14px', fontWeight:'800' }}>{document.nom || 'Document'}</div>
                          <DocumentStatusPill status={draft.workflow_status} />
                        </div>
                        <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>
                          {document.taille ? fmt_size(document.taille) : 'Texte'} · Recu le {fmt_date(document.created_at || document.received_at)}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <button onClick={() => setSelectedDocumentId(document.id)} className="btn btn-secondary btn-sm">
                          <Eye size={14} /> Apercu
                        </button>
                          <button onClick={() => loadDocumentIntoAi(document)} className="btn btn-secondary btn-sm">
                          <Brain size={14} /> Adapter avec IA
                        </button>
                        {document.file_url && (
                          <a href={document.file_url} download={buildDocumentDownloadName(candidate, document)} className="btn btn-secondary btn-sm">
                            <Download size={14} /> Export nomme
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px' }}>
                      <div>
                        <label className="field-label">Type</label>
                        <select value={draft.doc_type} onChange={(event) => setDocumentDrafts((current) => ({ ...current, [document.id]: { ...current[document.id], doc_type: event.target.value } }))}>
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Statut documentaire</label>
                        <select value={draft.workflow_status} onChange={(event) => setDocumentDrafts((current) => ({ ...current, [document.id]: { ...current[document.id], workflow_status: event.target.value as DocumentWorkflowStatus } }))}>
                          {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Langue source</label>
                        <input value={draft.source_language} onChange={(event) => setDocumentDrafts((current) => ({ ...current, [document.id]: { ...current[document.id], source_language: event.target.value } }))} placeholder="fr / en / it" />
                      </div>
                      <div>
                        <label className="field-label">Langue traduite</label>
                        <input value={draft.translated_language} onChange={(event) => setDocumentDrafts((current) => ({ ...current, [document.id]: { ...current[document.id], translated_language: event.target.value } }))} placeholder="it" />
                      </div>
                    </div>

                    <label style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginTop:'12px', fontSize:'13px' }}>
                      <input type="checkbox" checked={draft.final_version} onChange={(event) => setDocumentDrafts((current) => ({ ...current, [document.id]: { ...current[document.id], final_version: event.target.checked } }))} />
                      Version finale prete a classer / exporter
                    </label>

                    <div style={{ marginTop:'12px', display:'flex', justifyContent:'space-between', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
                      <div style={{ fontSize:'12px', color:'#6B7280' }}>
                        {document.content_text ? 'Document texte saisi dans l application.' : document.file_path || 'Fichier externe'}
                      </div>
                      <button onClick={() => saveDocument(document.id)} disabled={savingDocumentId === document.id} className="btn btn-primary btn-sm">
                        {savingDocumentId === document.id ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> Sauvegarde...</> : <><Save size={14} /> Sauvegarder</>}
                      </button>
                    </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={selectedDocument ? `Apercu · ${selectedDocument.nom || 'Document'}` : 'Apercu du document'}
            action={selectedDocument ? (
              <button onClick={() => loadDocumentIntoAi(selectedDocument)} className="btn btn-primary btn-sm">
                <Brain size={14} /> Utiliser pour le CV IA
              </button>
            ) : undefined}
          >
            {!selectedDocument ? (
              <div style={{ fontSize:'13px', color:'#6B7280' }}>Selectionnez un document puis cliquez sur Apercu.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'12px', color:'#6B7280', lineHeight:'1.6' }}>
                  {selectedDocument.doc_type || selectedDocument.type_doc || 'Document'} · {selectedDocument.source_language || 'langue source non precisee'}
                  {selectedDocument.translated_language ? ` · traduction ${selectedDocument.translated_language}` : ''}
                </div>

                {selectedDocument.content_text ? (
                  <pre style={{ margin:0, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'14px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'12px', lineHeight:'1.7', maxHeight:'520px', overflowY:'auto' }}>
                    {selectedDocument.content_text}
                  </pre>
                ) : looksLikeImage(selectedDocument) && selectedDocument.file_url ? (
                  <img src={selectedDocument.file_url} alt={selectedDocument.nom || 'Document'} style={{ width:'100%', borderRadius:'12px', border:'1px solid #E5E7EB', objectFit:'contain', maxHeight:'520px' }} />
                ) : looksLikePdf(selectedDocument) && selectedDocument.file_url ? (
                  <iframe src={selectedDocument.file_url} title={selectedDocument.nom || 'Document PDF'} style={{ width:'100%', height:'520px', border:'1px solid #E5E7EB', borderRadius:'12px', background:'white' }} />
                ) : selectedDocument.file_url ? (
                  <div style={{ background:'#F9FAFB', border:'1px dashed #CBD5E1', borderRadius:'12px', padding:'16px', fontSize:'13px', color:'#475569' }}>
                    Apercu integre non disponible pour ce format. Ouvrez le fichier dans un nouvel onglet puis revenez lancer l IA.
                  </div>
                ) : (
                  <div style={{ background:'#F9FAFB', border:'1px dashed #CBD5E1', borderRadius:'12px', padding:'16px', fontSize:'13px', color:'#475569' }}>
                    Ce document n a pas de fichier joint, seulement des metadonnees.
                  </div>
                )}

                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {selectedDocument.file_url && (
                    <a href={selectedDocument.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      <Eye size={14} /> Ouvrir le fichier
                    </a>
                  )}
                  <button onClick={() => setAiSourceText(buildAiSource(candidate, selectedDocument))} className="btn btn-secondary btn-sm">
                    <Brain size={14} /> Charger la base IA
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === 'candidatures' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <SectionCard title="Nouvelle candidature">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px' }}>
              <div>
                <label className="field-label">Plateforme</label>
                <input value={newApplication.platform} onChange={(event) => setNewApplication((current) => ({ ...current, platform: event.target.value }))} placeholder="Indeed, Jooble, site employeur..." />
              </div>
              <div>
                <label className="field-label">Employeur</label>
                <input value={newApplication.employer} onChange={(event) => setNewApplication((current) => ({ ...current, employer: event.target.value }))} placeholder="Nom de l entreprise" />
              </div>
              <div>
                <label className="field-label">Poste</label>
                <input value={newApplication.jobTitle} onChange={(event) => setNewApplication((current) => ({ ...current, jobTitle: event.target.value }))} placeholder="Ouvrier agricole" />
              </div>
              <div>
                <label className="field-label">Statut</label>
                <select value={newApplication.status} onChange={(event) => setNewApplication((current) => ({ ...current, status: event.target.value as ApplicationStatus }))}>
                  {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Date d envoi</label>
                <input type="date" value={newApplication.submittedAt} onChange={(event) => setNewApplication((current) => ({ ...current, submittedAt: event.target.value }))} />
              </div>
              <div>
                <label className="field-label">Relance prevue</label>
                <input type="date" value={newApplication.followUpAt} onChange={(event) => setNewApplication((current) => ({ ...current, followUpAt: event.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop:'10px' }}>
              <label className="field-label">Notes</label>
              <textarea value={newApplication.notes} onChange={(event) => setNewApplication((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Lien annonce, precision sur l envoi, contact RH..." />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'12px' }}>
              <button onClick={addApplication} disabled={creatingApplication} className="btn btn-primary btn-sm">
                {creatingApplication ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> Creation...</> : <><PlusCircle size={14} /> Ajouter la candidature</>}
              </button>
            </div>
          </SectionCard>

          <SectionCard title={`Suivi des candidatures (${candidate.applications.length})`}>
            {candidate.applications.length === 0 ? (
              <div style={{ fontSize:'13px', color:'#6B7280' }}>Aucune candidature enregistree pour ce candidat.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {candidate.applications.map((application) => {
                  const draft = applicationDrafts[application.id]
                  return (
                    <div key={application.id} style={{ border:'1px solid #EEF2F7', borderRadius:'14px', padding:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', flexWrap:'wrap', marginBottom:'10px' }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                            <div style={{ fontSize:'14px', fontWeight:'800' }}>{draft.jobTitle || 'Poste a preciser'}</div>
                            <ApplicationStatusPill status={draft.status} />
                          </div>
                          <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>
                            {draft.employer || 'Employeur non precise'} · {draft.platform || 'Plateforme non precise'}
                          </div>
                        </div>
                        <div style={{ fontSize:'12px', color:'#6B7280' }}>
                          Envoi: {draft.submittedAt ? fmt_date(parseDateInput(draft.submittedAt)) : 'non date'}
                        </div>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px' }}>
                        <div>
                          <label className="field-label">Plateforme</label>
                          <input value={draft.platform} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], platform: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Employeur</label>
                          <input value={draft.employer} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], employer: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Poste</label>
                          <input value={draft.jobTitle} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], jobTitle: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Statut</label>
                          <select value={draft.status} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], status: event.target.value as ApplicationStatus } }))}>
                            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="field-label">Date d envoi</label>
                          <input type="date" value={draft.submittedAt} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], submittedAt: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Relance prevue</label>
                          <input type="date" value={draft.followUpAt} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], followUpAt: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Dernier contact</label>
                          <input type="date" value={draft.lastContactAt} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], lastContactAt: event.target.value } }))} />
                        </div>
                        <div>
                          <label className="field-label">Resultat</label>
                          <input value={draft.result} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], result: event.target.value } }))} placeholder="Reponse RH, refuse, entretien..." />
                        </div>
                      </div>
                      <div style={{ marginTop:'10px' }}>
                        <label className="field-label">Notes internes</label>
                        <textarea value={draft.notes} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application.id]: { ...current[application.id], notes: event.target.value } }))} rows={3} placeholder="Message envoye, lien, suivi..." />
                      </div>
                      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'12px' }}>
                        <button onClick={() => saveApplication(application.id)} disabled={savingApplicationId === application.id} className="btn btn-primary btn-sm">
                          {savingApplicationId === application.id ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> Sauvegarde...</> : <><Save size={14} /> Sauvegarder</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === 'messages' && (
        <SectionCard title="Conversation candidat">
          <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:'14px', height:'380px', overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {messages.length === 0 ? (
              <div style={{ margin:'auto', textAlign:'center', color:'#6B7280', fontSize:'13px' }}>
                Aucune conversation visible avec ce candidat.
              </div>
            ) : (
              messages.map((message: any) => {
                const isAdmin = message.expediteur === 'admin' || message.expediteur === 'ia'
                return (
                  <div key={message.id} style={{ display:'flex', flexDirection:isAdmin ? 'row-reverse' : 'row', gap:'8px', alignItems:'flex-end' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:isAdmin ? '#1B3A6B' : '#E5E7EB', color:isAdmin ? 'white' : '#374151', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>
                      {isAdmin ? 'IP' : 'C'}
                    </div>
                    <div style={{ maxWidth:'72%' }}>
                      <div style={{ padding:'10px 12px', borderRadius:isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background:isAdmin ? '#1B3A6B' : '#F3F4F6', color:isAdmin ? 'white' : '#111827', fontSize:'13px', lineHeight:'1.5' }}>
                        {message.contenu}
                      </div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'4px', textAlign:isAdmin ? 'right' : 'left' }}>
                        {message.nom_expediteur} · {relative_time(message.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end', marginTop:'12px' }}>
            <textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} rows={3} placeholder="Message au candidat..." style={{ flex:1 }} />
            <button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} className="btn btn-primary">
              {sendingMessage ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> Envoi...</> : <><Send size={14} /> Envoyer</>}
            </button>
          </div>
        </SectionCard>
      )}

      {tab === 'ia' && (
        <SectionCard title="Assistants IA">
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#1D4ED8', marginBottom:'6px' }}>
              Workflow conseille pour les documents recus
            </div>
            <div style={{ fontSize:'12px', color:'#1E3A8A', lineHeight:'1.7' }}>
              1. Ouvrez le document dans l onglet Documents. 2. Cliquez sur "Adapter avec IA". 3. Relisez ou completez la base ci-dessous. 4. Lancez le CV FR, le CV IT puis la lettre. 5. Exportez les PDF finaux pour classer et postuler.
            </div>
          </div>

          <div style={{ marginBottom:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap' }}>
              <label className="field-label" style={{ marginBottom:0 }}>Base de travail transmise a l IA</label>
              {selectedDocument && (
                <button onClick={() => setAiSourceText(buildAiSource(candidate, selectedDocument))} className="btn btn-secondary btn-sm">
                  <Brain size={14} /> Recharger depuis l apercu
                </button>
              )}
            </div>
            <textarea
              value={aiSourceText}
              onChange={(event) => setAiSourceText(event.target.value)}
              rows={10}
              placeholder="Collez ici les elements lus dans le CV ou laissez la base chargee depuis le dossier."
            />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'12px' }}>
            {AGENTS.map((agent) => {
              const running = agentLoading === agent.id
              const result = agentResults[agent.id]
              const cvLanguage = agent.id === 'generate_cv_fr' ? 'fr' : agent.id === 'generate_cv_it' ? 'it' : null
              const cvPreviewData = candidate && cvLanguage && result?.output
                ? buildCvPreviewData(candidate, result.output, cvLanguage)
                : null
              const letterPreviewData = candidate && agent.id === 'generate_cover_letter' && result?.output
                ? buildLetterPreviewData(candidate, result.output, 'it')
                : null
              const structuredExcludeKeys = cvLanguage
                ? ['cvText', 'cvSections']
                : agent.id === 'generate_cover_letter'
                  ? ['letterText', 'subject', 'salutation', 'closing']
                  : []
              return (
                <div key={agent.id} style={{ border:'1px solid #EEF2F7', borderRadius:'14px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:'800' }}>{agent.label}</div>
                      <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>{agent.desc}</div>
                    </div>
                    <button onClick={() => runAgent(agent.id)} disabled={Boolean(agentLoading)} className="btn btn-secondary btn-sm">
                      {running ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> En cours</> : <><Brain size={14} /> Lancer</>}
                    </button>
                  </div>
                  {result?.output && (
                    <div style={{ marginTop:'12px', background:'#F9FAFB', borderRadius:'10px', padding:'12px' }}>
                      {cvPreviewData && (
                        <div style={{ marginTop:'12px' }}>
                          <CvProfessionalPreview data={cvPreviewData} />
                        </div>
                      )}
                      {letterPreviewData && (
                        <div style={{ marginTop:'12px' }}>
                          <LetterProfessionalPreview data={letterPreviewData} />
                        </div>
                      )}
                      {result.output.cvText && cvLanguage && (
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
                          <button onClick={() => openCvPreviewWindow(cvLanguage, false)} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> Apercu pro
                          </button>
                          <button onClick={() => openCvPreviewWindow(cvLanguage, true)} className="btn btn-primary btn-sm">
                            <Download size={14} /> Exporter PDF
                          </button>
                          <button onClick={() => downloadCv(cvLanguage)} className="btn btn-secondary btn-sm">
                            <Download size={14} /> Texte brut
                          </button>
                        </div>
                      )}
                      {result.output.letterText && (
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
                          <button onClick={() => openLetterPreviewWindow(false)} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> Apercu pro
                          </button>
                          <button onClick={() => openLetterPreviewWindow(true)} className="btn btn-primary btn-sm">
                            <Download size={14} /> Exporter PDF
                          </button>
                          <button onClick={downloadLetter} className="btn btn-secondary btn-sm">
                            <Download size={14} /> Texte brut
                          </button>
                        </div>
                      )}
                      <AiStructuredOutput output={result.output} excludeKeys={structuredExcludeKeys} />
                      {result.output.cvText && (
                        <details style={{ marginTop:'12px' }}>
                          <summary style={{ cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#475569' }}>Voir la version texte brute</summary>
                          <pre style={{ margin:'10px 0 0', background:'white', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'12px', lineHeight:'1.7', maxHeight:'260px', overflowY:'auto' }}>
                            {result.output.cvText}
                          </pre>
                        </details>
                      )}
                      {result.output.letterText && (
                        <details style={{ marginTop:'12px' }}>
                          <summary style={{ cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#475569' }}>Voir la lettre en texte brut</summary>
                          <pre style={{ margin:'10px 0 0', background:'white', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'12px', lineHeight:'1.7', maxHeight:'260px', overflowY:'auto' }}>
                            {result.output.letterText}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
