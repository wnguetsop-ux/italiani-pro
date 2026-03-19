'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, query, where, limit, getDoc, doc } from 'firebase/firestore'
import { Users, AlertTriangle, CheckCircle, CreditCard, Brain, Eye, RefreshCw, Flame, TrendingUp, Calendar } from 'lucide-react'
import { STATUT_LABEL, days_until, initiales } from '@/lib/utils'

export default function AdminDashboard() {
  const [candidats, setCandidats] = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const uid = auth.currentUser?.uid
      if (uid) {
        const s = await getDoc(doc(db, 'users', uid))
        if (s.exists()) setAdminName(s.data().full_name ?? '')
      }
      const dosSnap = await getDocs(collection(db, 'dossiers'))
      const list: any[] = []
      for (const d of dosSnap.docs) {
        const p = d.data()
        const u = await getDoc(doc(db, 'users', d.id))
        const ud = u.exists() ? u.data() : {}
        list.push({ id: d.id, ...p, full_name: ud.full_name ?? '—', email: ud.email ?? '', phone: ud.phone ?? '' })
      }
      list.sort((a, b) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0))
      setCandidats(list)
      const tSnap = await getDocs(query(collection(db, 'admin_tasks'), where('fait', '==', false), limit(8)))
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const s = {
    total:     candidats.length,
    urgents:   candidats.filter(c => c.is_urgent).length,
    incomplets:candidats.filter(c => c.statut === 'incomplet').length,
    en_cours:  candidats.filter(c => c.statut === 'en_cours').length,
    att_pmt:   candidats.filter(c => c.statut === 'attente_paiement').length,
    termines:  candidats.filter(c => c.statut === 'termine').length,
  }

  const SCOLOR: Record<string, string> = {
    nouveau:'#9CA3AF', incomplet:'#EF4444', en_cours:'#8B5CF6',
    en_verification:'#3B82F6', attente_paiement:'#F97316',
    attente_client:'#F59E0B', pret:'#22C55E', termine:'#059669',
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'48px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800' }}>Bonjour {adminName || 'Admin'} 👋</h1>
          <p style={{ color:'#6B7280', fontSize:'13px', marginTop:'3px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <button onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} style={refreshing ? { animation:'spin 0.7s linear infinite' } : {}} /> Actualiser
        </button>
      </div>

      {/* Flussi */}
      <div style={{ background:'linear-gradient(135deg,#1B3A6B,#2952A3)', borderRadius:'14px', padding:'18px 20px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <Calendar size={22} color="#D4A017" />
          <div>
            <div style={{ fontWeight:'700', fontSize:'15px' }}>Click Day Flussi — 12 Janvier 2027</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>Préparez les dossiers maintenant.</div>
          </div>
        </div>
        <div style={{ background:'rgba(212,160,23,0.2)', border:'1px solid rgba(212,160,23,0.3)', borderRadius:'10px', padding:'10px 18px', textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color:'#D4A017' }}>{days_until('2027-01-12')}</div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>jours restants</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'12px' }}>
        {[
          { l:'Total candidats',  v:s.total,      c:'#1B3A6B', I:Users         },
          { l:'Urgents',          v:s.urgents,    c:'#EF4444', I:Flame          },
          { l:'Incomplets',       v:s.incomplets, c:'#F97316', I:AlertTriangle  },
          { l:'En cours',         v:s.en_cours,   c:'#8B5CF6', I:TrendingUp     },
          { l:'Attente paiement', v:s.att_pmt,    c:'#D97706', I:CreditCard     },
          { l:'Terminés',         v:s.termines,   c:'#059669', I:CheckCircle    },
        ].map((st, i) => (
          <Link key={i} href="/admin/candidats" style={{ textDecoration:'none' }}>
            <div className="card card-hover" style={{ padding:'14px', textAlign:'center' }}>
              <div style={{ width:'36px', height:'36px', background:`${st.c}18`, borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
                <st.I size={18} color={st.c} />
              </div>
              <div style={{ fontSize:'24px', fontWeight:'900', color:st.c }}>{st.v}</div>
              <div style={{ fontSize:'11px', color:'#6B7280', marginTop:'2px', lineHeight:'1.3' }}>{st.l}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'16px' }}>

        {/* Candidats */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F0F2F5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h2 className="section-title">Candidats ({s.total})</h2>
            <Link href="/admin/candidats" style={{ fontSize:'13px', color:'#1B3A6B', fontWeight:'600', textDecoration:'none' }}>Voir tous →</Link>
          </div>
          {candidats.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><Users size={22} color="#9CA3AF" /></div>
              <h3>Aucun candidat</h3>
              <p>Partagez le lien <strong>/register</strong> à vos clients.</p>
            </div>
          ) : (
            <div>
              {candidats.slice(0, 8).map(c => (
                <Link key={c.id} href={`/admin/candidats/${c.id}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'12px', padding:'11px 18px', borderBottom:'1px solid #F9FAFB', transition:'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#1B3A6B', fontWeight:'700', fontSize:'12px', flexShrink:0 }}>
                    {initiales(c.full_name)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      {c.is_urgent && <Flame size={11} color="#EF4444" />}
                      <span style={{ fontWeight:'600', fontSize:'13.5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.full_name}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                    <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'12px',
                      background: c.statut === 'termine' ? '#F0FDF4' : c.statut === 'incomplet' ? '#FFF1F2' : c.statut === 'en_cours' ? '#F5F3FF' : '#F3F4F6',
                      color: SCOLOR[c.statut] ?? '#6B7280' }}>
                      {STATUT_LABEL[c.statut] ?? 'Nouveau'}
                    </span>
                    <span style={{ fontSize:'12px', fontWeight:'700', color:'#1B3A6B' }}>{c.score_completion ?? 0}%</span>
                    <Eye size={14} color="#9CA3AF" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Alertes */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F0F2F5' }}>
              <h3 className="section-title" style={{ fontSize:'14px' }}>Alertes</h3>
            </div>
            {s.urgents === 0 && s.incomplets === 0 && s.att_pmt === 0 ? (
              <div style={{ padding:'18px', textAlign:'center' }}>
                <CheckCircle size={20} color="#22C55E" style={{ margin:'0 auto 6px' }} />
                <div style={{ fontSize:'13px', color:'#6B7280' }}>Tout est à jour ✅</div>
              </div>
            ) : (
              <div>
                {s.urgents > 0 && (
                  <Link href="/admin/candidats?filtre=urgent" style={{ display:'flex', gap:'8px', padding:'10px 16px', borderBottom:'1px solid #F9FAFB', background:'#FFF1F2', textDecoration:'none' }}>
                    <Flame size={14} color="#EF4444" style={{ flexShrink:0, marginTop:'1px' }} />
                    <span style={{ fontSize:'12.5px', color:'#9F1239' }}><strong>{s.urgents}</strong> dossier(s) urgent(s)</span>
                  </Link>
                )}
                {s.incomplets > 0 && (
                  <Link href="/admin/candidats?filtre=incomplet" style={{ display:'flex', gap:'8px', padding:'10px 16px', borderBottom:'1px solid #F9FAFB', background:'#FFF7ED', textDecoration:'none' }}>
                    <AlertTriangle size={14} color="#F97316" style={{ flexShrink:0, marginTop:'1px' }} />
                    <span style={{ fontSize:'12.5px', color:'#92400E' }}><strong>{s.incomplets}</strong> incomplet(s)</span>
                  </Link>
                )}
                {s.att_pmt > 0 && (
                  <Link href="/admin/paiements" style={{ display:'flex', gap:'8px', padding:'10px 16px', background:'#FFFBEB', textDecoration:'none' }}>
                    <CreditCard size={14} color="#D97706" style={{ flexShrink:0, marginTop:'1px' }} />
                    <span style={{ fontSize:'12.5px', color:'#92400E' }}><strong>{s.att_pmt}</strong> paiement(s) en attente</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Tâches */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F0F2F5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 className="section-title" style={{ fontSize:'14px' }}>Tâches</h3>
              {tasks.length > 0 && <span style={{ background:'#EF4444', color:'white', fontSize:'10px', fontWeight:'700', width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>{tasks.length}</span>}
            </div>
            {tasks.length === 0 ? (
              <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#9CA3AF' }}>Aucune tâche 🎉</div>
            ) : (
              tasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ padding:'10px 16px', borderBottom:'1px solid #F9FAFB', display:'flex', gap:'8px', alignItems:'flex-start' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', flexShrink:0, marginTop:'5px', background: t.priorite === 1 ? '#EF4444' : t.priorite === 2 ? '#F97316' : '#9CA3AF' }} />
                  <span style={{ fontSize:'12.5px', color:'#374151', lineHeight:'1.4' }}>{t.titre}</span>
                </div>
              ))
            )}
          </div>

          {/* Agents IA */}
          <Link href="/admin/ia" style={{ textDecoration:'none' }}>
            <div className="card card-hover" style={{ background:'#1B3A6B', border:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                <Brain size={18} color="#D4A017" />
                <span style={{ fontWeight:'700', fontSize:'14px', color:'white' }}>Agents IA</span>
              </div>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', lineHeight:'1.5', marginBottom:'8px' }}>
                Générer CV, analyser profil, lettre de motivation, rappel paiement...
              </p>
              <div style={{ fontSize:'12px', color:'#D4A017', fontWeight:'600' }}>Accéder aux agents →</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
