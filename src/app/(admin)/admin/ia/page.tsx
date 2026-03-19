'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { Brain, Zap, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

const AGENTS = [
  { id:'analyze_profile',      label:'🔍 Analyser le profil',       desc:'Forces, faiblesses, secteurs recommandés, score' },
  { id:'generate_checklist',   label:'📋 Checklist documents',       desc:'Documents manquants selon secteur et pack' },
  { id:'generate_cv_fr',       label:'📄 Générer CV Français',        desc:'CV professionnel corrigé et optimisé' },
  { id:'generate_cv_it',       label:'🇮🇹 Générer CV Italien',         desc:'Adapté au marché du travail italien' },
  { id:'generate_cover_letter',label:'✉️ Lettre de motivation',       desc:'Personnalisée selon secteur et langue' },
  { id:'summarize_proofs',     label:'🛡️ Résumé preuves',             desc:'Ce qui a été fait pour le client' },
  { id:'assist_admin',         label:'🤖 Assistant admin',            desc:'Résumé dossier + prochaine action' },
  { id:'payment_reminder',     label:'💰 Rappel paiement',           desc:'Message de relance professionnel' },
  { id:'prepare_interview',    label:'🎤 Coach entretien',            desc:'Questions probables + conseils pratiques' },
]

export default function AdminIA() {
  const [candidats, setCandidats] = useState<any[]>([])
  const [selected, setSelected]   = useState('')
  const [agentId, setAgentId]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'dossiers'))
      const list: any[] = []
      for (const d of snap.docs) {
        const u = await getDoc(doc(db, 'users', d.id))
        if (u.exists()) list.push({ id:d.id, full_name:u.data().full_name??'—', email:u.data().email??'' })
      }
      list.sort((a,b) => a.full_name.localeCompare(b.full_name))
      setCandidats(list); setLoadingList(false)
    }
    load()
  }, [])

  const run = async () => {
    if (!selected || !agentId) { toast.error('Choisissez un candidat et un agent'); return }
    setLoading(true); setResult(null)
    try {
      const token = document.cookie.match(/ip_token=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/ai/run', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({ action:agentId, candidateId:selected, options:{} }),
      })
      const data = await res.json()
      if (data.success) { setResult(data); toast.success('✅ Agent terminé !') }
      else toast.error(data.error ?? 'Erreur agent')
    } catch { toast.error('Erreur connexion') } finally { setLoading(false) }
  }

  const downloadCV = () => {
    if (!result?.result?.output?.cvText) return
    const name = candidats.find(c=>c.id===selected)?.full_name ?? 'candidat'
    const lang = agentId.endsWith('fr') ? 'FR' : 'IT'
    const blob = new Blob([`${name}\n${'='.repeat(50)}\n\n${result.result.output.cvText}`], {type:'text/plain'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download=`CV_${name.replace(/\s/g,'_')}_${lang}.txt`; a.click()
    URL.revokeObjectURL(url); toast.success('📥 CV téléchargé')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div className="page-header">
        <h1>Agents IA</h1>
        <p>Générez CV, lettres, analyses — pour chaque candidat</p>
      </div>

      <div className="alert alert-warning" style={{ fontSize:'12.5px' }}>
        ⚠️ <strong>Conformité :</strong> Aucun agent ne promet emploi, visa ou nulla osta. Relisez avant envoi au client.
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginBottom:'16px' }}>Lancer un agent</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px', marginBottom:'14px' }}>
          <div>
            <label className="field-label">Candidat *</label>
            <select value={selected} onChange={e=>setSelected(e.target.value)}>
              <option value="">— Choisir un candidat —</option>
              {candidats.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Agent *</label>
            <select value={agentId} onChange={e=>setAgentId(e.target.value)}>
              <option value="">— Choisir un agent —</option>
              {AGENTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            {agentId && <p style={{ fontSize:'12px', color:'#6B7280', marginTop:'6px' }}>{AGENTS.find(a=>a.id===agentId)?.desc}</p>}
          </div>
        </div>
        <button onClick={run} disabled={loading||!selected||!agentId} className="btn btn-primary">
          {loading?<><Loader2 size={15} style={{animation:'spin 0.7s linear infinite'}}/> En cours...</>:<><Zap size={15}/> Lancer l'agent</>}
        </button>
      </div>

      {result && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
            <Brain size={18} color="#8B5CF6"/>
            <h2 className="section-title">{AGENTS.find(a=>a.id===agentId)?.label}</h2>
            <span style={{ marginLeft:'auto', background:'#F0FDF4', color:'#059669', fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'10px' }}>✅ Sauvegardé</span>
          </div>
          <pre style={{ background:'#F9FAFB', borderRadius:'10px', padding:'14px', fontSize:'12px', color:'#374151', lineHeight:'1.7', whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:'400px', overflowY:'auto', fontFamily:'ui-monospace,monospace', border:'1px solid #E4E8EF' }}>
            {JSON.stringify(result.result?.output ?? result.result, null, 2)}
          </pre>
          {(agentId==='generate_cv_fr'||agentId==='generate_cv_it') && result.result?.output?.cvText && (
            <div style={{ marginTop:'12px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <button onClick={downloadCV} className="btn btn-primary btn-sm"><Download size={13}/> Télécharger CV .txt</button>
              <a href="https://it.indeed.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">🇮🇹 Indeed Italie</a>
              <a href="https://www.infojobs.it" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Infojobs.it</a>
              <a href="https://www.linkedin.com/jobs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">LinkedIn</a>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="section-title" style={{ marginBottom:'12px' }}>Tous les agents</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:'8px' }}>
          {AGENTS.map(a => (
            <button key={a.id} onClick={()=>{setAgentId(a.id);window.scrollTo({top:0,behavior:'smooth'})}}
              style={{ padding:'12px', background:agentId===a.id?'#EBF0FF':'#F9FAFB', borderRadius:'10px', border:`1.5px solid ${agentId===a.id?'#1B3A6B':'#E4E8EF'}`, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
              <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'3px', color:'#111827' }}>{a.label}</div>
              <div style={{ fontSize:'11.5px', color:'#9CA3AF' }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
