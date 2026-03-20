import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth }      from 'firebase-admin/auth'
import { getStorage }   from 'firebase-admin/storage'

let adminApp: App

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length) { adminApp = getApps()[0]; return adminApp }

  // ✅ Fix clé privée Vercel : remplace les \n littéraux par de vrais sauts de ligne
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? ''
  const privateKey = rawKey.includes('\\n')
    ? rawKey.replace(/\\n/g, '\n')
    : rawKey

  adminApp = initializeApp({
    credential: cert({
      projectId:   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
  return adminApp
}

export const adminDb      = () => getFirestore(getAdminApp())
export const adminAuth    = () => getAuth(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())

export async function verifyToken(req: Request): Promise<{ uid: string; role: string } | null> {
  try {
    const cookie = req.headers.get('cookie') ?? ''
    const token  = cookie.match(/ip_token=([^;]+)/)?.[1]
      || req.headers.get('authorization')?.replace('Bearer ','')
    if (!token) return null
    const decoded = await adminAuth().verifyIdToken(token)
    const snap    = await adminDb().collection('users').doc(decoded.uid).get()
    const role    = snap.data()?.role ?? 'candidat'
    return { uid: decoded.uid, role }
  } catch { return null }
}