'use client'
import { useState } from 'react'
import { ChevronDown, Bell, AlertTriangle, Calendar } from 'lucide-react'
import { days_until } from '@/lib/utils'

const EVENTS = [
  { date:'2027-01-12', label:'Saisonniers Agricoles', color:'#22C55E', docs:['Passeport valide','CV en français','Acte de naissance','Casier judiciaire','Photo identité'], desc:'Quota pour les travailleurs saisonniers dans l\'agriculture : vendanges, maraîchage, arboriculture...' },
  { date:'2027-02-09', label:'Saisonniers Tourisme',  color:'#3B82F6', docs:['Passeport valide','CV optimisé','Attestation hôtellerie/restauration','Lettre de motivation'], desc:'Quota pour le tourisme, hôtellerie, restauration saisonnière.' },
  { date:'2027-02-16', label:'Non Saisonniers',       color:'#8B5CF6', docs:['Passeport valide','Diplômes professionnels','CV technique','Lettre de motivation'], desc:'Travailleurs non saisonniers multisecteurs : industrie, construction, transport, services.' },
  { date:'2027-02-18', label:'Assistance Familiale',  color:'#F97316', docs:['Passeport valide','Diplôme soins ou attestation expérience','CV détaillé','Casier judiciaire'], desc:'Aide à domicile, soins aux personnes âgées, garde d\'enfants, assistante de vie.' },
]

export default function FlussiPage() {
  const [open, setOpen] = useState<number|null>(0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div className="page-header">
        <h1>Calendrier Flussi 2027</h1>
        <p>Décret Flussi 2026–2028 · Les dates 2026 sont passées · Préparez-vous pour 2027</p>
      </div>

      <div className="alert alert-warning">
        <AlertTriangle size={16} style={{ flexShrink:0, marginTop:'1px' }} />
        <div>
          <strong>ItalianiPro prépare votre dossier — mais ne dépose aucune demande officielle.</strong><br />
          La demande de Nulla Osta est effectuée par l'<strong>employeur</strong> via le Sportello Unico delle Immigrazioni. Nous aidons à optimiser votre profil pour être sélectionné avant le Click Day.
        </div>
      </div>

      {/* Prochain countdown */}
      <div style={{ background:'linear-gradient(135deg, #1B3A6B, #2952A3)', borderRadius:'16px', padding:'24px', color:'white' }}>
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Prochain Click Day</div>
        <div style={{ fontSize:'20px', fontWeight:'800', marginBottom:'4px' }}>12 Janvier 2027 — Saisonniers Agricoles</div>
        <div style={{ display:'flex', gap:'12px', marginTop:'16px' }}>
          {[
            { v:Math.floor(days_until('2027-01-12')/30),   l:'mois'  },
            { v:Math.floor((days_until('2027-01-12')%30)/7), l:'sem.' },
            { v:days_until('2027-01-12')%7,                 l:'jours' },
          ].map(t => (
            <div key={t.l} style={{ background:'rgba(255,255,255,0.12)', borderRadius:'10px', padding:'12px 16px', textAlign:'center', minWidth:'64px' }}>
              <div style={{ fontSize:'26px', fontWeight:'900', color:'#F0BC2E' }}>{t.v}</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>{t.l}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'12px' }}>
          Commencez la préparation maintenant. Les employeurs cherchent leurs candidats <strong style={{ color:'#F0BC2E' }}>plusieurs mois à l'avance</strong>.
        </p>
      </div>

      {/* Events */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {EVENTS.map((e, i) => {
          const d = days_until(e.date)
          const isOpen = open === i
          return (
            <div key={i} className="card" style={{ padding:0, overflow:'hidden' }}>
              <button onClick={() => setOpen(isOpen?null:i)} style={{
                width:'100%', padding:'16px', display:'flex', alignItems:'center', gap:'14px',
                background:'none', border:'none', cursor:'pointer', textAlign:'left',
              }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:e.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'700', fontSize:'14px', color:'#111827' }}>{e.label}</div>
                  <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>{new Date(e.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</div>
                </div>
                <div style={{ textAlign:'right', marginRight:'8px' }}>
                  <div style={{ fontSize:'20px', fontWeight:'900', color:e.color }}>{d}</div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF' }}>jours</div>
                </div>
                <ChevronDown size={16} color="#9CA3AF" style={{ transform: isOpen?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }} />
              </button>

              {isOpen && (
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid #F0F2F5' }}>
                  <p style={{ fontSize:'13px', color:'#6B7280', margin:'12px 0', lineHeight:'1.6' }}>{e.desc}</p>
                  <div style={{ marginBottom:'12px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'#374151', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'8px' }}>Documents requis</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      {e.docs.map((doc, j) => (
                        <div key={j} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#374151' }}>
                          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:e.color, flexShrink:0 }} />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background:`${e.color}18`, color:e.color, border:`1.5px solid ${e.color}40` }}>
                    <Bell size={13} /> Activer rappel
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 2028 preview */}
      <div className="card" style={{ background:'#F9FAFB' }}>
        <h3 style={{ fontWeight:'700', fontSize:'14px', marginBottom:'8px' }}>📅 Flussi 2028 — Prévision</h3>
        <p style={{ fontSize:'13px', color:'#6B7280', marginBottom:'12px' }}>Les mêmes dates sont attendues pour le cycle 2028. Préparez votre dossier dès maintenant pour maximiser vos chances sur 2 cycles.</p>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {['12 Jan 2028','9 Fév 2028','16 Fév 2028','18 Fév 2028'].map(d => (
            <span key={d} style={{ background:'#E9ECF0', color:'#6B7280', padding:'4px 10px', borderRadius:'8px', fontSize:'12px', fontWeight:'500' }}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
