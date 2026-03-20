'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { Users, Flame, AlertTriangle, CreditCard, Eye, RefreshCw } from 'lucide-react'
import { fmt_date, days_until, STATUT_LABEL, initiales } from '@/lib/utils'
import { toast } from 'sonner'

const STATUT_BADGE: Record<string,{bg:string,color:string}> = {
  nouveau:           { bg:'#F3F4F6', color:'#6B7280'  },
  incomplet:         { bg:'#FFF7ED', color:'#C2410C'  },
  en_cours:          { bg:'#F5F3FF', color:'#7C3AED'  },
  en_verification:   { bg:'#EFF6FF', color:'#1D4ED8'  },
  attente_paiement:  { bg:'#FFF7ED', color:'#C2410C'  },
  pret:              { bg:'#F0FDF4', color:'#15803D'  },
  termine:           { bg:'#ECFDF5', color:'#065F46'  },
}

const FLUSSI_DAYS = days_until('2027-01-12')

export default function AdminDashboard() {
  const [rows, setRows]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      // Charger tous les dossiers
      const dossiersSnap = await getDocs(collection(db, 'dossiers'))
      const result: any[] = []

      // Charger les users en parallèle
      await Promise.all(
        dossiersSnap.docs.map(async (d) => {
          const uSnap = await getDocs(
            query(collection(db, 'users'), where('uid','==',d.id))
          )
          const u = uSnap.empty ? null : uSnap.docs[0].data()
          result.push({
            id:         d.id,
            ...d.data(),
            full_name:  u?.full_name ?? '—',
            email:      u?.email     ?? '',
            country:    u?.country_code ?? '',
          })
        })
      )

      // Trier par date
      result.sort((a,b) => (b.created_at?.seconds??0) - (a.created_at?.seconds??0))
      setRows(result)
    } catch (e: any) {
      console.error('Admin load error:', e)
      toast.error(`Erreur: ${e.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const total    = rows.length
  const urgents  = rows.filter(r => r.is_urgent).length
  const incomBl  = rows.filter(r => ['nouveau','incomplet'].includes(r.statut)).length
  const enCours  = rows.filter(r => r.statut === 'en_cours').length
  const nowWeek  = rows.filter(r => {
    const s = r.created_at?.seconds
    return s && (Date.now()/1000 - s) < 604800
  }).length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement des données Firebase...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 3px' }}>Dashboard Admin</h1>
          <p style={{ color:'#6B7280', fontSize:'13px', margin:0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
          </p>
        </div>
        <button onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} style={{ animation:refreshing?'spin 0.7s linear infinite':undefined }} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Flussi */}
      <div style={{ background:'linear-gradient(135deg,#111827,#1F2937)', borderRadius:'14px', padding:'18px 20px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div style={{ fontSize:'11px', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>⏱ Click Day Flussi</div>
          <div style={{ fontWeight:'700', fontSize:'16px' }}>12 Janvier 2027 — Saisonniers Agricoles</div>
          <div style={{ fontSize:'12px', color:'#D4A017', marginTop:'3px' }}>Préparez les dossiers maintenant</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'10px 20px', textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:'28px', fontWeight:'900', color:'#F0BC2E', lineHeight:1 }}>{FLUSSI_DAYS}</div>
          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>jours restants</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px' }}>
        {[
          { l:'Total candidats', v:total,   color:'#1B3A6B', bg:'#EBF0FF' },
          { l:'Cette semaine',   v:nowWeek, color:'#7C3AED', bg:'#F5F3FF' },
          { l:'Urgents',         v:urgents, color:'#EF4444', bg:'#FFF1F2' },
          { l:'À compléter',     v:incomBl, color:'#F97316', bg:'#FFF7ED' },
          { l:'En cours',        v:enCours, color:'#059669', bg:'#F0FDF4' },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:'24px', fontWeight:'900', color:s.color }}>{s.v}</div>
            <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'3px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px', borderBottom:'1px solid #F0F2F5' }}>
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:'700', margin:'0 0 2px' }}>Tous les candidats ({total})</h2>
            <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>Mis à jour en temps réel</p>
          </div>
          <Link href="/admin/candidats" className="btn btn-secondary btn-sm">Voir tout →</Link>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ width:'52px', height:'52px', background:'#F3F4F6', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Users size={24} color="#9CA3AF" />
            </div>
            <h3 style={{ fontWeight:'700', fontSize:'14px', margin:'0 0 6px' }}>Aucun candidat inscrit</h3>
            <p style={{ color:'#9CA3AF', fontSize:'13px', margin:0 }}>
              Les candidats apparaîtront ici dès qu'ils s'inscriront sur <strong>/register</strong>
            </p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13.5px' }}>
              <thead>
                <tr style={{ background:'#F9FAFB' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:'600', color:'#6B7280', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>Candidat</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:'600', color:'#6B7280', fontSize:'12px', textTransform:'uppercase' }}>Statut</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:'600', color:'#6B7280', fontSize:'12px', textTransform:'uppercase' }}>Score</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:'600', color:'#6B7280', fontSize:'12px', textTransform:'uppercase', whiteSpace:'nowrap' }}>Inscrit le</th>
                  <th style={{ padding:'10px 14px', width:'50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,12).map(c => {
                  const badge = STATUT_BADGE[c.statut] ?? { bg:'#F3F4F6', color:'#6B7280' }
                  return (
                    <tr key={c.id} style={{ borderTop:'1px solid #F0F2F5' }}>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          {c.is_urgent && <Flame size={13} color="#EF4444" />}
                          <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'12px', color:'#1B3A6B', flexShrink:0 }}>
                            {initiales(c.full_name)}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' }}>{c.full_name}</div>
                            <div style={{ fontSize:'11px', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'99px', background:badge.bg, color:badge.color, whiteSpace:'nowrap' }}>
                          {STATUT_LABEL[c.statut] ?? c.statut}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                          <div style={{ width:'55px', height:'5px', background:'#E9ECF0', borderRadius:'99px', overflow:'hidden' }}>
                            <div style={{ height:'100%', background:c.score_completion>=70?'#22C55E':c.score_completion>=40?'#F97316':'#EF4444', width:`${c.score_completion||0}%`, borderRadius:'99px' }} />
                          </div>
                          <span style={{ fontSize:'12px', fontWeight:'600', color:c.score_completion>=70?'#059669':c.score_completion>=40?'#D97706':'#DC2626' }}>
                            {c.score_completion||0}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:'12px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{fmt_date(c.created_at)}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <Link href={`/admin/candidats/${c.id}`} className="btn btn-secondary btn-icon btn-sm" title="Voir dossier">
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nav rapide */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px' }}>
        {[
          { href:'/admin/candidats', label:'👥 Candidats',    desc:'Gérer les dossiers'       },
          { href:'/admin/messages',  label:'💬 Messages',     desc:'Conversations'             },
          { href:'/admin/paiements', label:'💳 Paiements',    desc:'Commandes et encaissements'},
          { href:'/admin/ia',        label:'🤖 Agents IA',    desc:'Générer CV, lettres...'    },
        ].map(a => (
          <Link key={a.href} href={a.href} className="card card-hover" style={{ textDecoration:'none', padding:'14px' }}>
            <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'4px' }}>{a.label}</div>
            <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{a.desc}</div>
          </Link>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}