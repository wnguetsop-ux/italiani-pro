// ============================================================
// ITALIANIPRO — Firebase Storage helpers
// ============================================================
import {
  ref, uploadBytesResumable, getDownloadURL,
  deleteObject, listAll, UploadTaskSnapshot,
} from 'firebase/storage'
import { storage } from './firebase'

// ── UPLOAD DOCUMENT ──────────────────────────────────────────
export async function uploadDocument(
  file: File,
  candidateId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; path: string }> {
  // Validate
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) throw new Error('Fichier trop volumineux (max 10 Mo)')

  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!ALLOWED.includes(file.type)) throw new Error('Format non accepté (PDF, JPG, PNG uniquement)')

  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path     = `documents/${candidateId}/${filename}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        candidate_id:  candidateId,
        original_name: file.name,
        uploaded_at:   new Date().toISOString(),
      },
    })

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(percent)
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({ url, path })
      }
    )
  })
}

// ── UPLOAD PROFILE AVATAR ────────────────────────────────────
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `avatars/${userId}/avatar.${ext}`
  const storageRef = ref(storage, path)

  await uploadBytesResumable(storageRef, file, { contentType: file.type })
  return getDownloadURL(storageRef)
}

// ── DELETE FILE ──────────────────────────────────────────────
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

// ── GET DOWNLOAD URL ─────────────────────────────────────────
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path)
  return getDownloadURL(storageRef)
}
