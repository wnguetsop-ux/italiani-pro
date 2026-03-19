'use client'
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { db, auth, storage } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { Plus, Download, Eye, FileText, Upload, RefreshCw, PenLine, ExternalLink } from 'lucide-react'
import { fmt_date, fmt_size } from '@/lib/utils'
import { toast } from 'sonner'

interface Doc { id:string; nom:string; statut:string; file_url?:string; taille?:number; created_at:any; type_doc?:string; content_text?:string }

const STATUT_COLOR: Record<string,string> = { approuve:'#22C55E', rejete:'#EF4444', en_verification:'#3B82F6', uploade:'#F97316' }
const STATUT_LABEL: Record<string,string> = { approuve:'Approuvé', rejete:'Rejeté', en_verification:'En révision', uploade:'En attente' }

export default function DocumentsPage() {
  const [docs, setDocs]           = useState<Doc[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [filter, setFilter]       = useState('tous')
  const uid = auth.currentUser?.uid

  const load = async () => {
    if (!uid) return
    try {
      const snap = await getDocs(
        query(collection(db, 'documents'), where('uid', '==', uid))
      )
      setDocs(snap.docs.map(d => ({ id:d.id, ...d.data() } as Doc)))
    } catch (e) {
      const snap = await getDocs(query(collection(db, 'documents'), where('uid', '==', uid)))
      setDocs(snap.docs.map(d => ({ id:d.id, ...d.data() } as Doc)))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [uid])

  const onDrop = useCallback(async (files: File[]) => {
    if (!uid || !files[0]) return
    const file = files[0]
    if (file.size > 15*1024*1024) { toast.error('Fichier trop lourd (max 15 Mo)'); return }
    if (!['application/pdf','image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      toast.error('Format non supporté. PDF, JPG, PNG uniquement.'); return
    }
    setUploading(true); setProgress(0)
    try {
      const path  = `documents/${uid}/${Date.now()}_${file.name}`
      const sRef  = ref(storage, path)
      const task  = uploadBytesResumable(sRef, file)
      await new Promise<void>((res, rej) => task.on('state_changed', s => setProgress(Math.round(s.bytesTransferred/s.totalBytes*100)), rej, res))
      const url   = await getDownloadURL(task.snapshot.ref)
      const { addDoc, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(db, 'documents'), {
        uid, nom: file.name.replace(/\.[^.]+$/,''), original_name: file.name,
        file_url: url, file_path: path, taille: file.size, mime_type: file.type,
        statut: 'uploade', created_at: serverTimestamp(), updated_at: serverTimestamp(),
      })
      toast.success('✅ Document uploadé !')
      await load()
    } catch { toast.error('Erreur upload') } finally { setUploading(false); setProgress(0) }
  }, [uid])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxSize: 15*1024*1024, multiple: false,
  })

  const filtered = filter === 'tous' ? docs : docs.filter(d => d.statut === filter)
  const approved = docs.filter(d => d.statut === 'approuve').length

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Mes documents</h1>
          <p>{docs.length === 0 ? 'Aucun document' : `${approved}/${docs.length} approuvé${approved>1?'s':''}`}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link href="/documents/nouveau" className="btn btn-secondary btn-sm">
            <PenLine size={14} /> Écrire / Coller
          </Link>
          <button onClick={load} className="btn btn-secondary btn-icon" title="Actualiser">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Progress global */}
      {docs.length > 0 && (
        <div className="card" style={{ padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px' }}>
            <span style={{ color:'#6B7280' }}>Complétude du dossier</span>
            <span style={{ fontWeight:'700', color:'#1B3A6B' }}>{Math.round(approved/docs.length*100)}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width:`${Math.round(approved/docs.length*100)}%` }} /></div>
        </div>
      )}

      {/* Drop zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? '#1B3A6B' : '#CBD5E1'}`,
        borderRadius:'14px', padding:'28px 20px', textAlign:'center', cursor:'pointer',
        background: isDragActive ? '#EBF0FF' : 'white', transition:'all 0.15s',
      }}>
        <input {...getInputProps()} />
        <div style={{ width:'48px', height:'48px', background:'#EBF0FF', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <Upload size={22} color="#1B3A6B" />
        </div>
        <p style={{ fontWeight:'600', fontSize:'14px', color:'#374151' }}>
          {isDragActive ? 'Déposez ici' : 'Glissez un document ou cliquez pour choisir'}
        </p>
        <p style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'4px' }}>PDF, JPG, PNG — Max 15 Mo</p>
      </div>

      {uploading && (
        <div className="card" style={{ padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', color:'#1B3A6B', fontSize:'13px', fontWeight:'600' }}>
            <span className="spinner" /> Upload en cours... {progress}%
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width:`${progress}%` }} /></div>
        </div>
      )}

      {/* Rejet alerts */}
      {docs.filter(d => d.statut === 'rejete').map(d => (
        <div key={d.id} className="alert alert-error">
          <div>
            <strong>"{d.nom}" — Document rejeté</strong><br />
            Uploadez une nouvelle version corrigée en glissant un fichier ci-dessus.
          </div>
        </div>
      ))}

      {/* Filters */}
      {docs.length > 0 && (
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {['tous','uploade','en_verification','approuve','rejete'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn btn-sm" style={{
              background: filter===f?'#1B3A6B':'white', color: filter===f?'white':'#374151',
              border: '1.5px solid ' + (filter===f?'#1B3A6B':'#E4E8EF'),
            }}>
              {f==='tous'?'Tous':f==='uploade'?'En attente':f==='en_verification'?'En révision':f==='approuve'?'Approuvés':'Rejetés'}
              {' '}({f==='tous'?docs.length:docs.filter(d=>d.statut===f).length})
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><FileText size={24} color="#9CA3AF" /></div>
            <h3>{docs.length === 0 ? 'Aucun document encore' : 'Aucun document dans cette catégorie'}</h3>
            <p>Uploadez un fichier ou utilisez "Écrire / Coller" pour décrire vos documents sans fichier.</p>
            <div style={{ display:'flex', gap:'8px', marginTop:'4px', flexWrap:'wrap', justifyContent:'center' }}>
              <Link href="/documents/nouveau" className="btn btn-secondary btn-sm"><PenLine size={14} /> Écrire / Coller</Link>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':d.content_text?'#F5F3FF':'#EFF6FF' }}>
                {d.content_text ? <PenLine size={17} color="#7C3AED" /> : <FileText size={17} color={STATUT_COLOR[d.statut]||'#3B82F6'} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:'600', fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom}</div>
                <div style={{ display:'flex', gap:'8px', marginTop:'3px', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'12px',
                    background: d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':'#EFF6FF',
                    color: STATUT_COLOR[d.statut]||'#3B82F6' }}>
                    {STATUT_LABEL[d.statut]||'En attente'}
                  </span>
                  {d.taille && <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{fmt_size(d.taille)}</span>}
                  <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{fmt_date(d.created_at)}</span>
                  {d.content_text && <span style={{ fontSize:'11px', color:'#7C3AED', fontStyle:'italic' }}>Texte</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                {d.file_url && (
                  <>
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon btn-sm" title="Voir">
                      <Eye size={14} />
                    </a>
                    <a href={d.file_url} download={d.nom} className="btn btn-secondary btn-icon btn-sm" title="Télécharger">
                      <Download size={14} />
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="alert alert-info" style={{ fontSize:'12px' }}>
        <div>💡 <strong>Pas de scanner ?</strong> Utilisez <Link href="/documents/nouveau" style={{ color:'#1D4ED8', fontWeight:'600' }}>Écrire / Coller</Link> pour décrire vos expériences ou coller votre CV directement — notre équipe s'occupe du reste.</div>
      </div>
    </div>
  )
}
