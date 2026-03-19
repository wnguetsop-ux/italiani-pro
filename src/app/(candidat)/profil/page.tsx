'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PAYS = ['Cameroun','Sénégal',"Côte d'Ivoire",'Mali','Guinée','Bénin','Togo','Gabon','Congo RDC','Congo Brazza','Nigeria','Ghana','Burkina Faso','Autre']
const SECTEURS = [
  {v:'agriculture', l:'🌾 Agriculture / Saisonniers'},
  {v:'tourisme',    l:'🏨 Tourisme / Hôtellerie'},
  {v:'construction',l:'🏗️ Construction / BTP'},
  {v:'soins',       l:'🏥 Aide à domicile / Soins'},
  {v:'industrie',   l:'🏭 Industrie / Transport'},
  {v:'autre',       l:'🔧 Autre secteur'},
]
const NIVEAUX = [
  {v:'',          l:'— Choisir —'},
  {v:'aucun',     l:'Sans diplôme'},
  {v:'bepc',      l:'BEPC / Brevet'},
  {v:'bac',       l:'Baccalauréat'},
  {v:'bts',       l:'BTS / DUT'},
  {v:'licence',   l:'Licence / Bachelor'},
  {v:'master',    l:'Master'},
  {v:'doctorat',  l:'Doctorat'},
  {v:'formation', l:'Formation professionnelle'},
]

export default function ProfilPage() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [user, setUser]         = useState({ full_name:'', email:'', phone:'', country_code:'Cameroun' })
  const [dossier, setDossier]   = useState({ profession:'', annees_experience:'0', niveau_etudes:'', langues:'', secteur_cible:'', region_italie:'', experiences:'', competences:'' })
  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) return
    Promise.all([getDoc(doc(db, 'users', uid)), getDoc(doc(db, 'dossiers', uid))]).then(([u, d]) => {
      if (u.exists()) {
        const data = u.data()
        setUser({ full_name: data.full_name??'', email: data.email??'', phone: data.phone??'', country_code: data.country_code??'Cameroun' })
      }
      if (d.exists()) {
        const data = d.data()
        setDossier({
          profession:         data.profession??'',
          annees_experience:  String(data.annees_experience??0),
          niveau_etudes:      data.niveau_etudes??'',
          langues:            Array.isArray(data.langues) ? data.langues.join(', ') : (data.langues??''),
          secteur_cible:      data.secteur_cible??'',
          region_italie:      data.region_italie??'',
          experiences:        data.experiences??'',
          competences:        data.competences??'',
        })
      }
      setLoading(false)
    })
  }, [uid])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', uid), {
        full_name:    user.full_name.trim(),
        phone:        user.phone.trim(),
        country_code: user.country_code,
        updated_at:   serverTimestamp(),
      })
      await updateDoc(doc(db, 'dossiers', uid), {
        profession:        dossier.profession.trim(),
        annees_experience: parseInt(dossier.annees_experience) || 0,
        niveau_etudes:     dossier.niveau_etudes,
        langues:           dossier.langues.split(',').map(s => s.trim()).filter(Boolean),
        secteur_cible:     dossier.secteur_cible,
        region_italie:     dossier.region_italie.trim(),
        experiences:       dossier.experiences.trim(),
        competences:       dossier.competences.trim(),
        updated_at:        serverTimestamp(),
      })
      toast.success('✅ Profil enregistré !')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
      <span className="spinner" /> Chargement de votre profil...
    </div>
  )

  const su = (k: keyof typeof user) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setUser(v => ({ ...v, [k]: e.target.value }))

  const sd = (k: keyof typeof dossier) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setDossier(v => ({ ...v, [k]: e.target.value }))

  const Section = ({ title, sub, children }: any) => (
    <div className="card">
      <div style={{ marginBottom:'18px' }}>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'14px' }}>
        {children}
      </div>
    </div>
  )

  const Field = ({ label, children }: any) => (
    <div><label className="field-label">{label}</label>{children}</div>
  )

  const FieldFull = ({ label, children }: any) => (
    <div style={{ gridColumn:'1/-1' }}><label className="field-label">{label}</label>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }} className="fade-up">
      <div className="page-header">
        <h1>Mon profil</h1>
        <p>Ces informations permettent à votre équipe de préparer un dossier personnalisé</p>
      </div>

      <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

        <Section title="Informations personnelles" sub="Vos coordonnées de contact">
          <Field label="Nom complet *">
            <input type="text" value={user.full_name} onChange={su('full_name')} placeholder="Votre nom complet" required />
          </Field>
          <Field label="Email">
            <input type="email" value={user.email} readOnly style={{ background:'#F9FAFB', cursor:'not-allowed', color:'#9CA3AF' }} />
          </Field>
          <Field label="Téléphone / WhatsApp">
            <input type="tel" value={user.phone} onChange={su('phone')} placeholder="+237 6XX XXX XXX" />
          </Field>
          <Field label="Pays de résidence">
            <select value={user.country_code} onChange={su('country_code')}>
              {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Situation professionnelle" sub="Votre parcours et vos compétences">
          <Field label="Profession actuelle">
            <input type="text" value={dossier.profession} onChange={sd('profession')} placeholder="Ex: Aide-soignante, Agriculteur, Maçon..." />
          </Field>
          <Field label="Années d'expérience">
            <select value={dossier.annees_experience} onChange={sd('annees_experience')}>
              {Array.from({length:21}, (_, i) => <option key={i} value={i}>{i} an{i>1?'s':''}</option>)}
            </select>
          </Field>
          <Field label="Niveau d'études">
            <select value={dossier.niveau_etudes} onChange={sd('niveau_etudes')}>
              {NIVEAUX.map(n => <option key={n.v} value={n.v}>{n.l}</option>)}
            </select>
          </Field>
          <Field label="Langues parlées">
            <input type="text" value={dossier.langues} onChange={sd('langues')} placeholder="Français, Anglais, Ewondo..." />
          </Field>
          <FieldFull label="Expériences professionnelles (décrivez librement)">
            <textarea
              value={dossier.experiences}
              onChange={sd('experiences')}
              placeholder="Décrivez vos expériences : postes occupés, durée, responsabilités... Vous pouvez écrire librement ou coller depuis un document."
              style={{ minHeight:'110px' }}
            />
          </FieldFull>
          <FieldFull label="Compétences et formations">
            <textarea
              value={dossier.competences}
              onChange={sd('competences')}
              placeholder="Listez vos compétences : conduite de tracteur, soins aux personnes âgées, gestion d'équipe, permis B, certifications..."
              style={{ minHeight:'90px' }}
            />
          </FieldFull>
        </Section>

        <Section title="Projet en Italie" sub="Où et dans quel secteur souhaitez-vous travailler ?">
          <Field label="Secteur ciblé en Italie">
            <select value={dossier.secteur_cible} onChange={sd('secteur_cible')}>
              <option value="">— Choisir un secteur —</option>
              {SECTEURS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>
          <Field label="Région d'Italie ciblée (optionnel)">
            <input type="text" value={dossier.region_italie} onChange={sd('region_italie')} placeholder="Ex: Toscane, Sicile, Lombardie..." />
          </Field>
        </Section>

        <div className="alert alert-warning">
          <div>🔒 Vos données sont stockées de façon sécurisée sur Firebase. Vous pouvez les modifier à tout moment ou demander leur suppression en nous contactant.</div>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer mon profil</>}
        </button>
      </form>
    </div>
  )
}
