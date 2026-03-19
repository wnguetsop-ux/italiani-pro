'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { FolderOpen, MessageCircle, CreditCard, Calendar, Upload, ArrowRight, AlertTriangle, Clock, CheckCircle, User } from 'lucide-react'
import { fmt_date, STATUT_LABEL, STATUT_BADGE, days_until } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser]   = useState<any>(null)
  const [dossier, setDossier] = useState<any>(null)
  const [docs, setDocs]   = useState<any[]>([])
  const [msgs, setMsgs]   = useState<any[]>([])
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'dossiers', uid)),
      getDocs(query(collection(db, 'documents'), where('uid', '==', uid))),
      getDocs(query(collection(db, 'orders'), where('uid', '==', uid), orderBy('created_at','desc'), limit(1))),
    ]).then(([uSnap, dSnap, docsSnap, ordSnap]) => {
      if (uSnap.exists()) setUser(uSnap.data())
      if (dSnap.exists()) setDossier(dSnap.data())
      setDocs(docsSnap.docs.map(d => ({ id:d.id, ...d.data() })))
      if (!ordSnap.empty) setOrder({ id:ordSnap.docs[0].id, ...ordSnap.docs[0].data() })
    }).finally(() => setLoading(false))
  }, [uid])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement...
    </div>
  )

  const statut = dossier?.statut ?? 'nouveau'
  const score  = dossier?.score_completion ?? 0
  const approuves = docs.filter(d => d.statut === 'approuve').length
  const flussiDays = days_until('2027-01-12')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">

      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg, #1B3A6B 0%, #2952A3 100%)', borderRadius:'16px', padding:'24px', color:'white' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', marginBottom:'4px' }}>Bonjour 👋</p>
            <h1 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'8px' }}>
              {user?.full_name || 'Bienvenue'}
            </h1>
            <span className={`badge ${STATUT_BADGE[statut] || 'badge-draft'}`} style={{ background:'rgba(255,255,255,0.15)', color:'white' }}>
              {STATUT_LABEL[statut] || 'Nouveau dossier'}
            </span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', padding:'14px 20px', textAlign:'center', minWidth:'100px' }}>
            <div style={{ fontSize:'28px', fontWeight:'900', color:'#F0BC2E' }}>{score}%</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'2px' }}>Complétude</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'rgba(255,255,255,0.7)', marginBottom:'6px' }}>
            <span>Progression du dossier</span>
            <span>{approuves} doc{approuves > 1 ? 's' : ''} validé{approuves > 1 ? 's' : ''}</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'99px', height:'7px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#F0BC2E', borderRadius:'99px', width:`${score}%`, transition:'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Alert si dossier incomplet */}
      {statut === 'nouveau' && docs.length === 0 && (
        <div className="alert alert-info">
          <AlertTriangle size={16} style={{ flexShrink:0, marginTop:'1px' }} />
          <div>
            <strong>Complétez votre profil pour commencer</strong><br />
            Renseignez vos informations personnelles et uploadez vos premiers documents.{' '}
            <Link href="/profil" style={{ color:'#1D4ED8', fontWeight:'600' }}>Compléter mon profil →</Link>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'12px' }}>
        {[
          { icon:FolderOpen, label:'Documents', value: docs.length === 0 ? 'Aucun' : `${docs.length} fichier${docs.length>1?'s':''}`, href:'/documents', color:'#1B3A6B' },
          { icon:MessageCircle, label:'Messages', value: msgs.length === 0 ? 'Aucun' : `${msgs.length} message${msgs.length>1?'s':''}`, href:'/messages', color:'#2563EB' },
          { icon:CreditCard, label:'Paiements', value: order ? '1 pack actif' : 'Aucun pack', href:'/paiements', color:'#059669' },
          { icon:Calendar, label:'Flussi 2027', value: `${flussiDays} jours`, href:'/flussi', color:'#D97706' },
        ].map((s, i) => (
          <Link key={i} href={s.href} className="card card-hover" style={{ textDecoration:'none', padding:'16px' }}>
            <div style={{ width:'36px', height:'36px', background:`${s.color}18`, borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize:'12px', color:'#6B7280', marginBottom:'3px' }}>{s.label}</div>
            <div style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>{s.value}</div>
          </Link>
        ))}
      </div>

      {/* Documents récents */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div>
            <h2 className="section-title">Mes documents</h2>
            <p className="section-sub">{docs.length === 0 ? 'Aucun document encore' : `${approuves}/${docs.length} approuvé${approuves>1?'s':''}`}</p>
          </div>
          <Link href="/documents" style={{ fontSize:'13px', color:'#1B3A6B', fontWeight:'600', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px' }}>
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {docs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><FolderOpen size={24} color="#9CA3AF" /></div>
            <h3>Aucun document</h3>
            <p>Uploadez vos documents ou décrivez votre contenu pour que votre équipe puisse commencer.</p>
            <Link href="/documents/nouveau" className="btn btn-primary btn-sm" style={{ marginTop:'4px' }}>
              <Upload size={14} /> Ajouter un document
            </Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {docs.slice(0, 4).map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'#F9FAFB', borderRadius:'9px', border:'1px solid #F0F2F5' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background: d.statut==='approuve'?'#22C55E':d.statut==='rejete'?'#EF4444':'#F97316' }} />
                <span style={{ flex:1, fontSize:'13.5px', fontWeight:'500', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom || d.name || 'Document'}</span>
                <span className={`badge badge-${d.statut === 'approuve' ? 'approved' : d.statut === 'rejete' ? 'rejected' : 'uploaded'}`} style={{ flexShrink:0, fontSize:'10px' }}>
                  {d.statut === 'approuve' ? 'Approuvé' : d.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                </span>
              </div>
            ))}
            {docs.length > 4 && (
              <Link href="/documents" style={{ textAlign:'center', fontSize:'13px', color:'#1B3A6B', padding:'8px', textDecoration:'none' }}>
                Voir {docs.length - 4} autre{docs.length-4>1?'s':''} →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Prochaine étape */}
      <div className="card" style={{ border:'1.5px solid #1B3A6B22', background:'#F8F9FF' }}>
        <h2 className="section-title" style={{ marginBottom:'12px' }}>Prochaine étape recommandée</h2>
        {docs.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', background:'#1B3A6B', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Upload size={17} color="white" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'600', fontSize:'14px' }}>Ajoutez vos premiers documents</div>
              <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Passeport, CV, diplômes — uploadez ou décrivez votre contenu</div>
            </div>
            <Link href="/documents/nouveau" className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>
              Commencer
            </Link>
          </div>
        ) : !user?.profession ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', background:'#D97706', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={17} color="white" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'600', fontSize:'14px' }}>Complétez votre profil professionnel</div>
              <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Secteur ciblé, profession, expériences — essentiel pour votre CV</div>
            </div>
            <Link href="/profil" className="btn btn-primary btn-sm" style={{ flexShrink:0, background:'#D97706' }}>
              Compléter
            </Link>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', background:'#059669', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CheckCircle size={17} color="white" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'600', fontSize:'14px' }}>Votre dossier est en cours de traitement</div>
              <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Votre équipe va analyser et optimiser vos documents</div>
            </div>
            <Link href="/messages" className="btn btn-secondary btn-sm" style={{ flexShrink:0 }}>
              Contacter
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
