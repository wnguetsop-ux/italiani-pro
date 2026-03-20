'use client'

import { useEffect, useRef, useState } from 'react'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Save, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const PAYS = [
  'Cameroun','Senegal',"Cote d'Ivoire",'Mali','Guinee Conakry','Benin',
  'Togo','Gabon','Congo RDC','Congo Brazza','Nigeria','Ghana','Burkina Faso',
  'Niger','Tchad','Madagascar','Autre pays',
]

const SECTEURS = [
  { v:'agriculture', l:'Agriculture / Saisonniers' },
  { v:'tourisme', l:'Tourisme / Hotellerie' },
  { v:'construction', l:'Construction / BTP' },
  { v:'soins', l:'Aide a domicile / Soins' },
  { v:'industrie', l:'Industrie / Logistique' },
  { v:'services', l:'Services / Nettoyage' },
  { v:'autre', l:'Autre secteur' },
]

const NIVEAUX = [
  { v:'', l:'Choisir' },
  { v:'aucun', l:'Sans diplome' },
  { v:'bepc', l:'BEPC / Brevet' },
  { v:'bac', l:'Baccalaureat' },
  { v:'bts', l:'BTS / Licence pro' },
  { v:'licence', l:'Licence / Bachelor' },
  { v:'master', l:'Master' },
  { v:'formation', l:'Formation professionnelle' },
]

const METIERS = [
  'Ouvrier agricole',
  'Cueilleur / Recolte',
  'Serveur',
  'Commis de cuisine',
  'Femme de chambre',
  'Receptionniste',
  'Aide a domicile',
  'Auxiliaire de vie',
  'Magasinier',
  'Cariste',
  'Ouvrier d usine',
  'Preparateur de commandes',
  'Chauffeur livreur',
  'Macon',
  'Electricien',
  'Plombier',
  'Soudeur',
  'Peintre batiment',
  'Jardinier',
  'Agent de nettoyage',
]

const REGIONS_ITALIE = [
  'Lombardia','Veneto','Emilia-Romagna','Piemonte','Lazio','Toscana','Campania',
  'Puglia','Sicilia','Calabria','Sardegna','Liguria','Friuli-Venezia Giulia',
  'Trentino-Alto Adige','Marche','Abruzzo','Umbria','Molise','Basilicata',
]

const AVAILABILITY_OPTIONS = [
  { v:'immediate', l:'Disponible immediatement' },
  { v:'30_jours', l:'Disponible sous 30 jours' },
  { v:'60_jours', l:'Disponible sous 60 jours' },
  { v:'90_jours', l:'Disponible sous 90 jours' },
]

const DRIVING_LICENSE_OPTIONS = [
  { v:'', l:'Aucun / non precise' },
  { v:'aucun', l:'Aucun permis' },
  { v:'b', l:'Permis B' },
  { v:'c', l:'Permis C' },
  { v:'ce', l:'Permis CE / poids lourd' },
  { v:'engin', l:'Engins / tracteur / chariot' },
]

