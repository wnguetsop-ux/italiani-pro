'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { CreditCard, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { fmt_date, fmt_xaf } from '@/lib/utils'

export default function PaiementsPage() {
  const [orders, setOrders]   = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    Promise.all([
      getDocs(query(collection(db, 'orders'), where('uid', '==', uid))),
      getDocs(query(collection(db, 'payments'), where('uid', '==', uid))),
    ]).then(([ord, pay]) => {
      setOrders(ord.docs.map(d => ({ id:d.id, ...d.data() })))
      setPayments(pay.docs.map(d => ({ id:d.id, ...d.data() })))
    }).finally(() => setLoading(false))
  }, [uid])

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div className="page-header">
        <h1>Paiements</h1>
        <p>Vos packs actifs et historique des paiements</p>
      </div>

      {/* Pack actif */}
      {orders.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><CreditCard size={24} color="#9CA3AF" /></div>
            <h3>Aucun pack actif</h3>
            <p>Choisissez un pack d'accompagnement pour commencer votre préparation vers l'Italie.</p>
            <a href="/#packs" className="btn btn-primary btn-sm" style={{ marginTop:'4px' }}>Voir les packs</a>
          </div>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card" style={{ border:'1.5px solid #1B3A6B33', background:'#F8F9FF' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap', marginBottom:'16px' }}>
              <div>
                <div style={{ fontSize:'11px', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px' }}>Pack actif</div>
                <h2 style={{ fontSize:'18px', fontWeight:'800', color:'#1B3A6B' }}>{order.pack_nom || order.pack_type || 'Pack ItalianiPro'}</h2>
              </div>
              <span className={`badge ${order.statut_paiement === 'paye' ? 'badge-approved' : 'badge-pending'}`}>
                {order.statut_paiement === 'paye' ? '✅ Payé' : '⏳ En attente'}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'12px' }}>
              {[
                { l:'Total', v:fmt_xaf(order.montant_total || 0) },
                { l:'Payé',  v:fmt_xaf(order.montant_paye || 0) },
                { l:'Reste', v:fmt_xaf((order.montant_total||0)-(order.montant_paye||0)) },
              ].map(s => (
                <div key={s.l} style={{ background:'white', border:'1px solid #E4E8EF', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
                  <div style={{ fontSize:'11px', color:'#6B7280', marginBottom:'4px' }}>{s.l}</div>
                  <div style={{ fontWeight:'800', fontSize:'16px', color:'#111827' }}>{s.v}</div>
                </div>
              ))}
            </div>
            {(order.montant_total||0) > (order.montant_paye||0) && (
              <div className="alert alert-warning" style={{ marginTop:'12px' }}>
                <Clock size={15} style={{ flexShrink:0 }} />
                <div>Un paiement est en attente. Contactez-nous via <strong>WhatsApp</strong> ou <strong>Messages</strong> pour effectuer votre paiement Mobile Money (MTN, Orange).</div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Historique */}
      {payments.length > 0 && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom:'14px' }}>Historique des paiements</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {payments.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#F9FAFB', borderRadius:'9px', border:'1px solid #F0F2F5' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'9px', background: p.statut==='paye'?'#F0FDF4':'#FFF7ED', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {p.statut==='paye' ? <CheckCircle size={18} color="#22C55E" /> : <Clock size={18} color="#F97316" />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'600', fontSize:'13.5px' }}>{p.description || 'Paiement'}</div>
                  <div style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'2px' }}>{fmt_date(p.created_at)} · {p.methode || 'Mobile Money'}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:'800', fontSize:'15px', color: p.statut==='paye'?'#059669':'#F97316' }}>{fmt_xaf(p.montant||0)}</div>
                  {p.reference && <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px' }}>Réf: {p.reference}</div>}
                </div>
                {p.facture_url && (
                  <a href={p.facture_url} download className="btn btn-secondary btn-icon btn-sm" title="Télécharger facture">
                    <Download size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment methods info */}
      <div className="card" style={{ background:'#F9FAFB' }}>
        <h3 style={{ fontWeight:'700', fontSize:'14px', marginBottom:'10px' }}>💳 Méthodes de paiement acceptées</h3>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {['💛 MTN Mobile Money','🟠 Orange Money','📱 Airtel Money','💳 Carte bancaire'].map(m => (
            <span key={m} style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'8px', padding:'6px 12px', fontSize:'13px', fontWeight:'500' }}>{m}</span>
          ))}
        </div>
        <p style={{ fontSize:'12px', color:'#6B7280', marginTop:'10px' }}>Paiement possible en plusieurs fois. Contactez-nous sur WhatsApp : <strong>+39 329 963 9430</strong></p>
      </div>
    </div>
  )
}
