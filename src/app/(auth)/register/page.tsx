'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react'
import { registerUser } from '@/lib/auth'
import { toast } from 'sonner'

const COUNTRIES = [
  { code:'CM', label:'🇨🇲 Cameroun' }, { code:'SN', label:'🇸🇳 Sénégal' },
  { code:'CI', label:"🇨🇮 Côte d'Ivoire" }, { code:'ML', label:'🇲🇱 Mali' },
  { code:'GN', label:'🇬🇳 Guinée' }, { code:'BJ', label:'🇧🇯 Bénin' },
  { code:'TG', label:'🇹🇬 Togo' }, { code:'GA', label:'🇬🇦 Gabon' },
  { code:'CD', label:'🇨🇩 Congo RDC' }, { code:'CG', label:'🇨🇬 Congo Brazza' },
  { code:'NG', label:'🇳🇬 Nigeria' }, { code:'GH', label:'🇬🇭 Ghana' },
  { code:'OTHER', label:'🌍 Autre pays' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState({ cgu: false, rgpd: false, disclaimer: false })
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    country: 'CM', profession: '', target_sector: '', role: 'candidate',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) { setStep(s => s + 1); return }
    setLoading(true)
    try {
      const { role } = await registerUser(form)
      toast.success('Compte créé avec succès ! Bienvenue 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Cet email est déjà utilisé. Connectez-vous.'
        : err.code === 'auth/weak-password'
        ? 'Mot de passe trop faible (minimum 6 caractères).'
        : 'Erreur lors de la création du compte.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const allConsents = Object.values(consents).every(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-navy-950 to-navy-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-56 h-56 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <span className="text-gold-400 font-bold">IP</span>
            </div>
            <span className="text-white font-bold text-xl">Italiani<span className="text-gold-400">Pro</span></span>
          </Link>
        </div>
        <div className="relative z-10 space-y-3">
          {['Dossier sécurisé & confidentiel','Paiement Mobile Money (MTN, Orange)','Accompagnement FR & EN','Suivi en temps réel','Preuves horodatées de travail effectué'].map((f,i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-200">
              <CheckCircle size={14} className="text-gold-400 shrink-0" /> {f}
            </div>
          ))}
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 leading-relaxed">
            <AlertTriangle className="inline w-3 h-3 mr-1 mb-0.5" />
            ItalianiPro n'est pas une agence d'emploi ni de visa. Accompagnement documentaire uniquement.
          </div>
        </div>
        <div className="relative z-10 text-xs text-gray-600">© {new Date().getFullYear()} ItalianiPro</div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {['Compte','Profil','Consentement'].map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > i+1 ? <CheckCircle size={14} /> : i+1}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${step === i+1 ? 'text-navy-800' : 'text-gray-400'}`}>{label}</div>
                </div>
                {i < 2 && <div className={`w-16 h-px mx-2 mb-4 transition-all ${step > i+1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-card-lg p-8 border border-gray-100">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy-900">
                {step===1?'Créer mon compte':step===2?'Mon profil':'Consentements'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Étape {step}/3</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                    <input type="text" required value={form.full_name}
                      onChange={e => setForm(f=>({...f,full_name:e.target.value}))}
                      placeholder="Ex: Marie Tchouaffe"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                    <input type="email" required value={form.email}
                      onChange={e => setForm(f=>({...f,email:e.target.value}))}
                      placeholder="vous@exemple.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone WhatsApp</label>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                    <div className="relative">
                      <input type={show?'text':'password'} required value={form.password}
                        onChange={e => setForm(f=>({...f,password:e.target.value}))}
                        placeholder="Minimum 6 caractères"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
                      <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {show?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Je m'inscris en tant que *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{v:'candidate',l:'👤 Candidat'},{v:'sponsor',l:'💳 Sponsor / Proche'}].map(r=>(
                        <button key={r.v} type="button" onClick={()=>setForm(f=>({...f,role:r.v}))}
                          className={`border rounded-xl py-3 text-sm font-medium transition ${form.role===r.v?'border-navy-700 bg-navy-50 text-navy-800':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {r.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays de résidence *</label>
                    <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white transition">
                      {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession actuelle</label>
                    <input type="text" value={form.profession}
                      onChange={e=>setForm(f=>({...f,profession:e.target.value}))}
                      placeholder="Ex: Infirmier, Maçon, Agriculteur..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur ciblé en Italie</label>
                    <select value={form.target_sector} onChange={e=>setForm(f=>({...f,target_sector:e.target.value}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white transition">
                      <option value="">— Choisir —</option>
                      <option value="agriculture">🌾 Agriculture / Saisonniers</option>
                      <option value="tourism">🏨 Tourisme / Hôtellerie</option>
                      <option value="construction">🏗️ Construction / BTP</option>
                      <option value="care">🏥 Aide à domicile / Soins</option>
                      <option value="other">🔧 Autre secteur</option>
                    </select>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
                    <strong>⚠️ Clause obligatoire à lire</strong><br /><br />
                    ItalianiPro est une plateforme d'accompagnement documentaire.<br />
                    Elle ne garantit pas et n'obtient pas :<br />
                    • d'emploi en Italie<br />
                    • de visa de travail<br />
                    • de nulla osta (autorisation de travail)<br /><br />
                    La demande officielle est faite par l'employeur via le Sportello Unico.
                  </div>
                  {[
                    { key:'disclaimer', label:"Je comprends qu'ItalianiPro ne garantit ni emploi, ni visa, ni nulla osta. Je m'inscris pour un accompagnement documentaire uniquement. *" },
                    { key:'cgu',        label:<>J'accepte les <Link href="/legal/cgu" className="text-navy-600 underline" target="_blank">CGU</Link> de la plateforme. *</> },
                    { key:'rgpd',       label:<>J'accepte la <Link href="/legal/privacy" className="text-navy-600 underline" target="_blank">Politique de confidentialité</Link>. *</> },
                  ].map(c=>(
                    <label key={c.key} className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={consents[c.key as keyof typeof consents]}
                        onChange={e=>setConsents(v=>({...v,[c.key]:e.target.checked}))}
                        className="mt-0.5 w-4 h-4 accent-navy-700 shrink-0" />
                      <span className="text-xs text-gray-600 leading-relaxed">{c.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button type="button" onClick={()=>setStep(s=>s-1)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
                    ← Retour
                  </button>
                )}
                <button type="submit" disabled={loading||(step===3&&!allConsents)}
                  className="flex-1 bg-navy-800 hover:bg-navy-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : step < 3 ? <>Continuer <ArrowRight size={16}/></> : <>Créer mon espace <CheckCircle size={16}/></>
                  }
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-navy-700 font-semibold hover:text-navy-900">Se connecter</Link>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 justify-center">
              <Shield size={11} /> Données chiffrées Firebase — Stockage sécurisé
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
