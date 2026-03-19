'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { FolderOpen, MessageCircle, CreditCard, Calendar, Upload, ArrowRight, AlertTriangle, CheckCircle, User, PenLine } from 'lucide-react'
import { days_until } from '@/lib/utils'

const FLUSSI_DAYS = days_until('2027-01-12')

export default function Dashboard() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }
    try {
      const [uSnap, dSnap, docsSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'dossiers', uid)),
        getDocs(query(collection(db, 'documents'), where('uid', '==', uid))),
      ])
      const u    = uSnap.exists()   ? uSnap.data()   : {}
      const d    = dSnap.exists()   ? dSnap.data()   : {}
      const docs = docsSnap.docs.map(x => x.data())
      setData({ u, d, docs })
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
      <div className="spinner" /> Chargement...
    </div>
  )

  const u    = data?.u    ?? {}
  const d    = data?.d    ?? {}
  const docs = data?.docs ?? []

  const approved = docs.filter((x:any) => x.statut === 'approuve').length
  const score    = d.score_completion ?? 0
  const statut   = d.statut ?? 'nouveau'
  const nom      = u.full_name ?? ''

  const STATUT_COLOR: Record<string,string> = {
    nouveau:'#6B7280', incomplet:'#C2410C', en_cours:'#7C3AED',
    en_verification:'#1D4ED8', attente_paiement:'#C2410C',
    pret:'#15803D', termine:'#065F46',
  }
  const STATUT_LABEL: Record<string,string> = {
    nouveau:'Nouveau dossier', incomplet:'Incomplet', en_cours:'En cours',
    en_verification:'En vérification', attente_paiement:'Attente paiement',
    pret:'Prêt', termine:'Terminé',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {/* Hero card */}
      <div style={{ background:'linear-gradient(135deg,#1B3A6B,#2952A3)', borderRadius:'16px', padding:'22px', color:'white' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)', margin:'0 0 4px' }}>Bonjour 👋</p>
            <h1 style={{ fontSize:'20px', fontWeight:'800', margin:'0 0 10px' }}>{nom || 'Bienvenue'}</h1>
            <span style={{
              display:'inline-block', background:'rgba(255,255,255,0.15)', color:'white',
              fontSize:'12px', fontWeight:'600', padding:'3px 12px', borderRadius:'99px',
            }}>{STATUT_LABEL[statut] ?? statut}</span>
          </div>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 20px', minWidth:'90px' }}>
            <div style={{ fontSize:'26px', fontWeight:'900', color:'#F0BC2E' }}>{score}%</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', marginTop:'2px' }}>Complétude</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:'14px' }}>
          <div style={{ height:'6px', background:'rgba(255,255,255,0.15)', borderRadius:'99px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${score}%`, background:'#F0BC2E', borderRadius:'99px', transition:'width 1s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'5px', fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>
            <span>{docs.length} document{docs.length>1?'s':''}</span>
            <span>{approved} approuvé{approved>1?'s':''}</span>
          </div>
        </div>
      </div>

      {/* Alert si nouveau */}
      {(!nom || docs.length === 0) && (
        <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:'12px', padding:'14px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
          <AlertTriangle size={16} color="#1D4ED8" style={{ flexShrink:0, marginTop:'1px' }} />
          <div style={{ fontSize:'13.5px', color:'#1E40AF' }}>
            {!nom ? (
              <>Complétez votre profil pour que votre équipe puisse commencer. <Link href="/profil" style={{ fontWeight:'700', color:'#1D4ED8' }}>Compléter →</Link></>
            ) : (
              <>Uploadez vos premiers documents pour démarrer votre dossier. <Link href="/documents/nouveau" style={{ fontWeight:'700', color:'#1D4ED8' }}>Ajouter →</Link></>
            )}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
        <Link href="/documents" style={{ textDecoration:'none' }}>
          <div className="card card-hover" style={{ padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'36px', height:'36px', background:'#EBF0FF', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FolderOpen size={18} color="#1B3A6B" />
              </div>
              <div>
                <div style={{ fontSize:'20px', fontWeight:'900', color:'#1B3A6B', lineHeight:1 }}>{docs.length}</div>
                <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Documents</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/flussi" style={{ textDecoration:'none' }}>
          <div className="card card-hover" style={{ padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'36px', height:'36px', background:'#FFFBEB', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Calendar size={18} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize:'20px', fontWeight:'900', color:'#D97706', lineHeight:1 }}>{FLUSSI_DAYS}</div>
                <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Jours Flussi</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Documents récents */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', margin:0 }}>Mes documents</h2>
          <Link href="/documents" style={{ fontSize:'12px', color:'#1B3A6B', fontWeight:'600', textDecoration:'none' }}>Voir tout →</Link>
        </div>
        {docs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 16px', border:'2px dashed #E4E8EF', borderRadius:'12px' }}>
            <p style={{ color:'#9CA3AF', fontSize:'13px', margin:'0 0 12px' }}>Aucun document encore</p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/documents" className="btn btn-primary btn-sm"><Upload size={13} /> Uploader</Link>
              <Link href="/documents/nouveau" className="btn btn-secondary btn-sm"><PenLine size={13} /> Écrire / Coller</Link>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
            {docs.slice(0,4).map((doc:any, i:number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'#F9FAFB', borderRadius:'9px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0,
                  background: doc.statut==='approuve'?'#22C55E':doc.statut==='rejete'?'#EF4444':'#F97316' }} />
                <span style={{ flex:1, fontSize:'13.5px', fontWeight:'500', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {doc.nom || doc.name || 'Document'}
                </span>
                <span style={{ fontSize:'11px', fontWeight:'600', flexShrink:0,
                  color: doc.statut==='approuve'?'#15803D':doc.statut==='rejete'?'#BE123C':'#C2410C' }}>
                  {doc.statut==='approuve'?'Approuvé':doc.statut==='rejete'?'Rejeté':'En attente'}
                </span>
              </div>
            ))}
            {docs.length > 0 && (
              <Link href="/documents/nouveau" className="btn btn-secondary btn-sm" style={{ marginTop:'6px', alignSelf:'flex-start' }}>
                <PenLine size={13} /> Ajouter un document
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
        {[
          { href:'/messages',  icon:MessageCircle, label:'Messages',  color:'#2563EB', bg:'#EFF6FF' },
          { href:'/paiements', icon:CreditCard,    label:'Paiements', color:'#059669', bg:'#F0FDF4' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
            <div className="card card-hover" style={{ padding:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'34px', height:'34px', background:a.bg, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <a.icon size={17} color={a.color} />
              </div>
              <span style={{ fontWeight:'600', fontSize:'13.5px', color:'#111827' }}>{a.label}</span>
              <ArrowRight size={15} color="#9CA3AF" style={{ marginLeft:'auto' }} />
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
