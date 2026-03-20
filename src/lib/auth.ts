import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { buildDefaultChecklist } from '@/lib/backoffice'

const ADMIN_ROLES = ['admin', 'super_admin', 'agent']

function setCookies(token: string, role: string) {
  const age = 60 * 60 * 24 * 7 // 7 jours
  document.cookie = `ip_token=${token}; path=/; max-age=${age}; SameSite=Lax`
  document.cookie = `ip_role=${role}; path=/; max-age=${age}; SameSite=Lax`
}

export async function login(email: string, password: string) {
  const cred  = await signInWithEmailAndPassword(auth, email, password)
  const token = await cred.user.getIdToken()
  const snap  = await getDoc(doc(db, 'users', cred.user.uid))
  const role  = snap.exists() ? (snap.data().role ?? 'candidat') : 'candidat'
  setCookies(token, role)
  await new Promise(r => setTimeout(r, 200))
  return { uid: cred.user.uid, role }
}

export async function register(data: {
  email: string; password: string; full_name: string; phone?: string; country?: string
}) {
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
  const uid  = cred.user.uid
  await setDoc(doc(db, 'users', uid), {
    uid, email: data.email, full_name: data.full_name,
    phone: data.phone ?? '', country_code: data.country ?? 'CM',
    role: 'candidat', is_active: true,
    created_at: serverTimestamp(), updated_at: serverTimestamp(),
  })
  await setDoc(doc(db, 'dossiers', uid), {
    uid,
    workflow_status: 'NEW',
    statut: 'nouveau',
    score_completion: 0,
    dossier_completeness_percent: 0,
    readiness_score: 0,
    priority_score: 0,
    is_urgent: false,
    click_day_urgent: false,
    secteur_cible: '',
    region_italie: '',
    profession: '',
    target_job: '',
    pack: '',
    next_action: 'Verifier le profil et les premiers documents',
    next_action_at: null,
    internal_notes: '',
    payment_status: '',
    checklists: buildDefaultChecklist(),
    annees_experience: 0,
    niveau_etudes: '',
    langues: [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  await addDoc(collection(db, 'activity_logs'), {
    candidateId: uid,
    uid,
    type: 'candidate_registered',
    title: 'Nouveau dossier cree',
    description: 'Le candidat a cree son espace et son dossier.',
    actorName: data.full_name,
    actorRole: 'candidat',
    created_at: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
  const token = await cred.user.getIdToken()
  setCookies(token, 'candidat')
  await new Promise(r => setTimeout(r, 200))
  return { uid, role: 'candidat' }
}

export async function logout() {
  await signOut(auth)
  document.cookie = 'ip_token=; path=/; max-age=0'
  document.cookie = 'ip_role=; path=/; max-age=0'
  window.location.href = '/login'
}

export async function resetPwd(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export function isAdmin(role: string) {
  return ADMIN_ROLES.includes(role)
}
