'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Brain, Zap, Download, Loader2, Search, User, FileText, CheckCircle, CreditCard, PenLine } from 'lucide-react'
import { initiales } from '@/lib/utils'
import { toast } from 'sonner'

const AGENTS = [
  { id:'analyze_profile',      icon:User,        label:'Analyser profil',       desc:'Forces, faiblesses, secteurs recommandés, score'        },
  { id:'generate_checklist',   icon:CheckCircle, label:'Checklist documents',   desc:'Liste exacte des pièces manquantes selon le profil'      },
  { id:'generate_cv_fr',       icon:FileText,    label:'CV en Français',        desc:'CV professionnel optimisé pour le marché français/EU'   },
  { id:'generate_cv_it',       icon:FileText,    label:'CV en Italien',         desc:'CV adapté au marché du travail italien — non traduit mot à mot' },
  { id:'generate_cover_letter',icon:PenLine,     label:'Lettre de motivation',  desc:'Lettre personnalisée selon le secteur ciblé'             },
  { id:'assist_admin',         icon:Brain,       label:'Résumé + action admin', desc:'Résume le dossier et suggère la prochaine action'        },
  { id:'payment_reminder',     icon:CreditCard,  label:'Rappel paiement',       desc:'Message de relance professionnel et non agressif'       },
]

