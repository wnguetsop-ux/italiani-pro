'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { auth, db } from '@/lib/firebase'
import { recordCandidateActivity } from '@/lib/backoffice-data'

const TYPES = [
  { v: 'cv', l: 'CV / Curriculum Vitae', hint: 'Collez votre CV ou decrivez vos experiences professionnelles' },
  { v: 'experiences', l: 'Experiences professionnelles', hint: 'Decrivez vos postes, durees, missions, employeurs...' },
  { v: 'competences', l: 'Competences et formations', hint: 'Listez vos competences techniques, formations, certifications...' },
  { v: 'lettre_motiv', l: 'Lettre de motivation', hint: 'Ecrivez ou collez votre lettre de motivation' },
  { v: 'description_doc', l: 'Description d un document officiel', hint: 'Decrivez le contenu d un document que vous ne pouvez pas scanner' },
  { v: 'autre', l: 'Autre (texte libre)', hint: 'Toute autre information utile pour votre dossier' },
]

const MODELES: Record<string, string> = {
  cv: `NOM COMPLET :
DATE DE NAISSANCE :
NATIONALITE :
VILLE DE RESIDENCE :
TELEPHONE / WHATSAPP :
EMAIL :

FORMATION
[Decrivez vos etudes, diplomes, annees...]

EXPERIENCES PROFESSIONNELLES
[Decrivez chaque poste : titre, employeur, ville, dates, missions]

COMPETENCES
[Listez vos competences techniques et professionnelles]

LANGUES
Francais :
Anglais :
Autres :

OBJECTIF PROFESSIONNEL EN ITALIE
Secteur cible :
Region souhaitee :
Disponibilite :`,
  experiences: `EXPERIENCE 1
Poste :
Employeur / Entreprise :
Ville / Pays :
Periode :
Missions principales :
- 
- 

EXPERIENCE 2
Poste :
Employeur / Entreprise :
Ville / Pays :
Periode :
Missions principales :
- 
- `,
  competences: `MES COMPETENCES ET FORMATIONS

Competences techniques :
- 
- 

Formations / Certifications :
- 
- 

Permis et licences :
- 

Outils / Machines maitrises :
- 

Langues parlees :
- Francais :
- Anglais :
- Autres :`,
}

export default function NouveauDocPage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [authReady, setAuthReady] = useState(Boolean(auth.currentUser))
  const [type, setType] = useState('')
  const [nom, setNom] = useState('')
  const [texte, setTexte] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  const selectedType = TYPES.find((item) => item.v === type)

  function insertModel() {
    if (MODELES[type]) setTexte(MODELES[type])
  }

  function runPostSaveSync(candidateId: string, description: string) {
    void (async () => {
      const actorName = auth.currentUser?.displayName || 'Candidat'
      const results = await Promise.allSettled([
        updateDoc(doc(db, 'dossiers', candidateId), {
          workflow_status: 'TO_REVIEW',
          statut: 'en_verification',
          next_action: 'Verifier les nouveaux documents recus',
          next_action_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        }),
        recordCandidateActivity({
          candidateId,
          type: 'document_received',
          title: 'Document texte recu',
          description,
          actorName,
          actorRole: 'candidat',
        }),
      ])

      for (const result of results) {
        if (result.status === 'rejected') {
          console.warn('post-save-sync-warning', result.reason)
        }
      }
    })()
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!type) {
      toast.error('Choisissez le type de document')
      return
    }
    if (!texte.trim()) {
      toast.error('Le contenu ne peut pas etre vide')
      return
    }
    if (!authReady) {
      toast.error('Session en cours de chargement. Reessayez dans quelques secondes.')
      return
    }
    if (!uid) {
      toast.error('Session introuvable. Reconnectez-vous puis reessayez.')
      return
    }

    setSaving(true)
    try {
      const docNom = nom.trim() || TYPES.find((item) => item.v === type)?.l || 'Document'
      await addDoc(collection(db, 'documents'), {
        uid,
        nom: docNom,
        type_doc: type,
        content_text: texte.trim(),
        doc_type: type,
        workflow_status: 'RECEIVED',
        source_language: 'fr',
        translated_language: '',
        final_version: false,
        statut: 'uploade',
        file_url: null,
        received_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      toast.success('Document enregistre')
      runPostSaveSync(uid, docNom)
      router.push('/documents')
    } catch (error) {
      console.error('text-document-save-error', error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/documents" className="btn btn-secondary btn-icon btn-sm">
          <ArrowLeft size={16} />
        </Link>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Ecrire / Coller un document</h1>
          <p>Pas de fichier ? Decrivez votre contenu directement</p>
        </div>
      </div>

      <div className="alert alert-info">
        <div><strong>Comment utiliser cette page :</strong> choisissez le type de document, puis ecrivez ou copiez-collez votre contenu.</div>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card">
          <label className="field-label">Type de document *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginTop: '4px' }}>
            {TYPES.map((item) => (
              <button
                key={item.v}
                type="button"
                onClick={() => setType(item.v)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  border: type === item.v ? '2px solid #1B3A6B' : '1.5px solid #E4E8EF',
                  background: type === item.v ? '#EBF0FF' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: type === item.v ? '600' : '400',
                  color: type === item.v ? '#1B3A6B' : '#374151',
                  transition: 'all 0.15s',
                }}
              >
                {item.l}
              </button>
            ))}
          </div>
          {selectedType ? <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', padding: '8px', background: '#F9FAFB', borderRadius: '7px' }}>{selectedType.hint}</p> : null}
        </div>

        <div className="card">
          <label className="field-label">Nom du document (optionnel)</label>
          <input type="text" value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Ex: Mon CV 2025, Mes experiences agricoles..." />
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>Contenu *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{texte.length} caracteres</span>
              {MODELES[type] ? (
                <button type="button" onClick={insertModel} className="btn btn-secondary btn-sm">
                  Inserer un modele
                </button>
              ) : null}
            </div>
          </div>
          <textarea
            value={texte}
            onChange={(event) => setTexte(event.target.value)}
            placeholder="Ecrivez ou collez votre contenu ici..."
            style={{ minHeight: '280px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.7' }}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving || !type || !texte.trim() || !authReady}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Enregistrement...</> : <><CheckCircle size={16} /> Enregistrer ce document</>}
        </button>
      </form>
    </div>
  )
}
