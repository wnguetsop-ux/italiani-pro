'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const TYPES = [
  { v:'cv',              l:'📄 CV / Curriculum Vitae',              hint:'Collez votre CV ou décrivez vos expériences professionnelles' },
  { v:'experiences',     l:'💼 Expériences professionnelles',        hint:'Décrivez vos postes, durées, missions, employeurs...' },
  { v:'competences',     l:'🛠️ Compétences et formations',           hint:'Listez vos compétences techniques, formations, certifications...' },
  { v:'lettre_motiv',    l:'✉️ Lettre de motivation',                hint:'Écrivez ou collez votre lettre de motivation' },
  { v:'description_doc', l:'📋 Description d\'un document officiel', hint:'Décrivez le contenu d\'un document que vous ne pouvez pas scanner' },
  { v:'autre',           l:'📝 Autre (texte libre)',                  hint:'Tout autre information utile pour votre dossier' },
]

const MODELES: Record<string, string> = {
  cv: `NOM COMPLET : 
DATE DE NAISSANCE : 
NATIONALITÉ : 
VILLE DE RÉSIDENCE : 
TÉLÉPHONE / WHATSAPP : 
EMAIL : 

═══ FORMATION ═══
[Décrivez vos études, diplômes, années...]

═══ EXPÉRIENCES PROFESSIONNELLES ═══
[Décrivez chaque poste : titre, employeur, ville, dates, missions]

═══ COMPÉTENCES ═══
[Listez vos compétences techniques et professionnelles]

═══ LANGUES ═══
Français : [niveau]
Anglais : [niveau]
Autres : 

═══ OBJECTIF PROFESSIONNEL EN ITALIE ═══
Secteur ciblé : 
Région souhaitée : 
Disponibilité : `,
  experiences: `EXPÉRIENCE 1
Poste : 
Employeur / Entreprise : 
Ville / Pays : 
Période : de [mois/année] à [mois/année]
Missions principales :
- 
- 

EXPÉRIENCE 2
Poste : 
Employeur / Entreprise : 
Ville / Pays : 
Période : de [mois/année] à [mois/année]
Missions principales :
- 
- `,
  competences: `MES COMPÉTENCES ET FORMATIONS

Compétences techniques :
- 
- 

Formations / Certifications :
- 
- 

Permis et licences :
- 

Outils / Machines maîtrisés :
- 

Langues parlées :
- Français : 
- Anglais : 
- Autres : `,
}

export default function NouveauDocPage() {
  const router = useRouter()
  const [type, setType]     = useState('')
  const [nom, setNom]       = useState('')
  const [texte, setTexte]   = useState('')
  const [saving, setSaving] = useState(false)
  const uid = auth.currentUser?.uid

  const selectedType = TYPES.find(t => t.v === type)

  function insertModel() {
    if (MODELES[type]) setTexte(MODELES[type])
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!type) { toast.error('Choisissez le type de document'); return }
    if (!texte.trim()) { toast.error('Le contenu ne peut pas être vide'); return }
    if (!uid) return
    setSaving(true)
    try {
      const docNom = nom.trim() || TYPES.find(t => t.v === type)?.l.replace(/^[^\s]+ /, '') || 'Document'
      await addDoc(collection(db, 'documents'), {
        uid, nom: docNom, type_doc: type, content_text: texte.trim(),
        statut: 'uploade', file_url: null,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      })
      toast.success('✅ Document enregistré !')
      router.push('/documents')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px', maxWidth:'680px' }} className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <Link href="/documents" className="btn btn-secondary btn-icon btn-sm"><ArrowLeft size={16} /></Link>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Écrire / Coller un document</h1>
          <p>Pas de fichier ? Décrivez votre contenu directement</p>
        </div>
      </div>

      <div className="alert alert-info">
        <div>💡 <strong>Comment utiliser cette page :</strong> Choisissez le type de document, puis écrivez ou copiez-collez votre contenu. Notre équipe et notre IA vont traiter et améliorer ce texte pour vous.</div>
      </div>

      <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        <div className="card">
          <label className="field-label">Type de document *</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'8px', marginTop:'4px' }}>
            {TYPES.map(t => (
              <button key={t.v} type="button" onClick={() => setType(t.v)} style={{
                padding:'10px 12px', borderRadius:'9px', border: type===t.v?'2px solid #1B3A6B':'1.5px solid #E4E8EF',
                background: type===t.v?'#EBF0FF':'white', cursor:'pointer', textAlign:'left',
                fontSize:'13px', fontWeight: type===t.v?'600':'400', color: type===t.v?'#1B3A6B':'#374151',
                transition:'all 0.15s',
              }}>
                {t.l}
              </button>
            ))}
          </div>
          {selectedType && <p style={{ fontSize:'12px', color:'#6B7280', marginTop:'8px', padding:'8px', background:'#F9FAFB', borderRadius:'7px' }}>ℹ️ {selectedType.hint}</p>}
        </div>

        <div className="card">
          <label className="field-label">Nom du document (optionnel)</label>
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Mon CV 2025, Mes expériences agricoles..." />
        </div>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <label className="field-label" style={{ marginBottom:0 }}>Contenu *</label>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{texte.length} caractères</span>
              {MODELES[type] && (
                <button type="button" onClick={insertModel} className="btn btn-secondary btn-sm">
                  Insérer un modèle
                </button>
              )}
            </div>
          </div>
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder={
              type === 'cv'          ? 'Collez votre CV ici, ou décrivez votre parcours...\n\nVous pouvez aussi cliquer sur "Insérer un modèle" pour obtenir une structure à remplir.' :
              type === 'experiences' ? 'Décrivez vos expériences professionnelles...\n\nEx: J\'ai travaillé 3 ans comme agriculteur au Cameroun. J\'ai géré une équipe de 5 personnes...' :
              type === 'competences' ? 'Listez vos compétences...\n\nEx: Conduite de tracteur, récolte de fruits, soins aux personnes âgées, permis B...' :
              'Écrivez ou collez votre contenu ici...'
            }
            style={{ minHeight:'280px', fontFamily:'monospace', fontSize:'13px', lineHeight:'1.7' }}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving || !type || !texte.trim()}>
          {saving
            ? <><Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> Enregistrement...</>
            : <><CheckCircle size={16} /> Enregistrer ce document</>
          }
        </button>

        <p style={{ textAlign:'center', fontSize:'12px', color:'#9CA3AF', lineHeight:'1.5' }}>
          Ce contenu sera transmis à votre équipe ItalianiPro pour être traité et optimisé par notre IA.
        </p>
      </form>
    </div>
  )
}
