'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, onSnapshot, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { ref, getStorage } from 'firebase/storage'
import { ArrowLeft, User, FileText, Brain, MessageCircle, CreditCard, Flame, Eye, Download, Send, Loader2, RefreshCw, Check, Zap, Save, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { fmt_date, fmt_size, STATUT_LABEL, initiales } from '@/lib/utils'
import { toast } from 'sonner'

const STATUTS = ['nouveau','incomplet','en_cours','en_verification','attente_paiement','attente_client','pret','termine','suspendu']
const SECTEURS = ['agriculture','tourisme','construction','soins','industrie','autre']
const AGENTS = [
  { id:'analyze_profile',      label:'🔍 Analyser le profil',         desc:'Forces, faiblesses, score de préparation' },
  { id:'generate_checklist',   label:'📋 Checklist documents',         desc:'Liste des pièces manquantes' },
  { id:'generate_cv_fr',       label:'📄 Générer CV (Français)',        desc:'CV professionnel en français' },
  { id:'generate_cv_it',       label:'🇮🇹 Générer CV (Italien)',         desc:'CV adapté au marché italien' },
  { id:'generate_cover_letter',label:'✉️ Lettre de motivation',         desc:'Lettre personnalisée par secteur' },
  { id:'summarize_proofs',     label:'🛡️ Résumé preuves de travail',    desc:'Ce qui a été fait pour le client' },
  { id:'assist_admin',         label:'🤖 Assistant admin',              desc:'Résumé + prochaine action recommandée' },
  { id:'payment_reminder',     label:'💰 Rappel paiement',             desc:'Relance professionnelle à valider' },
  { id:'prepare_interview',    label:'🎤 Préparer entretien',           desc:'Questions probables + conseils' },
]

type Tab = 'profil' | 'documents' | 'ia' | 'messages' | 'statut'

export default function CandidatDetail() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [tab, setTab]           = useState<Tab>('profil')
  const [user, setUser]         = useState<any>(null)
  const [dossier, setDossier]   = useState<any>(null)
  const [docs, setDocs]         = useState<any[]>([])
  const [msgs, setMsgs]         = useState<any[]>([])
  const [convId, setConvId]     = useState<string|null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [newMsg, setNewMsg]     = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [newStatut, setNewStatut]   = useState('')
  const [agentLoading, setAgentLoading] = useState<string|null>(null)
  const [agentResults, setAgentResults] = useState<Record<string,any>>({})
  const [adminName, setAdminName]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const [uSnap, dSnap] = await Promise.all([getDoc(doc(db,'users',id)), getDoc(doc(db,'dossiers',id))])
      if (uSnap.exists()) setUser(uSnap.data())
      if (dSnap.exists()) { setDossier(dSnap.data()); setNewStatut(dSnap.data().statut??'nouveau') }
      const docsSnap = await getDocs(query(collection(db,'documents'), where('uid','==',id)))
      setDocs(docsSnap.docs.map(d => ({ id:d.id, ...d.data() })))
      // Admin name
      const adminUid = auth.currentUser?.uid
      if (adminUid) {
        const aSnap = await getDoc(doc(db,'users',adminUid))
        if (aSnap.exists()) setAdminName(aSnap.data().full_name??'Admin')
      }
      // Conversation
      const convSnap = await getDocs(query(collection(db,'conversations'), where('uid','==',id)))
      if (!convSnap.empty) setConvId(convSnap.docs[0].id)
      else {
        const r = await addDoc(collection(db,'conversations'), { uid:id, created_at:serverTimestamp() })
        setConvId(r.id)
      }
    } catch (e) { toast.error('Erreur chargement') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  // Messages realtime
  useEffect(() => {
    if (!convId) return
    const q = query(collection(db,'conversations',convId,'messages'), where('interne','==',false), orderBy('created_at','asc'))
    return onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id:d.id, ...d.data() })))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    })
  }, [convId])

  // Save statut
  const saveStatut = async () => {
    if (newStatut === dossier?.statut) return
    setSaving(true)
    await updateDoc(doc(db,'dossiers',id), { statut:newStatut, updated_at:serverTimestamp() })
    setDossier((d:any) => ({ ...d, statut:newStatut }))
    toast.success('Statut mis à jour ✅'); setSaving(false)
  }

  // Toggle urgent
  const toggleUrgent = async () => {
    const val = !dossier?.is_urgent
    await updateDoc(doc(db,'dossiers',id), { is_urgent:val, updated_at:serverTimestamp() })
    setDossier((d:any) => ({ ...d, is_urgent:val }))
    toast.success(val ? '🔥 Marqué urgent' : 'Urgence retirée')
  }

  // Send message admin
  const sendMsg = async () => {
    if (!newMsg.trim() || !convId) return
    setSendingMsg(true)
    try {
      await addDoc(collection(db,'conversations',convId,'messages'), {
        uid:id, convId, expediteur:'admin', nom_expediteur:adminName||'Équipe ItalianiPro',
        contenu:newMsg.trim(), interne:false, approuve:true,
        lu_par:[], created_at:serverTimestamp(),
      })
      setNewMsg('')
    } catch { toast.error('Erreur envoi') } finally { setSendingMsg(false) }
  }

  // Run AI agent
  const runAgent = async (agentId: string) => {
    setAgentLoading(agentId)
    try {
      const token = document.cookie.match(/ip_token=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/ai/run', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({ action:agentId, candidateId:id, options:{} }),
      })
      const data = await res.json()
      if (data.success) {
        setAgentResults(r => ({ ...r, [agentId]:data.result }))
        toast.success(`✅ ${AGENTS.find(a=>a.id===agentId)?.label} terminé`)
        await load()
      } else { toast.error(data.error??'Erreur agent') }
    } catch { toast.error('Erreur connexion API') } finally { setAgentLoading(null) }
  }

  // Download CV
  const downloadCV = (lang: 'fr'|'it') => {
    const cv = agentResults[`generate_cv_${lang}`]?.output
    if (!cv?.cvText) { toast.error('Générez d\'abord le CV'); return }
    const blob = new Blob([`${user?.full_name || ''}\n${'='.repeat(50)}\n\n${cv.cvText}`], { type:'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download=`CV_${user?.full_name?.replace(/\s/g,'_')}_${lang.toUpperCase()}.txt`; a.click()
    URL.revokeObjectURL(url); toast.success('📥 CV téléchargé')
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'48px', color:'#6B7280' }}><span className="spinner"/>Chargement du dossier...</div>
  if (!user) return <div className="card"><div className="empty"><h3>Candidat introuvable</h3><Link href="/admin/candidats" className="btn btn-secondary btn-sm">← Retour</Link></div></div>

  const TabBtn = ({ value, label }: { value:Tab; label:string }) => (
    <button onClick={() => setTab(value)} style={{ padding:'8px 14px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:tab===value?'700':'400', fontSize:'13.5px', background:tab===value?'#1B3A6B':'transparent', color:tab===value?'white':'#6B7280', transition:'all 0.15s' }}>
      {label}
    </button>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px', maxWidth:'900px' }} className="fade-up">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        <button onClick={() => router.push('/admin/candidats')} className="btn btn-secondary btn-icon btn-sm"><ArrowLeft size={16}/></button>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#EBF0FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#1B3A6B', fontWeight:'800', fontSize:'16px', flexShrink:0 }}>
          {initiales(user.full_name??'')}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            {dossier?.is_urgent && <Flame size={16} color="#EF4444"/>}
            <h1 style={{ fontSize:'20px', fontWeight:'800' }}>{user.full_name}</h1>
            <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'12px', background:'#F3F4F6', color:'#6B7280' }}>
              {STATUT_LABEL[dossier?.statut]??'Nouveau'}
            </span>
          </div>
          <div style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'2px' }}>{user.email} {user.phone && `· ${user.phone}`}</div>
        </div>
        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
          <button onClick={toggleUrgent} className="btn btn-sm" style={{ background:dossier?.is_urgent?'#FFF1F2':'white', color:dossier?.is_urgent?'#EF4444':'#374151', border:`1.5px solid ${dossier?.is_urgent?'#FECACA':'#E4E8EF'}` }}>
            <Flame size={13}/> {dossier?.is_urgent?'Retirer urgence':'Marquer urgent'}
          </button>
          <button onClick={load} className="btn btn-secondary btn-icon btn-sm"><RefreshCw size={14}/></button>
        </div>
      </div>

      {/* Score bar */}
      <div className="card" style={{ padding:'14px 18px', display:'flex', gap:'20px', flexWrap:'wrap', alignItems:'center' }}>
        {[
          { l:'Complétude', v:dossier?.score_completion??0, c:'#1B3A6B' },
          { l:'Documents',  v:docs.length, c:'#059669', suffix:'' },
          { l:'Validés',    v:docs.filter(d=>d.statut==='approuve').length, c:'#22C55E', suffix:'' },
          { l:'Secteur',    v:dossier?.secteur_cible||'—', c:'#8B5CF6', isText:true },
          { l:'Région',     v:dossier?.region_italie||'—', c:'#F97316', isText:true },
        ].map((s,i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ fontSize:s.isText?'13px':'22px', fontWeight:'800', color:s.c }}>{s.v}{!s.isText&&!s.suffix?'%':''}</div>
            <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:'#F3F4F6', padding:'4px', borderRadius:'11px', flexWrap:'wrap' }}>
        <TabBtn value="profil"    label="👤 Profil"    />
        <TabBtn value="documents" label={`📄 Documents (${docs.length})`} />
        <TabBtn value="ia"        label="🧠 Agents IA" />
        <TabBtn value="messages"  label={`💬 Messages (${msgs.length})`} />
        <TabBtn value="statut"    label="⚙️ Statut"    />
      </div>

      {/* TAB PROFIL */}
      {tab === 'profil' && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom:'16px' }}>Profil complet du candidat</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px' }}>
            {[
              { l:'Nom complet',        v:user.full_name },
              { l:'Email',              v:user.email },
              { l:'Téléphone',          v:user.phone||'—' },
              { l:'Pays',               v:user.country_code||'—' },
              { l:'Profession',         v:dossier?.profession||'—' },
              { l:'Expérience',         v:dossier?.annees_experience!=null?`${dossier.annees_experience} ans`:'—' },
              { l:'Niveau d\'études',   v:dossier?.niveau_etudes||'—' },
              { l:'Langues',            v:Array.isArray(dossier?.langues)?dossier.langues.join(', '):dossier?.langues||'—' },
              { l:'Secteur ciblé',      v:dossier?.secteur_cible||'—' },
              { l:'Région Italie',      v:dossier?.region_italie||'—' },
              { l:'Inscrit le',         v:fmt_date(user.created_at) },
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize:'11px', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:'600', marginBottom:'3px' }}>{f.l}</div>
                <div style={{ fontSize:'13.5px', fontWeight:'500', color:'#111827', wordBreak:'break-word' }}>{f.v}</div>
              </div>
            ))}
          </div>
          {dossier?.experiences && (
            <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #F0F2F5' }}>
              <div style={{ fontSize:'11px', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:'600', marginBottom:'6px' }}>Expériences professionnelles</div>
              <div style={{ fontSize:'13.5px', color:'#374151', lineHeight:'1.7', whiteSpace:'pre-line', background:'#F9FAFB', padding:'12px', borderRadius:'9px' }}>{dossier.experiences}</div>
            </div>
          )}
          {dossier?.competences && (
            <div style={{ marginTop:'12px' }}>
              <div style={{ fontSize:'11px', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:'600', marginBottom:'6px' }}>Compétences</div>
              <div style={{ fontSize:'13.5px', color:'#374151', lineHeight:'1.7', whiteSpace:'pre-line', background:'#F9FAFB', padding:'12px', borderRadius:'9px' }}>{dossier.competences}</div>
            </div>
          )}
          {/* Analyse IA si disponible */}
          {dossier?.ai_analysis && (
            <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #F0F2F5' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#8B5CF6', marginBottom:'10px' }}>🧠 Dernière analyse IA</div>
              <p style={{ fontSize:'13px', color:'#374151', lineHeight:'1.6', background:'#F5F3FF', padding:'12px', borderRadius:'9px' }}>{dossier.ai_analysis.summaryFr}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB DOCUMENTS */}
      {tab === 'documents' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F0F2F5' }}>
            <h2 className="section-title">Documents ({docs.length})</h2>
          </div>
          {docs.length === 0 ? (
            <div className="empty"><div className="empty-icon"><FileText size={22} color="#9CA3AF"/></div><h3>Aucun document</h3><p>Le candidat n'a pas encore uploadé de documents.</p></div>
          ) : (
            docs.map(d => (
              <div key={d.id} style={{ padding:'12px 18px', borderBottom:'1px solid #F9FAFB', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background:d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':d.content_text?'#F5F3FF':'#EFF6FF' }}>
                  <FileText size={17} color={d.statut==='approuve'?'#22C55E':d.statut==='rejete'?'#EF4444':d.content_text?'#7C3AED':'#3B82F6'} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:'600', fontSize:'13.5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom||d.name||'Document'}</div>
                  <div style={{ display:'flex', gap:'6px', marginTop:'3px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:'10px', fontWeight:'600', padding:'2px 7px', borderRadius:'10px',
                      background:d.statut==='approuve'?'#F0FDF4':d.statut==='rejete'?'#FFF1F2':'#EFF6FF',
                      color:d.statut==='approuve'?'#22C55E':d.statut==='rejete'?'#EF4444':'#3B82F6' }}>
                      {d.statut==='approuve'?'Approuvé':d.statut==='rejete'?'Rejeté':d.content_text?'Texte':'En attente'}
                    </span>
                    {d.taille && <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{fmt_size(d.taille)}</span>}
                    <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{fmt_date(d.created_at)}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                  {d.file_url && <>
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon btn-sm" title="Voir"><Eye size={13}/></a>
                    <a href={d.file_url} download className="btn btn-secondary btn-icon btn-sm" title="Télécharger"><Download size={13}/></a>
                  </>}
                  {d.content_text && (
                    <button onClick={() => {navigator.clipboard.writeText(d.content_text); toast.success('Copié !')}} className="btn btn-secondary btn-sm" title="Copier le texte" style={{ fontSize:'11px' }}>Copier</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB IA */}
      {tab === 'ia' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div className="alert alert-warning" style={{ fontSize:'12px' }}>
            ⚠️ <strong>Conformité :</strong> Tous les outputs respectent le positionnement d'accompagnement documentaire. Aucun agent ne promet emploi, visa ou nulla osta.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'10px' }}>
            {AGENTS.map(agent => {
              const isLoading = agentLoading === agent.id
              const result    = agentResults[agent.id]
              return (
                <div key={agent.id} className="card" style={{ padding:'14px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:result?'10px':0 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'700', fontSize:'13.5px', marginBottom:'2px' }}>{agent.label}</div>
                      <div style={{ fontSize:'11.5px', color:'#9CA3AF' }}>{agent.desc}</div>
                    </div>
                    <button onClick={() => runAgent(agent.id)} disabled={!!agentLoading} className="btn btn-sm" style={{
                      background: isLoading?'#F3F4F6':result?'#F0FDF4':'#1B3A6B',
                      color: isLoading?'#9CA3AF':result?'#059669':'white', flexShrink:0,
                      border: result?'1.5px solid #BBF7D0':'none',
                    }}>
                      {isLoading ? <><span className="spinner" style={{ width:'12px', height:'12px', borderWidth:'2px' }}/> En cours</> :
                       result ? <><Check size={13}/> Relancer</> :
                       <><Zap size={13}/> Lancer</>}
                    </button>
                  </div>
                  {result?.output && (
                    <div style={{ background:'#F9FAFB', borderRadius:'8px', padding:'10px', marginTop:'8px' }}>
                      {agent.id === 'analyze_profile' && result.output.summaryFr && <p style={{ fontSize:'12px', color:'#374151', lineHeight:'1.5' }}>{result.output.summaryFr}</p>}
                      {agent.id === 'assist_admin' && result.output.suggestedAction && (
                        <div>
                          <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px' }}>Action suggérée :</div>
                          <p style={{ fontSize:'12px', color:'#374151', lineHeight:'1.5' }}>{result.output.suggestedAction}</p>
                          <div style={{ fontSize:'11px', color:'#F97316', marginTop:'4px', fontWeight:'600' }}>Priorité : {result.output.priority}</div>
                        </div>
                      )}
                      {(agent.id==='generate_cv_fr'||agent.id==='generate_cv_it') && result.output.cvText && (
                        <div>
                          <p style={{ fontSize:'12px', color:'#374151', lineHeight:'1.5', marginBottom:'8px' }}>{result.output.cvText.slice(0,200)}...</p>
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                            <button onClick={() => downloadCV(agent.id.endsWith('fr')?'fr':'it')} className="btn btn-sm" style={{ background:'#1B3A6B', color:'white', fontSize:'11px' }}>
                              <Download size={12}/> Télécharger CV
                            </button>
                            <button onClick={() => {window.open('https://it.indeed.com','_blank')}} className="btn btn-secondary btn-sm" style={{ fontSize:'11px' }}>
                              <ExternalLink size={12}/> Indeed.it
                            </button>
                          </div>
                        </div>
                      )}
                      {agent.id==='generate_checklist' && result.output.missingDocuments && (
                        <div>
                          <div style={{ fontSize:'11px', fontWeight:'700', color:'#EF4444', marginBottom:'4px' }}>{result.output.missingDocuments.length} document(s) manquant(s)</div>
                          {result.output.missingDocuments.slice(0,3).map((doc: string, i: number) => <div key={i} style={{ fontSize:'12px', color:'#374151' }}>• {doc}</div>)}
                        </div>
                      )}
                      {!['analyze_profile','assist_admin','generate_cv_fr','generate_cv_it','generate_checklist'].includes(agent.id) && (
                        <div style={{ fontSize:'12px', color:'#059669', fontWeight:'600' }}>✅ Résultat sauvegardé dans Firestore</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB MESSAGES */}
      {tab === 'messages' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <div style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', height:'380px', overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {msgs.length === 0 ? (
              <div className="empty" style={{ flex:1 }}>
                <div className="empty-icon"><MessageCircle size={22} color="#9CA3AF"/></div>
                <h3>Aucun message</h3>
                <p>Envoyez le premier message à ce candidat.</p>
              </div>
            ) : (
              msgs.map(msg => {
                const isAdmin = msg.expediteur === 'admin' || msg.expediteur === 'ia'
                return (
                  <div key={msg.id} style={{ display:'flex', gap:'8px', flexDirection:isAdmin?'row-reverse':'row', alignItems:'flex-end' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'10px', background:isAdmin?'#1B3A6B':msg.expediteur==='ia'?'#F5F3FF':'#F3F4F6', color:isAdmin?'white':msg.expediteur==='ia'?'#7C3AED':'#374151' }}>
                      {isAdmin?'A':msg.expediteur==='ia'?'🤖':'C'}
                    </div>
                    <div style={{ maxWidth:'70%', display:'flex', flexDirection:'column', gap:'3px', alignItems:isAdmin?'flex-end':'flex-start' }}>
                      <div style={{ padding:'10px 13px', borderRadius:isAdmin?'13px 13px 3px 13px':'13px 13px 13px 3px', background:isAdmin?'#1B3A6B':msg.expediteur==='ia'?'#F5F3FF':'#F3F4F6', color:isAdmin?'white':msg.expediteur==='ia'?'#5B21B6':'#111827', fontSize:'13.5px', lineHeight:'1.5' }}>
                        {msg.contenu}
                      </div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF' }}>{msg.nom_expediteur}</div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef}/>
          </div>
          <div style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'12px', padding:'10px', display:'flex', gap:'8px', alignItems:'flex-end' }}>
            <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg()}}}
              placeholder="Écrire un message au candidat... (Entrée pour envoyer)" rows={2}
              style={{ flex:1, border:'none', resize:'none', fontSize:'14px', lineHeight:'1.5', fontFamily:'inherit', color:'#111827', padding:'2px 0' }}/>
            <button onClick={sendMsg} disabled={!newMsg.trim()||sendingMsg} className="btn btn-primary btn-icon" style={{ flexShrink:0 }}>
              {sendingMsg?<Loader2 size={16} style={{animation:'spin 0.7s linear infinite'}}/>:<Send size={16}/>}
            </button>
          </div>
        </div>
      )}

      {/* TAB STATUT */}
      {tab === 'statut' && (
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom:'12px' }}>Changer le statut du dossier</h2>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
              <select value={newStatut} onChange={e=>setNewStatut(e.target.value)} style={{ flex:1, minWidth:'200px' }}>
                {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABEL[s]??s}</option>)}
              </select>
              <button onClick={saveStatut} disabled={saving||newStatut===dossier?.statut} className="btn btn-primary">
                {saving?<><span className="spinner spinner-white" style={{width:'14px',height:'14px',borderWidth:'2px'}}/>Sauvegarde...</>:<><Save size={14}/>Appliquer</>}
              </button>
            </div>
          </div>
          <hr className="divider" />
          <div>
            <h3 style={{ fontWeight:'700', fontSize:'14px', marginBottom:'8px' }}>Priorité</h3>
            <button onClick={toggleUrgent} className="btn btn-sm" style={{ background:dossier?.is_urgent?'#FFF1F2':'#F3F4F6', color:dossier?.is_urgent?'#EF4444':'#374151', border:`1.5px solid ${dossier?.is_urgent?'#FECACA':'#E4E8EF'}` }}>
              <Flame size={13}/> {dossier?.is_urgent?'🔥 Dossier URGENT — Cliquer pour retirer':'Marquer comme urgent'}
            </button>
          </div>
          <hr className="divider" />
          <div className="alert alert-warning" style={{ fontSize:'12px' }}>
            ⚠️ <strong>Rappel conformité :</strong> Ne promettre ni emploi, ni visa, ni nulla osta dans vos communications. ItalianiPro = accompagnement documentaire uniquement.
          </div>
        </div>
      )}
    </div>
  )
}