export default function ProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')
  const uid = auth.currentUser?.uid

  const fullNameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const countryRef = useRef<HTMLSelectElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const professionRef = useRef<HTMLInputElement>(null)
  const targetJobRef = useRef<HTMLInputElement>(null)
  const yearsRef = useRef<HTMLSelectElement>(null)
  const levelRef = useRef<HTMLSelectElement>(null)
  const languagesRef = useRef<HTMLInputElement>(null)
  const sectorRef = useRef<HTMLSelectElement>(null)
  const regionRef = useRef<HTMLInputElement>(null)
  const availabilityRef = useRef<HTMLSelectElement>(null)
  const drivingLicenseRef = useRef<HTMLSelectElement>(null)
  const experiencesRef = useRef<HTMLTextAreaElement>(null)
  const skillsRef = useRef<HTMLTextAreaElement>(null)
  const motivationRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!uid) return
    Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'dossiers', uid)),
    ]).then(([userSnap, dossierSnap]) => {
      const user = userSnap.data() ?? {}
      const dossier = dossierSnap.data() ?? {}

      setEmail(user.email ?? '')

      setTimeout(() => {
        if (fullNameRef.current) fullNameRef.current.value = user.full_name ?? ''
        if (phoneRef.current) phoneRef.current.value = user.phone ?? ''
        if (countryRef.current) countryRef.current.value = user.country_code ?? 'Cameroun'
        if (cityRef.current) cityRef.current.value = String(user.city ?? dossier.ville_residence ?? '')
        if (professionRef.current) professionRef.current.value = dossier.profession ?? ''
        if (targetJobRef.current) targetJobRef.current.value = dossier.target_job ?? dossier.profession ?? ''
        if (yearsRef.current) yearsRef.current.value = String(dossier.annees_experience ?? 0)
        if (levelRef.current) levelRef.current.value = dossier.niveau_etudes ?? ''
        if (languagesRef.current) languagesRef.current.value = Array.isArray(dossier.langues) ? dossier.langues.join(', ') : (dossier.langues ?? '')
        if (sectorRef.current) sectorRef.current.value = dossier.secteur_cible ?? ''
        if (regionRef.current) regionRef.current.value = dossier.region_italie ?? ''
        if (availabilityRef.current) availabilityRef.current.value = dossier.availability ?? 'immediate'
        if (drivingLicenseRef.current) drivingLicenseRef.current.value = dossier.driving_license ?? ''
        if (experiencesRef.current) experiencesRef.current.value = dossier.experiences ?? ''
        if (skillsRef.current) skillsRef.current.value = dossier.competences ?? ''
        if (motivationRef.current) motivationRef.current.value = dossier.italy_motivation ?? ''
      }, 0)
    }).finally(() => setLoading(false))
  }, [uid])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!uid) return
    setSaving(true)
    setSaved(false)

    try {
      const fullName = fullNameRef.current?.value.trim() ?? ''
      if (!fullName) {
        toast.error('Le nom est obligatoire')
        setSaving(false)
        return
      }

      const languages = (languagesRef.current?.value ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      await updateDoc(doc(db, 'users', uid), {
        full_name: fullName,
        phone: phoneRef.current?.value.trim() ?? '',
        country_code: countryRef.current?.value ?? 'Cameroun',
        city: cityRef.current?.value.trim() ?? '',
        updated_at: serverTimestamp(),
      })

      await setDoc(doc(db, 'dossiers', uid), {
        uid,
        profession: professionRef.current?.value.trim() ?? '',
        target_job: targetJobRef.current?.value.trim() ?? '',
        annees_experience: parseInt(yearsRef.current?.value ?? '0', 10) || 0,
        niveau_etudes: levelRef.current?.value ?? '',
        langues: languages,
        secteur_cible: sectorRef.current?.value ?? '',
        region_italie: regionRef.current?.value.trim() ?? '',
        availability: availabilityRef.current?.value ?? 'immediate',
        driving_license: drivingLicenseRef.current?.value ?? '',
        ville_residence: cityRef.current?.value.trim() ?? '',
        experiences: experiencesRef.current?.value.trim() ?? '',
        competences: skillsRef.current?.value.trim() ?? '',
        italy_motivation: motivationRef.current?.value.trim() ?? '',
        updated_at: serverTimestamp(),
      }, { merge: true })

      setSaved(true)
      toast.success('Profil enregistre')
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error(error)
      toast.error('Erreur. Verifiez votre connexion.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', gap:'12px', color:'#6B7280' }}>
        <span className="spinner" /> Chargement...
      </div>
    )
  }

  const inp = {
    style: {
      width:'100%',
      border:'1.5px solid #E4E8EF',
      borderRadius:'10px',
      padding:'11px 14px',
      fontSize:'16px',
      fontFamily:'inherit',
      background:'white',
      color:'#111827',
      boxSizing:'border-box' as const,
    },
  }

  return (
    <div style={{ maxWidth:'760px' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'0 0 4px' }}>Mon profil</h1>
        <p style={{ color:'#6B7280', fontSize:'14px', margin:0 }}>
          Plus votre profil est detaille, plus le CV et la lettre generes seront precis et professionnels.
        </p>
      </div>

      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#1E40AF', marginBottom:'16px', lineHeight:'1.7' }}>
        L IA utilise directement ces informations pour adapter le CV italien, la lettre de motivation et les candidatures.
      </div>

      <form onSubmit={save} autoComplete="off">
        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>Informations personnelles</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Nom complet *</label>
              <input ref={fullNameRef} type="text" {...inp} placeholder="Votre nom complet" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Email</label>
              <input value={email} readOnly {...inp} style={{ ...inp.style, background:'#F9FAFB', color:'#9CA3AF', cursor:'not-allowed' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Telephone / WhatsApp</label>
              <input ref={phoneRef} type="tel" {...inp} placeholder="+237 6XX XXX XXX" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Pays</label>
              <select ref={countryRef} {...inp}>
                {PAYS.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Ville de residence</label>
              <input ref={cityRef} type="text" {...inp} placeholder="Ex: Douala, Abidjan, Dakar..." autoComplete="off" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>Positionnement professionnel</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Profession actuelle</label>
              <input ref={professionRef} type="text" list="metiers-list" {...inp} placeholder="Choisissez ou tapez votre metier actuel" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Metier vise en Italie</label>
              <input ref={targetJobRef} type="text" list="metiers-list" {...inp} placeholder="Ex: Magasinier, Ouvrier agricole..." autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Annees d experience</label>
              <select ref={yearsRef} {...inp}>
                {Array.from({ length: 21 }, (_, index) => <option key={index} value={index}>{index} an{index > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Niveau d etudes</label>
              <select ref={levelRef} {...inp}>
                {NIVEAUX.map((level) => <option key={level.v} value={level.v}>{level.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Langues parlees</label>
              <input ref={languagesRef} type="text" {...inp} placeholder="Ex: Francais, Anglais, Italien debutant" autoComplete="off" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Disponibilite</label>
              <select ref={availabilityRef} {...inp}>
                {AVAILABILITY_OPTIONS.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Permis / conduite</label>
              <select ref={drivingLicenseRef} {...inp}>
                {DRIVING_LICENSE_OPTIONS.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>Parcours et competences</h2>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
              Experiences professionnelles
            </label>
            <textarea
              ref={experiencesRef}
              {...inp}
              style={{ ...inp.style, minHeight:'130px', resize:'vertical', lineHeight:'1.6' }}
              placeholder="Decrivez vos postes, entreprises, durees, responsabilites et resultats. Vous pouvez coller le texte de votre CV ici."
            />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>
              Competences, formations et outils maitrises
            </label>
            <textarea
              ref={skillsRef}
              {...inp}
              style={{ ...inp.style, minHeight:'110px', resize:'vertical', lineHeight:'1.6' }}
              placeholder="Ex: conduite de tracteur, caisse, logistique, soin aux personnes agees, soudure, nettoyage industriel..."
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'16px', color:'#374151' }}>Projet Italie</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Secteur cible</label>
              <select ref={sectorRef} {...inp}>
                <option value="">Choisir un secteur</option>
                {SECTEURS.map((sector) => <option key={sector.v} value={sector.v}>{sector.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Region souhaitee en Italie</label>
              <input ref={regionRef} type="text" list="regions-italie" {...inp} placeholder="Choisissez ou tapez une region" autoComplete="off" />
            </div>
          </div>
          <div style={{ marginTop:'14px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'#374151' }}>Motivation pour l Italie</label>
            <textarea
              ref={motivationRef}
              {...inp}
              style={{ ...inp.style, minHeight:'110px', resize:'vertical', lineHeight:'1.6' }}
              placeholder="Expliquez pourquoi vous voulez travailler en Italie, quel type de poste vous recherchez et ce qui vous motive."
            />
          </div>
        </div>

        <datalist id="metiers-list">
          {METIERS.map((job) => <option key={job} value={job} />)}
        </datalist>

        <datalist id="regions-italie">
          {REGIONS_ITALIE.map((region) => <option key={region} value={region} />)}
        </datalist>

        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'12px 14px', fontSize:'12px', color:'#92400E', marginBottom:'16px' }}>
          Vos donnees servent a preparer le dossier. Plus les champs sont precis, moins l equipe devra te recontacter pour completer ton CV.
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width:'100%',
            padding:'14px',
            background: saved ? '#059669' : '#1B3A6B',
            color:'white',
            border:'none',
            borderRadius:'12px',
            fontWeight:'700',
            fontSize:'15px',
            cursor: saving ? 'wait' : 'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:'8px',
            fontFamily:'inherit',
            transition:'background 0.3s',
          }}
        >
          {saving
            ? <><span className="spinner spinner-white" /> Enregistrement...</>
            : saved
              ? <><CheckCircle size={17} /> Profil enregistre</>
              : <><Save size={17} /> Enregistrer mon profil</>
          }
        </button>
      </form>
    </div>
  )
}
