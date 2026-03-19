import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

// ── Helper : écrire les cookies de session ────────────────
function setSessionCookies(token: string, role: string) {
  const maxAge = 60 * 60 // 1 heure
  document.cookie = `firebase-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `firebase-role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// ── LOGIN ─────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const cred  = await signInWithEmailAndPassword(auth, email, password)
  const token = await cred.user.getIdToken()

  // Récupérer le rôle depuis Firestore
  let role = 'candidate'
  try {
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (snap.exists()) {
      role = snap.data()?.role ?? 'candidate'
    }
  } catch {
    // Si Firestore échoue, rôle par défaut
    role = 'candidate'
  }

  // Écrire les cookies
  setSessionCookies(token, role)

  // Attendre que les cookies soient bien écrits
  await new Promise(resolve => setTimeout(resolve, 200))

  return { user: cred.user, role }
}

// ── REGISTER ──────────────────────────────────────────────
export async function registerUser(data: {
  email: string
  password: string
  full_name: string
  phone?: string
  country?: string
  role?: string
}) {
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
  const role = data.role ?? 'candidate'

  // Créer le document utilisateur dans Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:          cred.user.uid,
    email:        data.email,
    full_name:    data.full_name,
    phone:        data.phone ?? '',
    country_code: data.country ?? 'CM',
    role,
    is_active:    true,
    created_at:   serverTimestamp(),
    updated_at:   serverTimestamp(),
  })

  // Créer le profil candidat si rôle = candidate
  if (role === 'candidate') {
    await setDoc(doc(db, 'candidate_profiles', cred.user.uid), {
      user_id:            cred.user.uid,
      dossier_status:     'draft',
      completeness_score: 0,
      quality_score:      0,
      readiness_score:    0,
      is_urgent:          false,
      tags:               [],
      created_at:         serverTimestamp(),
      updated_at:         serverTimestamp(),
    })
  }

  const token = await cred.user.getIdToken()
  setSessionCookies(token, role)
  await new Promise(resolve => setTimeout(resolve, 200))

  return { user: cred.user, role }
}

// ── LOGOUT ────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth)
  document.cookie = 'firebase-token=; path=/; max-age=0'
  document.cookie = 'firebase-role=; path=/; max-age=0'
  window.location.href = '/login'
}

// ── RESET PASSWORD ────────────────────────────────────────
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}