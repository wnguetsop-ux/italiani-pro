'use client'
import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { CreditCard, Plus, CheckCircle, Search, Eye, RefreshCw, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { fmt_date, fmt_xaf, initiales } from '@/lib/utils'
import { toast } from 'sonner'

const PACKS = [
  { id:'starter',  label:'Pack Starter — 5 employeurs',    prix:30000  },
  { id:'standard', label:'Pack Standard — 20 employeurs',  prix:100000 },
  { id:'premium',  label:'Pack Premium — 50 employeurs',   prix:250000 },
]

const MOBILE_MONEY_NUMBER = '651495483' // Orange/MTN Cameroun

export default function AdminPaiements() {
  const [orders, setOrders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showNew, setShowNew]   = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ uid:'', pack:'starter', montant:30000, note:'' })
  const [showReceipt, setShowReceipt] = useState<any|null>(null)

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'orders'))
      const list: any[] = []
      await Promise.all(snap.docs.map(async d => {
        const uSnap = await getDocs(query(collection(db, 'users'), where('uid','==',d.data().uid)))
        const u = uSnap.empty ? null : uSnap.docs[0].data()
        list.push({ id:d.id, ...d.data(), full_name:u?.full_name||'—', email:u?.email||'' })
      }))
      list.sort((a,b)=>(b.created_at?.seconds??0)-(a.created_at?.seconds??0))
      setOrders(list)

      const cSnap = await getDocs(collection(db, 'users'))
      setCandidates(cSnap.docs.map(d=>({uid:d.id,...d.data()})).filter(u=>u.role==='candidat'))
    } catch (e) {
      console.error('loadOrders error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createOrder = async () => {
    if (!form.uid) { toast.error('Choisissez un candidat'); return }
    setSaving(true)
    try {
      const pack = PACKS.find(p => p.id === form.pack)!
      await addDoc(collection(db, 'orders'), {
        uid: form.uid, pack_type: form.pack, pack_nom: pack.label,
        montant_total: form.montant || pack.prix, montant_paye: 0,
        statut_paiement: 'en_attente', note: form.note,
        mobile_money_number: MOBILE_MONEY_NUMBER,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      })
      toast.success('✅ Commande créée')
      setShowNew(false)
      setForm({ uid:'', pack:'starter', montant:30000, note:'' })
      await load()
    } catch { toast.error('Erreur') } finally { setSaving(false) }
  }

  const markPaid = async (orderId: string, montant: number) => {
    await updateDoc(doc(db, 'orders', orderId), {
      statut_paiement: 'paye',
      montant_paye: montant,
      paid_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    toast.success('✅ Paiement confirmé')
    await load()
  }

  const filtered = orders.filter(o =>
    !search || o.full_name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPaye    = orders.filter(o=>o.statut_paiement==='paye').reduce((s,o)=>s+(o.montant_total||0),0)
  const totalAttente = orders.filter(o=>o.statut_paiement!=='paye').reduce((s,o)=>s+(o.montant_total||0),0)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 3px' }}>Paiements</h1>
          <p style={{ color:'#6B7280', fontSize:'13px', margin:0 }}>Gestion des commandes</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={load} className="btn btn-secondary btn-icon btn-sm"><RefreshCw size={15} /></button>
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Nouvelle commande
          </button>
        </div>
      </div>

      {/* Mobile Money info */}
      <div style={{ background:'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border:'1.5px solid #86EFAC', borderRadius:'12px', padding:'14px 18px' }}>
        <div style={{ fontWeight:'700', fontSize:'14px', color:'#15803D', marginBottom:'6px' }}>
          📱 Numéro Mobile Money pour réception des paiements
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <div style={{ fontSize:'22px', fontWeight:'900', color:'#15803D', letterSpacing:'0.05em' }}>
            {MOBILE_MONEY_NUMBER}
          </div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            <span style={{ background:'#DCFCE7', color:'#15803D', border:'1px solid #86EFAC', padding:'3px 10px', borderRadius:'7px', fontSize:'12px', fontWeight:'600' }}>MTN Cameroun</span>
            <span style={{ background:'#FFF7ED', color:'#C2410C', border:'1px solid #FED7AA', padding:'3px 10px', borderRadius:'7px', fontSize:'12px', fontWeight:'600' }}>Orange Cameroun</span>
          </div>
        </div>
        <p style={{ fontSize:'12px', color:'#16A34A', margin:'6px 0 0' }}>
          Le client envoie le paiement à ce numéro puis vous partage le reçu via WhatsApp ou dans l'application.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'10px' }}>
        {[
          { l:'Commandes',    v:orders.length,                                       color:'#1B3A6B' },
          { l:'Payées',       v:orders.filter(o=>o.statut_paiement==='paye').length, color:'#15803D' },
          { l:'En attente',   v:orders.filter(o=>o.statut_paiement!=='paye').length, color:'#C2410C' },
          { l:'Reçu',         v:fmt_xaf(totalPaye),                                  color:'#15803D' },
          { l:'À encaisser',  v:fmt_xaf(totalAttente),                               color:'#C2410C' },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:s.l.includes('Reçu')||s.l.includes('encaisser')?'13px':'22px', fontWeight:'900', color:s.color }}>{s.v}</div>
            <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Modal nouvelle commande */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div className="card" style={{ width:'100%', maxWidth:'420px', padding:'22px', position:'relative' }}>
            <button onClick={()=>setShowNew(false)} style={{ position:'absolute', top:'14px', right:'14px', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
              <X size={18} />
            </button>
            <h2 style={{ fontWeight:'800', fontSize:'17px', margin:'0 0 16px' }}>Nouvelle commande</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'5px' }}>Candidat *</label>
                <select value={form.uid} onChange={e => setForm(f=>({...f,uid:e.target.value}))} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E4E8EF', borderRadius:'9px', fontSize:'14px', fontFamily:'inherit', background:'white' }}>
                  <option value="">— Choisir —</option>
                  {candidates.map(c=><option key={c.uid} value={c.uid}>{c.full_name} — {c.email}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'5px' }}>Pack</label>
                <select value={form.pack} onChange={e=>{ const p=PACKS.find(x=>x.id===e.target.value)!; setForm(f=>({...f,pack:e.target.value,montant:p.prix})) }} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E4E8EF', borderRadius:'9px', fontSize:'14px', fontFamily:'inherit', background:'white' }}>
                  {PACKS.map(p=><option key={p.id} value={p.id}>{p.label} — {fmt_xaf(p.prix)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'5px' }}>Montant (XAF)</label>
                <input type="number" value={form.montant} onChange={e=>setForm(f=>({...f,montant:parseInt(e.target.value)||0}))} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E4E8EF', borderRadius:'9px', fontSize:'14px', fontFamily:'inherit' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'5px' }}>Note (optionnel)</label>
                <input type="text" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Remarque interne..." style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E4E8EF', borderRadius:'9px', fontSize:'14px', fontFamily:'inherit' }} />
              </div>
              <div style={{ background:'#EFF6FF', borderRadius:'9px', padding:'10px 12px', fontSize:'12px', color:'#1E40AF' }}>
                📱 Le client doit envoyer au <strong>{MOBILE_MONEY_NUMBER}</strong> et partager son reçu.
              </div>
              <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
                <button onClick={()=>setShowNew(false)} className="btn btn-secondary" style={{ flex:1 }}>Annuler</button>
                <button onClick={createOrder} disabled={saving||!form.uid} className="btn btn-primary" style={{ flex:1 }}>
                  {saving ? <><span className="spinner spinner-white" /> Création...</> : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div style={{ position:'relative' }}>
        <Search size={14} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un candidat..." style={{ paddingLeft:'34px', width:'100%', padding:'10px 12px 10px 34px', border:'1.5px solid #E4E8EF', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit' }} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding:'40px', textAlign:'center' }}>
          <CreditCard size={28} color="#9CA3AF" style={{ marginBottom:'10px' }} />
          <h3 style={{ fontWeight:'700', fontSize:'14px', margin:'0 0 6px' }}>Aucune commande</h3>
          <p style={{ color:'#9CA3AF', fontSize:'13px', margin:0 }}>Créez une commande pour un candidat ci-dessus.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Candidat</th><th>Pack</th><th>Montant</th><th>Statut</th><th>Date</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'11px', color:'#1B3A6B', flexShrink:0 }}>
                        {initiales(o.full_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight:'600', fontSize:'13px' }}>{o.full_name}</div>
                        <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{o.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:'13px' }}>{o.pack_nom||'—'}</td>
                  <td style={{ fontWeight:'700', fontSize:'13px' }}>{fmt_xaf(o.montant_total||0)}</td>
                  <td>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'99px', fontWeight:'600',
                      background:o.statut_paiement==='paye'?'#F0FDF4':'#FFF7ED',
                      color:o.statut_paiement==='paye'?'#15803D':'#C2410C' }}>
                      {o.statut_paiement==='paye' ? '✅ Payé' : '⏳ Attente paiement'}
                    </span>
                  </td>
                  <td style={{ fontSize:'12px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{fmt_date(o.created_at)}</td>
                  <td>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      <Link href={`/admin/candidats/${o.uid}`} className="btn btn-secondary btn-icon btn-sm" title="Voir dossier">
                        <Eye size={13} />
                      </Link>
                      {o.statut_paiement !== 'paye' && (
                        <button onClick={() => markPaid(o.id, o.montant_total)} className="btn btn-sm" title="Marquer payé"
                          style={{ background:'#F0FDF4', color:'#15803D', border:'1px solid #BBF7D0', fontSize:'11px', padding:'5px 10px' }}>
                          <CheckCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions candidat */}
      <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'14px 16px' }}>
        <div style={{ fontWeight:'700', fontSize:'13px', color:'#92400E', marginBottom:'8px' }}>
          💬 Message à envoyer au client pour le paiement
        </div>
        <div style={{ fontSize:'13px', color:'#78350F', lineHeight:'1.7', whiteSpace:'pre-line' }}>
{`Pour régler votre pack ItalianiPro, envoyez le montant sur :

📱 Mobile Money : ${MOBILE_MONEY_NUMBER} (MTN ou Orange Cameroun)

Après paiement :
1. Faites une capture d'écran du reçu de transaction
2. Envoyez-la sur WhatsApp au +39 329 963 9430
3. Votre pack sera activé dans les 2 heures

💡 Objet du virement : Votre nom + "ItalianiPro"`}
        </div>
        <button onClick={() => {
          navigator.clipboard.writeText(`Pour régler votre pack ItalianiPro, envoyez le montant sur :\n\n📱 Mobile Money : ${MOBILE_MONEY_NUMBER} (MTN ou Orange Cameroun)\n\nAprès paiement :\n1. Faites une capture d'écran du reçu\n2. Envoyez-la sur WhatsApp au +39 329 963 9430\n3. Votre pack sera activé dans les 2 heures`)
          toast.success('Message copié !')
        }} className="btn btn-secondary btn-sm" style={{ marginTop:'10px' }}>
          📋 Copier ce message
        </button>
      </div>
    </div>
  )
}
