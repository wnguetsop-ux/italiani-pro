'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Download, Eye, FileText, PenLine, RefreshCw, Upload, X } from 'lucide-react'
import { auth, db, storage } from '@/lib/firebase'
import { recordCandidateActivity } from '@/lib/backoffice-data'
import { fmt_date, fmt_size } from '@/lib/utils'
import { toast } from 'sonner'

interface Doc {
  id: string
  nom: string
  statut: string
  file_url?: string
  taille?: number
  created_at: any
  content_text?: string
  type_doc?: string
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('UPLOAD_TIMEOUT'))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function withSoftTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T | null>((resolve) => {
    const timer = window.setTimeout(() => {
      resolve(null)
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      () => {
        window.clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

export default function DocumentsPage() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [authReady, setAuthReady] = useState(Boolean(auth.currentUser))
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  const loadDocs = useCallback(async () => {
    if (!authReady) return
    if (!uid) {
      setDocs([])
      setLoading(false)
      return
    }

    try {
      const snap = await getDocs(query(collection(db, 'documents'), where('uid', '==', uid)))
      const list = snap.docs.map((item) => ({ id: item.id, ...item.data() } as Doc))
      list.sort((left, right) => (right.created_at?.seconds ?? 0) - (left.created_at?.seconds ?? 0))
      setDocs(list)
    } catch (err) {
      console.error('docs-load-error', err)
      setError('Erreur chargement documents')
    } finally {
      setLoading(false)
    }
  }, [authReady, uid])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const runPostUploadSync = useCallback((candidateId: string, description: string) => {
    void (async () => {
      const actorName = auth.currentUser?.displayName || 'Candidat'
      const results = await Promise.allSettled([
        updateDoc(doc(db, 'dossiers', candidateId), {
          workflow_status: 'TO_REVIEW',
          statut: 'en_verification',
          next_action: 'Verifier les nouveaux documents recus',
          next_action_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        }),
        recordCandidateActivity({
          candidateId,
          type: 'document_received',
          title: 'Document recu',
          description,
          actorName,
          actorRole: 'candidat',
        }),
      ])

      for (const result of results) {
        if (result.status === 'rejected') {
          console.warn('post-upload-sync-warning', result.reason)
        }
      }
    })()
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0] || uploading) return
    if (!authReady) {
      toast.error('Session en cours de chargement. Reessayez dans quelques secondes.')
      return
    }
    if (!uid) {
      toast.error('Session introuvable. Reconnectez-vous puis reessayez.')
      return
    }

    const file = files[0]
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 15 Mo)')
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Aucune connexion internet detectee.')
      return
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Format non supporte (PDF, JPG, PNG)')
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)
    toast.info('Upload en cours...')

    try {
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `documents/${uid}/${filename}`
      const storageRef = ref(storage, filePath)
      setProgress(15)

      const uploadSnapshot = await withTimeout(
        uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' }),
        45000,
      )

      setProgress(75)
      const downloadURLPromise = getDownloadURL(uploadSnapshot.ref)
      const downloadURL = await withSoftTimeout(downloadURLPromise, 8000)
      setProgress(90)

      const docRef = await addDoc(collection(db, 'documents'), {
        uid,
        nom: file.name.replace(/\.[^.]+$/, ''),
        original_name: file.name,
        file_url: downloadURL,
        file_path: filePath,
        taille: file.size,
        mime_type: file.type,
        workflow_status: 'RECEIVED',
        doc_type: 'other',
        source_language: '',
        translated_language: '',
        final_version: false,
        statut: 'uploade',
        received_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      setDocs((current) => {
        const optimisticDoc: Doc = {
          id: docRef.id,
          nom: file.name.replace(/\.[^.]+$/, ''),
          statut: 'uploade',
          file_url: downloadURL ?? undefined,
          taille: file.size,
          created_at: { seconds: Math.floor(Date.now() / 1000) },
          type_doc: 'other',
        }
        return [optimisticDoc, ...current.filter((item) => item.id !== docRef.id)]
      })

      setProgress(100)
      toast.success(downloadURL ? 'Document uploade avec succes' : 'Document uploade. Finalisation en cours...')

      if (!downloadURL) {
        void downloadURLPromise.then(async (resolvedUrl) => {
          try {
            await updateDoc(doc(db, 'documents', docRef.id), {
              file_url: resolvedUrl,
              updated_at: serverTimestamp(),
            })
            await loadDocs()
          } catch (syncError) {
            console.warn('document-url-sync-warning', syncError)
          }
        }).catch((urlError) => {
          console.warn('download-url-warning', urlError)
        })
      } else {
        void loadDocs()
      }

      runPostUploadSync(uid, file.name)
    } catch (err: any) {
      console.error('upload-failed', err)
      const msg = err?.message === 'UPLOAD_TIMEOUT'
        ? 'Upload trop long. Verifiez la connexion ou les regles Firebase Storage.'
        : err?.code === 'storage/unauthorized'
        ? 'Erreur de permission. Verifiez les regles Firebase Storage.'
        : err?.code === 'storage/retry-limit-exceeded'
        ? 'Connexion trop lente. Reessayez.'
        : err?.code === 'storage/canceled'
        ? 'Upload annule.'
        : 'Erreur upload. Reessayez.'
      toast.error(msg)
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [authReady, uid, uploading, loadDocs, runPostUploadSync])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 15 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  })

  const approved = docs.filter((docItem) => docItem.statut === 'approuve').length

  if (loading || !authReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px', color: '#6B7280' }}>
        <span className="spinner" /> Chargement...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 3px' }}>Mes documents</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
            {docs.length === 0 ? 'Aucun document' : `${approved}/${docs.length} approuve${approved > 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/documents/nouveau" className="btn btn-secondary btn-sm">
            <PenLine size={14} /> Ecrire / Coller
          </Link>
          <button onClick={loadDocs} className="btn btn-secondary btn-icon btn-sm">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {docs.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: '#6B7280' }}>Documents valides</span>
            <span style={{ fontWeight: '700', color: '#1B3A6B' }}>{Math.round((approved / docs.length) * 100)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.round((approved / docs.length) * 100)}%` }} />
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#1B3A6B' : '#CBD5E1'}`,
          borderRadius: '14px',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive ? '#EBF0FF' : 'white',
          transition: 'all 0.15s',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ width: '48px', height: '48px', background: '#EBF0FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Upload size={22} color="#1B3A6B" />
        </div>
        <p style={{ fontWeight: '600', fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
          {isDragActive ? 'Deposez ici' : uploading ? `Upload... ${progress}%` : 'Glissez un fichier ou cliquez ici'}
        </p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>PDF, JPG, PNG - Max 15 Mo</p>
      </div>

      {uploading && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1D4ED8' }}>Upload en cours : {progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: '#2563EB' }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#BE123C' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BE123C' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {docs.filter((docItem) => docItem.statut === 'rejete').map((docItem) => (
        <div key={docItem.id} style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#9F1239' }}>
          <strong>{docItem.nom}</strong> - Rejete. Uploadez une nouvelle version corrigee ci-dessus.
        </div>
      ))}

      {docs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: '52px', height: '52px', background: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileText size={24} color="#9CA3AF" />
          </div>
          <h3 style={{ fontWeight: '700', fontSize: '15px', margin: '0 0 8px' }}>Aucun document encore</h3>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.6' }}>
            Uploadez un fichier ci-dessus ou utilisez "Ecrire / Coller" si vous n avez pas de scanner.
          </p>
          <Link href="/documents/nouveau" className="btn btn-primary btn-sm">
            <PenLine size={14} /> Ecrire / Coller mon contenu
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {docs.map((docItem) => (
            <div key={docItem.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '9px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: docItem.content_text ? '#F5F3FF' : docItem.statut === 'approuve' ? '#F0FDF4' : docItem.statut === 'rejete' ? '#FFF1F2' : '#EFF6FF',
                }}
              >
                {docItem.content_text ? (
                  <PenLine size={17} color="#7C3AED" />
                ) : (
                  <FileText size={17} color={docItem.statut === 'approuve' ? '#22C55E' : docItem.statut === 'rejete' ? '#EF4444' : '#3B82F6'} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docItem.nom || 'Document'}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      background: docItem.statut === 'approuve' ? '#F0FDF4' : docItem.statut === 'rejete' ? '#FFF1F2' : '#EFF6FF',
                      color: docItem.statut === 'approuve' ? '#15803D' : docItem.statut === 'rejete' ? '#BE123C' : '#1D4ED8',
                    }}
                  >
                    {docItem.statut === 'approuve' ? 'Approuve' : docItem.statut === 'rejete' ? 'Rejete' : docItem.statut === 'en_verification' ? 'En revision' : 'En attente'}
                  </span>
                  {docItem.taille ? <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{fmt_size(docItem.taille)}</span> : null}
                  {docItem.content_text ? <span style={{ fontSize: '11px', color: '#7C3AED', fontStyle: 'italic' }}>Texte ecrit</span> : null}
                </div>
              </div>
              {docItem.file_url ? (
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <a href={docItem.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon btn-sm" title="Voir">
                    <Eye size={14} />
                  </a>
                  <a href={docItem.file_url} download={docItem.nom} className="btn btn-secondary btn-icon btn-sm" title="Telecharger">
                    <Download size={14} />
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 14px', fontSize: '12.5px', color: '#1E40AF' }}>
        <strong>Pas de scanner ?</strong> Utilisez <Link href="/documents/nouveau" style={{ color: '#1D4ED8', fontWeight: '700' }}>Ecrire / Coller</Link> pour decrire votre CV ou vos experiences directement.
      </div>
    </div>
  )
}
