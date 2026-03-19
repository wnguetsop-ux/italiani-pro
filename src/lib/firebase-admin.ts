// ============================================================
// ITALIANIPRO — Firebase Admin SDK (server-side only)
// Used in API routes, webhooks, and server actions
// ============================================================
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore }  from 'firebase-admin/firestore'
import { getAuth }       from 'firebase-admin/auth'
import { getStorage }    from 'firebase-admin/storage'

let adminApp: App

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  adminApp = initializeApp({
    credential: cert({
      projectId:   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey:  privateKey!,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })

  return adminApp
}

export const adminDb      = () => getFirestore(getAdminApp())
export const adminAuth    = () => getAuth(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())

// ── Helper: verify Firebase ID token from request ────────
export async function verifyToken(request: Request): Promise<{ uid: string; role: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.headers.get('cookie')?.match(/firebase-token=([^;]+)/)?.[1]

    if (!token) return null

    const decoded = await adminAuth().verifyIdToken(token)
    const userDoc  = await adminDb().collection('users').doc(decoded.uid).get()
    const role     = userDoc.data()?.role ?? 'candidate'

    return { uid: decoded.uid, role }
  } catch {
    return null
  }
}
