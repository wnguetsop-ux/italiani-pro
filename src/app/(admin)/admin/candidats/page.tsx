'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Eye, Search, Flame, RefreshCw, Users, Filter } from 'lucide-react'
import { fmt_date, STATUT_LABEL, days_until, initiales } from '@/lib/utils'
import { toast } from 'sonner'

const STATUTS = ['tous','nouveau','incomplet','en_cours','en_verification','attente_paiement','attente_client','pret','termine']
const SCOLOR: Record<string,string> = { nouveau:'#9CA3AF',incomplet:'#EF4444',en_cours:'#8B5CF6',en_verification:'#3B82F6',attente_paiement:'#F97316',attente_client:'#F59E0B',pret:'#22C55E',termine:'#059669' }

export default function AdminCandidats() {
  const [candidats, setCandidats] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtre, setFiltre]       = useState('tous')

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'dossiers'))
      const list: any[] = []
      for (const d of snap.docs) {
        const u = await getDoc(doc(db, 'users', d.id))
        const ud = u.exists() ? u.data() : {}
        list.push({ id:d.id, ...d.data(), full_name:ud.full_name??'—', email:ud.email??'', phone:ud.phone??'' })
      }
      list.sort((a,b) => (b.created_at?.toMillis?.()??0) - (a.created_at?.toMillis?.()??0))
      setCandidats(list)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = candidats.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone?.includes(q)
    const matchFiltre = filtre === 'tous' || c.statut === filtre || (filtre === 'urgent' && c.is_urgent)
    return matchSearch && matchFiltre
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Candidats</h1>
          <p>{candidats.length} candidat{candidats.length > 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} style={loading?{animation:'spin 0.7s linear infinite'}:{}} /> Actualiser
        </button>
      </div>

      {/* Search + filtres */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1', minWidth:'200px' }}>
          <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, téléphone..." style={{ paddingLeft:'36px' }} />
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {['tous','urgent','incomplet','en_cours','attente_paiement','termine'].map(f => (
            <button key={f} onClick={() => setFiltre(f)} className="btn btn-sm" style={{
              background: filtre===f?'#1B3A6B':'white', color: filtre===f?'white':'#374151',
              border:`1.5px solid ${filtre===f?'#1B3A6B':'#E4E8EF'}`,
            }}>
              {f==='tous'?'Tous':f==='urgent'?'🔥 Urgents':STATUT_LABEL[f]??f}
              <span style={{ marginLeft:'4px', opacity:0.7, fontSize:'11px' }}>
                ({f==='tous'?candidats.length:f==='urgent'?candidats.filter(c=>c.is_urgent).length:candidats.filter(c=>c.statut===f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon"><Users size={22} color="#9CA3AF" /></div><h3>Aucun candidat</h3><p>{search ? 'Aucun résultat pour cette recherche.' : 'Aucun candidat inscrit pour l\'instant.'}</p></div></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Contact</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Secteur</th>
                <th>Inscrit le</th>
                <th style={{ width:'60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#1B3A6B', fontWeight:'700', fontSize:'12px', flexShrink:0 }}>
                        {initiales(c.full_name)}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          {c.is_urgent && <Flame size={12} color="#EF4444" />}
                          <span style={{ fontWeight:'600', fontSize:'13.5px' }}>{c.full_name}</span>
                        </div>
                        <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{c.profession || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize:'12.5px' }}>{c.email}</div>
                    {c.phone && <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{c.phone}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'12px',
                      background: SCOLOR[c.statut]?`${SCOLOR[c.statut]}18`:'#F3F4F6',
                      color: SCOLOR[c.statut]??'#6B7280' }}>
                      {STATUT_LABEL[c.statut]??'Nouveau'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'48px', height:'5px', background:'#E9ECF0', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', background:'#1B3A6B', width:`${c.score_completion??0}%`, borderRadius:'3px' }} />
                      </div>
                      <span style={{ fontSize:'12px', fontWeight:'700', color:'#1B3A6B' }}>{c.score_completion??0}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize:'12.5px', color:'#6B7280' }}>{c.secteur_cible||'—'}</td>
                  <td style={{ fontSize:'12px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{fmt_date(c.created_at)}</td>
                  <td>
                    <Link href={`/admin/candidats/${c.id}`} className="btn btn-secondary btn-icon btn-sm">
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}