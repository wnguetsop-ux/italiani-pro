'use client'
import { useEffect, useRef, useState } from 'react'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Save, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

// ─── IMPORTANT ────────────────────────────────────────────
// On utilise des inputs NON-contrôlés (defaultValue + ref)
// pour éviter le bug clavier mobile qui se ferme à chaque frappe.
// On collecte les valeurs seulement au moment de la soumission.
// ──────────────────────────────────────────────────────────

const PAYS = [
  'Cameroun','Sénégal',"Côte d'Ivoire",'Mali','Guinée Conakry','Bénin',
  'Togo','Gabon','Congo RDC','Congo Brazza','Nigeria','Ghana','Burkina Faso',
  'Niger','Tchad','Madagascar','Autre pays',
]
const SECTEURS = [
  { v:'agriculture', l:'🌾 Agriculture / Saisonniers'  },
  { v:'tourisme',    l:'🏨 Tourisme / Hôtellerie'      },
  { v:'construction',l:'🏗️ Construction / BTP'         },
  { v:'soins',       l:'🏥 Aide à domicile / Soins'    },
  { v:'industrie',   l:'🏭 Industrie / Transport'      },
  { v:'autre',       l:'🔧 Autre secteur'              },
]
const NIVEAUX = [
  { v:'',          l:'— Choisir —'                 },
  { v:'aucun',     l:'Sans diplôme'                },
  { v:'bepc',      l:'BEPC / Brevet'               },
  { v:'bac',       l:'Baccalauréat'                },
  { v:'bts',       l:'BTS / Licence pro'           },
  { v:'licence',   l:'Licence / Bachelor'          },
  { v:'master',    l:'Master'                      },
  { v:'formation', l:'Formation professionnelle'   },
]

