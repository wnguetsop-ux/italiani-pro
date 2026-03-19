'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { db, auth, storage } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { addDoc, serverTimestamp } from 'firebase/firestore'
import { Upload, FileText, Download, Eye, RefreshCw, PenLine, X } from 'lucide-react'
import { fmt_date, fmt_size } from '@/lib/utils'
import { toast } from 'sonner'

interface Doc { id:string; nom:string; statut:string; file_url?:string; taille?:number; created_at:any; content_text?:string; type_doc?:string }

export default function DocumentsPage() {
  const [docs, setDocs]         = useState<Doc[]>([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError]       = useState<string|null>(null)

  const uid = auth.currentUser?.uid

  const loadDocs = useCallback(async () => {
    if (!uid) { setLoading(false); return }
    try {
      const snap = await getDocs(query(collection(db, 'documents'), where('uid','==',uid)))
      const list = snap.docs.map(d => ({ id:d.id, ...d.data() } as Doc))
      list.sort((a,b) => (b.created_at?.seconds??0)-(a.created_at?.seconds??0))
      setDocs(list)
    } catch (e) {
      console.error('Docs load error:', e)
      setError('Erreur chargement documents')
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { loadDocs() }, [loadDocs])

  const onDrop = useCallback(async (files: File[]) => {
    if (!uid || !files[0] || uploading) return
    const file = files[0]

    // Validations
    if (file.size > 15 * 1024 * 1024) { toast.error('Fichier trop lourd (max 15 Mo)'); return }
    const allowed = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp']
    if (!allowed.includes(file.type)) { toast.error('Format non supporté (PDF, JPG, PNG)'); return }

    setUploading(true)
    setProgress(0)
    setError(null)
    toast.info('Upload en cours...')

    try {
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `documents/${uid}/${filename}`
      const storageRef = ref(storage, filePath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            setProgress(pct)
          },
          (err) => {
            console.error('Upload error:', err)
            reject(err)
          },
          () => resolve()
        )
      })

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

      await addDoc(collection(db, 'documents'), {
        uid,
        nom:          file.name.replace(/\.[^.]+$/, ''),
        original_name: file.name,
        file_url:     downloadURL,
        file_path:    filePath,
        taille:       file.size,
        mime_type:    file.type,
        statut:       'uploade',
        created_at:   serverTimestamp(),
        updated_at:   serverTimestamp(),
      })

      toast.success('✅ Document uploadé avec succès !')
      await loadDocs()

    } catch (err: any) {
      console.error('Upload failed:', err)
      const msg = err?.code === 'storage/unauthorized'
        ? 'Erreur de permission. Vérifiez les règles Firebase Storage.'
        : err?.code === 'storage/retry-limit-exceeded'
        ? 'Connexion trop lente. Réessayez.'
        : 'Erreur upload. Réessayez.'
      toast.error(msg)
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [uid, uploading, loadDocs])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf':['.pdf'], 'image/*':['.jpg','.jpeg','.png','.webp'] },
    maxSize: 15*1024*1024,
    multiple: false,
    disabled: uploading,
  })

  const approved = docs.filter(d => d.statut==='approuve').length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 3px' }}>Mes documents</h1>
          <p style={{ color:'#6B7280', fontSize:'13px', margin:0 }}>
            {docs.length === 0 ? 'Aucun document' : `${approved}/${docs.length} approuvé${approved>1?'s':''}`}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link href="/documents/nouveau" className="btn btn-secondary btn-sm">
            <PenLine size={14} /> Écrire / Coller
          </Link>
          <button onClick={loadDocs} className="btn btn-secondary btn-icon btn-sm">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar si docs */}
      {docs.length > 0 && (
        <div className="card" style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'6px' }}>
            <span style={{ color:'#6B7280' }}>Documents validés</span>
            <span style={{ fontWeight:'700', color:'#1B3A6B' }}>{Math.round(approved/docs.length*100)}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width:`${Math.round(approved/docs.length*100)}%` }} /></div>
        </div>
      )}

      {/* Zone upload */}
      <div {...getRootProps()} style={{
        border:`2px dashed ${isDragActive?'#1B3A6B':'#CBD5E1'}`,
        borderRadius:'14px', padding:'28px 20px', textAlign:'center',
        cursor: uploading?'not-allowed':'pointer',
        background: isDragActive?'#EBF0FF':'white',
        transition:'all 0.15s', opacity: uploading?0.7:1,
      }}>
        <input {...getInputProps()} />
        <div style={{ width:'48px', height:'48px', background:'#EBF0FF', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <Upload size={22} color="#1B3A6B" />
        </div>
        <p style={{ fontWeight:'600', fontSize:'14px', color:'#374151', margin:'0 0 4px' }}>
          {isDragActive ? 'Déposez ici' : uploading ? `Upload... ${progress}%` : 'Glissez un fichier ou cliquez ici'}
        </p>
        <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>PDF, JPG, PNG — Max 15 Mo</p>
      </div>

      {/* Barre progress upload */}
      {uploading && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span className="spinner" style={{ width:'16px', height:'16px', borderWidth:'2px' }} />
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#1D4ED8' }}>Upload en cours : {progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width:`${progress}%`, background:'#2563EB' }} />
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:'10px', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'13px', color:'#BE123C' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#BE123C' }}><X size={16} /></button>
        </div>
      )}

      {/* Documents rejetés */}
      {docs.filter(d=>d.statut==='rejete').map(d => (
        <div key={d.id} style={{ background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:'10px', padding:'12px 14px', fontSize:'13px', color:'#9F1239' }}>
          ❌ <strong>"{d.nom}"</strong> — Rejeté. Uploadez une nouvelle version corrigée ci-dessus.
        </div>
      ))}

      {/* Liste */}
      {docs.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ width:'52px', height:'52px', background:'#F3F4F6', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <FileText size={24} color="#9CA3AF" />
          </div>
          <h3 style={{ fontWeight:'700', fontSize:'15px', margin:'0 0 8px' }}>Aucun document encore</h3>
          <p style={{ color:'#6B7280', fontSize:'13px', margin:'0 0 16px', lineHeight:'1.6' }}>
            Uploadez un fichier ci-dessus ou utilisez "Écrire / Coller" si vous n'avez pas de scanner.
          </p>
          <Link href="/documents/nouveau" className="btn btn-primary btn-sm">
            <PenLine size={14} /> Écrire / Coller mon contenu
          </Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {docs.map(d => (
            <div key={d.id} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{
                width:'38px', height:'38px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: d.content_text?'#F5F3FF':d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':'#EFF6FF',
              }}>
                {d.content_text
                  ? <PenLine size={17} color="#7C3AED" />
                  : <FileText size={17} color={d.statut==='approuve'?'#22C55E':d.statut==='rejete'?'#EF4444':'#3B82F6'} />
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:'600', fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom || 'Document'}</div>
                <div style={{ display:'flex', gap:'8px', marginTop:'3px', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'99px',
                    background: d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':'#EFF6FF',
                    color: d.statut==='approuve'?'#15803D':d.statut==='rejete'?'#BE123C':'#1D4ED8' }}>
                    {d.statut==='approuve'?'✅ Approuvé':d.statut==='rejete'?'❌ Rejeté':d.statut==='en_verification'?'👁 En révision':'⏳ En attente'}
                  </span>
                  {d.taille && <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{fmt_size(d.taille)}</span>}
                  {d.content_text && <span style={{ fontSize:'11px', color:'#7C3AED', fontStyle:'italic' }}>Texte écrit</span>}
                </div>
              </div>
              {d.file_url && (
                <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary btn-icon btn-sm" title="Voir"><Eye size={14} /></a>
                  <a href={d.file_url} download={d.nom}
                    className="btn btn-secondary btn-icon btn-sm" title="Télécharger"><Download size={14} /></a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Note aide */}
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 14px', fontSize:'12.5px', color:'#1E40AF' }}>
        💡 <strong>Pas de scanner ?</strong> Utilisez{' '}
        <Link href="/documents/nouveau" style={{ color:'#1D4ED8', fontWeight:'700' }}>Écrire / Coller</Link>
        {' '}pour décrire votre CV ou vos expériences directement.
      </div>
    </div>
  )
}