export default function AdminIA() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [selected, setSelected]     = useState<any|null>(null)
  const [search, setSearch]         = useState('')
  const [running, setRunning]       = useState<string|null>(null)
  const [output, setOutput]         = useState('')
  const [outputTitle, setOutputTitle] = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'dossiers'))
      const list: any[] = []
      for (const d of snap.docs) {
        const uSnap = await getDocs(query(collection(db, 'users'), where('uid','==',d.id)))
        const u = uSnap.empty ? null : uSnap.docs[0].data()
        list.push({ id:d.id, ...d.data(), full_name:u?.full_name||'—', email:u?.email||'' })
      }
      setCandidates(list)
      setLoading(false)
    }
    load()
  }, [])

  const runAgent = async (agentId: string) => {
    if (!selected) { toast.error('Sélectionnez un candidat d\'abord'); return }
    setRunning(agentId)
    setOutput('')
    try {
      const token = document.cookie.match(/ip_token=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/ai/run', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ action: agentId, candidateId: selected.id, options:{} }),
      })
      const data = await res.json()
      if (data.success) {
        const out = data.result?.output
        if (out) {
          const txt = out.cvText || out.letterText || out.messageText || out.clientMessageFr || out.summaryFr || out.suggestedAction || out.summary || out.clientMessage || JSON.stringify(out, null, 2)
          setOutput(String(txt))
          setOutputTitle(`${AGENTS.find(a=>a.id===agentId)?.label} — ${selected.full_name}`)
        }
        toast.success(`✅ ${AGENTS.find(a=>a.id===agentId)?.label} terminé`)
      } else { toast.error(data.error ?? 'Erreur agent') }
    } catch (e) { toast.error('Erreur API — Vérifiez que les clés OpenAI sont configurées') }
    finally { setRunning(null) }
  }

  const download = (txt: string, name: string) => {
    const blob = new Blob([txt], { type:'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download=`${name}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success('📥 Téléchargé')
  }

  const print = (txt: string, title: string) => {
    const w = window.open('','_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8}h1{color:#1B3A6B;border-bottom:2px solid #D4A017;padding-bottom:8px}pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px}</style></head><body><h1>${title}</h1><pre>${txt}</pre><hr/><p style="color:#999;font-size:11px">Généré par ItalianiPro — Accompagnement documentaire uniquement</p></body></html>`)
    w.document.close(); w.print()
  }

  const filteredCandidates = candidates.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'40px', color:'#6B7280' }}><span className="spinner" /> Chargement...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }} className="fade-up">
      <div className="page-header">
        <h1>Agents IA</h1>
        <p>Sélectionnez un candidat puis lancez un agent</p>
      </div>

      <div className="alert alert-warning">
        <div>⚠️ <strong>Règle de conformité :</strong> Aucun output ne doit promettre un emploi, visa ou nulla osta. Relisez toujours avant d'envoyer au client.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'16px', alignItems:'start' }}>

        {/* Sélection candidat */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'12px', borderBottom:'1px solid #F0F2F5' }}>
            <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'8px' }}>1. Choisir un candidat</div>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ paddingLeft:'30px', fontSize:'13px' }} />
            </div>
          </div>
          <div style={{ maxHeight:'400px', overflowY:'auto' }}>
            {filteredCandidates.length === 0 ? (
              <div className="empty" style={{ padding:'24px' }}>
                <h3>Aucun candidat</h3>
                <p>Attendez qu'un candidat s'inscrive.</p>
              </div>
            ) : filteredCandidates.map(c => (
              <button key={c.id} onClick={() => { setSelected(c); setOutput('') }} style={{
                width:'100%', padding:'10px 14px', background: selected?.id===c.id?'#EBF0FF':'transparent',
                border:'none', borderBottom:'1px solid #F9FAFB', cursor:'pointer', textAlign:'left', fontFamily:'inherit',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: selected?.id===c.id?'#1B3A6B':'#E9ECF0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'11px', color: selected?.id===c.id?'white':'#6B7280', flexShrink:0 }}>
                    {initiales(c.full_name)}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:'600', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: selected?.id===c.id?'#1B3A6B':'#111827' }}>{c.full_name}</div>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.secteur_cible||c.profession||'—'}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Agents + Résultat */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {selected && (
            <div style={{ background:'#EBF0FF', border:'1.5px solid #1B3A6B30', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#1B3A6B', display:'flex', alignItems:'center', gap:'8px', fontWeight:'600' }}>
              <User size={15} /> Candidat sélectionné : <strong>{selected.full_name}</strong> · {selected.secteur_cible||'—'}
            </div>
          )}

          <div style={{ fontWeight:'700', fontSize:'14px', color:'#374151' }}>2. Lancer un agent</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'8px' }}>
            {AGENTS.map(agent => {
              const isRunning = running === agent.id
              return (
                <button key={agent.id} onClick={() => runAgent(agent.id)} disabled={!!running || !selected} className="card" style={{
                  padding:'14px', cursor: selected?'pointer':'not-allowed', textAlign:'left', border:'1.5px solid #E4E8EF',
                  opacity: !selected?0.5:1, transition:'all 0.15s', fontFamily:'inherit', background:'white',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                    <div style={{ width:'32px', height:'32px', background:isRunning?'#1B3A6B':'#EBF0FF', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>
                      {isRunning ? <Loader2 size={15} color="white" style={{ animation:'spin 0.7s linear infinite' }} /> : <agent.icon size={15} color={isRunning?'white':'#1B3A6B'} />}
                    </div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'13px', color:'#111827' }}>{agent.label}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'11px', color:'#9CA3AF', lineHeight:'1.5' }}>{agent.desc}</div>
                  {isRunning && <div style={{ marginTop:'8px', fontSize:'11px', color:'#1B3A6B', fontWeight:'600' }}>⏳ Génération en cours...</div>}
                </button>
              )
            })}
          </div>

          {/* Résultat */}
          {output && (
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
                <h3 style={{ fontWeight:'700', fontSize:'15px', margin:0 }}>📄 {outputTitle}</h3>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <button onClick={() => navigator.clipboard.writeText(output).then(()=>toast.success('Copié !'))} className="btn btn-secondary btn-sm">📋 Copier</button>
                  <button onClick={() => download(output, outputTitle)} className="btn btn-secondary btn-sm"><Download size={13} /> TXT</button>
                  <button onClick={() => print(output, outputTitle)} className="btn btn-primary btn-sm">🖨️ PDF</button>
                </div>
              </div>
              <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'13.5px', lineHeight:'1.8', color:'#374151', background:'#F9FAFB', padding:'14px', borderRadius:'10px', maxHeight:'450px', overflowY:'auto', border:'1px solid #E4E8EF' }}>
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