export default function ProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Refs pour chaque champ — valeurs initiales chargées une seule fois
  const refs = {
    full_name:    useRef<HTMLInputElement>(null),
    phone:        useRef<HTMLInputElement>(null),
    country:      useRef<HTMLSelectElement>(null),
    profession:   useRef<HTMLInputElement>(null),
    annees:       useRef<HTMLSelectElement>(null),
    niveau:       useRef<HTMLSelectElement>(null),
    langues:      useRef<HTMLInputElement>(null),
    secteur:      useRef<HTMLSelectElement>(null),
    region:       useRef<HTMLInputElement>(null),
    experiences:  useRef<HTMLTextAreaElement>(null),
    competences:  useRef<HTMLTextAreaElement>(null),
  }

  const [email, setEmail]   = useState('')
  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'dossiers', uid)),
    ]).then(([uSnap, dSnap]) => {
      const u = uSnap.data() ?? {}
      const d = dSnap.data() ?? {}

      setEmail(u.email ?? '')

      // Remplir les refs après le rendu
      setTimeout(() => {
        if (refs.full_name.current)   refs.full_name.current.value   = u.full_name    ?? ''
        if (refs.phone.current)       refs.phone.current.value       = u.phone        ?? ''
        if (refs.country.current)     refs.country.current.value     = u.country_code ?? 'Cameroun'
        if (refs.profession.current)  refs.profession.current.value  = d.profession   ?? ''
        if (refs.annees.current)      refs.annees.current.value      = String(d.annees_experience ?? 0)
        if (refs.niveau.current)      refs.niveau.current.value      = d.niveau_etudes ?? ''
        if (refs.langues.current)     refs.langues.current.value     = Array.isArray(d.langues) ? d.langues.join(', ') : (d.langues ?? '')
        if (refs.secteur.current)     refs.secteur.current.value     = d.secteur_cible ?? ''
        if (refs.region.current)      refs.region.current.value      = d.region_italie ?? ''
        if (refs.experiences.current) refs.experiences.current.value = d.experiences   ?? ''
        if (refs.competences.current) refs.competences.current.value = d.competences   ?? ''
      }, 0)
    }).finally(() => setLoading(false))
  }, [uid])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    setSaving(true)
    setSaved(false)
    try {
      const full_name = refs.full_name.current?.value.trim() ?? ''
      if (!full_name) { toast.error('Le nom est obligatoire'); setSaving(false); return }

      await updateDoc(doc(db, 'users', uid), {
        full_name,
        phone:        refs.phone.current?.value.trim()   ?? '',
        country_code: refs.country.current?.value        ?? 'Cameroun',
        updated_at:   serverTimestamp(),
      })

      const langues = (refs.langues.current?.value ?? '')
        .split(',').map(s => s.trim()).filter(Boolean)

      await setDoc(doc(db, 'dossiers', uid), {
        uid,
        profession:        refs.profession.current?.value.trim()  ?? '',
        annees_experience: parseInt(refs.annees.current?.value    ?? '0') || 0,
        niveau_etudes:     refs.niveau.current?.value             ?? '',
        langues,
        secteur_cible:     refs.secteur.current?.value            ?? '',
        region_italie:     refs.region.current?.value.trim()      ?? '',
        experiences:       refs.experiences.current?.value.trim() ?? '',
        competences:       refs.competences.current?.value.trim() ?? '',
        updated_at:        serverTimestamp(),
      }, { merge: true })

      setSaved(true)
      toast.success('✅ Profil enregistré !')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      toast.error('Erreur. Vérifiez votre connexion.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement...
    </div>
  )

  const inp = {
    style: {
      width:'100%', border:'1.5px solid #E4E8EF', borderRadius:'10px',
      padding:'11px 14px', fontSize:'16px', fontFamily:'inherit',
      background:'white', color:'#111827', boxSizing:'border-box' as const,
    }
  }

  return (
    <div style={{ maxWidth:'680px' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 4px' }}>Mon profil</h1>
        <p style={{ color:'#6B7280', fontSize:'14px', margin:0 }}>Ces informations aident votre équipe à préparer un dossier personnalisé</p>
      </div>

      <form onSubmit={save} autoComplete="off">

        {/* Infos personnelles */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>
            👤 Informations personnelles
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
                Nom complet *
              </label>
              <input ref={refs.full_name} type="text" {...inp} placeholder="Votre nom complet" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Email</label>
              <input value={email} readOnly {...inp} style={{ ...inp.style, background:'#F9FAFB', color:'#9CA3AF', cursor:'not-allowed' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
                Téléphone / WhatsApp
              </label>
              <input ref={refs.phone} type="tel" {...inp} placeholder="+237 6XX XXX XXX" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Pays</label>
              <select ref={refs.country} {...inp}>
                {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Situation pro */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>
            💼 Situation professionnelle
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Profession actuelle</label>
              <input ref={refs.profession} type="text" {...inp} placeholder="Ex: Aide-soignante, Maçon, Agriculteur..." autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Années d'expérience</label>
              <select ref={refs.annees} {...inp}>
                {Array.from({length:21},(_,i)=><option key={i} value={i}>{i} an{i>1?'s':''}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Niveau d'études</label>
              <select ref={refs.niveau} {...inp}>
                {NIVEAUX.map(n=><option key={n.v} value={n.v}>{n.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Langues parlées</label>
              <input ref={refs.langues} type="text" {...inp} placeholder="Ex: Français, Anglais, Ewondo" autoComplete="off" />
            </div>
          </div>
          <div style={{ marginTop:'14px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
              Expériences professionnelles <span style={{ color:'#9CA3AF', fontWeight:'400' }}>(décrivez librement)</span>
            </label>
            <textarea ref={refs.experiences} {...inp}
              style={{ ...inp.style, minHeight:'110px', resize:'vertical', lineHeight:'1.6' }}
              placeholder="Décrivez vos expériences : postes occupés, durée, entreprises, responsabilités...&#10;Vous pouvez aussi coller votre CV ici." />
          </div>
          <div style={{ marginTop:'14px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
              Compétences et formations
            </label>
            <textarea ref={refs.competences} {...inp}
              style={{ ...inp.style, minHeight:'90px', resize:'vertical', lineHeight:'1.6' }}
              placeholder="Ex: Conduite de tracteur, soins aux personnes âgées, permis B, certifications..." />
          </div>
        </div>

        {/* Projet Italie */}
        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>
            🇮🇹 Votre projet en Italie
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Secteur ciblé</label>
              <select ref={refs.secteur} {...inp}>
                <option value="">— Choisir un secteur —</option>
                {SECTEURS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Région d'Italie souhaitée</label>
              <input ref={refs.region} type="text" {...inp} placeholder="Ex: Toscane, Sicile, Lombardie..." autoComplete="off" />
            </div>
          </div>
        </div>

        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'12px 14px', fontSize:'12px', color:'#92400E', marginBottom:'16px' }}>
          🔒 Vos données sont sécurisées sur Firebase. Vous pouvez demander leur suppression à tout moment en nous contactant.
        </div>

        <button type="submit" disabled={saving} style={{
          width:'100%', padding:'14px', background: saved?'#059669':'#1B3A6B',
          color:'white', border:'none', borderRadius:'12px', fontWeight:'700',
          fontSize:'15px', cursor: saving?'wait':'pointer', display:'flex',
          alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit',
          transition:'background 0.3s',
        }}>
          {saving
            ? <><span className="spinner spinner-white" /> Enregistrement...</>
            : saved
            ? <><CheckCircle size={17} /> Profil enregistré !</>
            : <><Save size={17} /> Enregistrer mon profil</>
          }
        </button>
      </form>
    </div>
  )
}
