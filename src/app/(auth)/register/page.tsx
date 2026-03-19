'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Check } from 'lucide-react'
import { register } from '@/lib/auth'
import { toast } from 'sonner'

const PAYS = [
  'Cameroun','Sénégal',"Côte d'Ivoire",'Mali','Guinée','Bénin','Togo','Gabon',
  'Congo RDC','Congo Brazza','Nigeria','Ghana','Burkina Faso','Autre'
]

export default function RegisterPage() {
  const [step, setStep]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [show, setShow]         = useState(false)
  const [agreed, setAgreed]     = useState(false)
  const [form, setForm]         = useState({
    full_name: '', email: '', password: '', phone: '', country: 'Cameroun'
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      if (!form.full_name.trim()) { toast.error('Veuillez entrer votre nom complet'); return }
      if (!form.email.includes('@')) { toast.error('Email invalide'); return }
      if (form.password.length < 6) { toast.error('Mot de passe trop court (6 caractères min.)'); return }
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    if (!agreed) { toast.error('Veuillez accepter les conditions'); return }
    setLoading(true)
    try {
      await register({ email: form.email, password: form.password, full_name: form.full_name, phone: form.phone, country: form.country })
      toast.success('Compte créé ! Bienvenue 🎉')
      window.location.href = '/dashboard'
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Cet email est déjà utilisé. Connectez-vous.' : 'Erreur lors de la création du compte.'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const steps = ['Compte', 'Coordonnées', 'Confirmation']

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FC', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'40px', height:'40px', background:'#1B3A6B', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#D4A017', fontWeight:'900', fontSize:'14px' }}>IP</span>
            </div>
            <span style={{ fontSize:'20px', fontWeight:'800', color:'#111827' }}>
              Italiani<span style={{ color:'#D4A017' }}>Pro</span>
            </span>
          </Link>
        </div>

        {/* Steps */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0', marginBottom:'24px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{
                  width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:'700', fontSize:'13px', transition:'all 0.2s',
                  background: step > i+1 ? '#1B3A6B' : step === i+1 ? '#1B3A6B' : '#E9ECF0',
                  color: step >= i+1 ? 'white' : '#9CA3AF',
                }}>
                  {step > i+1 ? <Check size={14} /> : i+1}
                </div>
                <span style={{ fontSize:'11px', fontWeight:'500', color: step === i+1 ? '#1B3A6B' : '#9CA3AF' }}>{s}</span>
              </div>
              {i < steps.length-1 && (
                <div style={{ width:'40px', height:'2px', background: step > i+1 ? '#1B3A6B' : '#E9ECF0', margin:'0 4px', marginBottom:'16px', transition:'background 0.2s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:'28px' }}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Step 1 */}
            {step === 1 && <>
              <div>
                <h2 style={{ fontSize:'17px', fontWeight:'700', marginBottom:'4px' }}>Créer mon compte</h2>
                <p style={{ fontSize:'13px', color:'#6B7280' }}>Vos identifiants de connexion</p>
              </div>
              <div>
                <label className="field-label">Nom complet *</label>
                <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="Ex: Marie Tchouaffe" autoFocus />
              </div>
              <div>
                <label className="field-label">Adresse e-mail *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="field-label">Mot de passe * (6 caractères minimum)</label>
                <div style={{ position:'relative' }}>
                  <input type={show?'text':'password'} value={form.password} onChange={set('password')} placeholder="••••••••" style={{ paddingRight:'44px' }} autoComplete="new-password" />
                  <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:'4px' }}>
                    {show ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>
            </>}

            {/* Step 2 */}
            {step === 2 && <>
              <div>
                <h2 style={{ fontSize:'17px', fontWeight:'700', marginBottom:'4px' }}>Vos coordonnées</h2>
                <p style={{ fontSize:'13px', color:'#6B7280' }}>Pour mieux vous accompagner</p>
              </div>
              <div>
                <label className="field-label">Téléphone / WhatsApp</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+237 6XX XXX XXX" />
              </div>
              <div>
                <label className="field-label">Pays de résidence</label>
                <select value={form.country} onChange={set('country')}>
                  {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <p style={{ fontSize:'12px', color:'#9CA3AF' }}>
                Vous pourrez compléter votre profil professionnel après votre inscription.
              </p>
            </>}

            {/* Step 3 */}
            {step === 3 && <>
              <div>
                <h2 style={{ fontSize:'17px', fontWeight:'700', marginBottom:'4px' }}>Confirmation</h2>
                <p style={{ fontSize:'13px', color:'#6B7280' }}>Lisez et acceptez les conditions</p>
              </div>
              <div className="alert alert-warning">
                <div>
                  <strong>⚠️ Important à lire</strong><br />
                  ItalianiPro est une plateforme d'<strong>accompagnement documentaire uniquement</strong>.
                  Nous ne garantissons pas et n'obtenons pas d'emploi, de visa, ni de nulla osta.
                  La décision appartient à l'employeur et aux autorités italiennes.
                </div>
              </div>
              <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer', fontSize:'13px', color:'#374151', lineHeight:'1.5' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width:'auto', marginTop:'2px', flexShrink:0, cursor:'pointer' }}
                />
                <span>
                  Je comprends qu'ItalianiPro offre un accompagnement documentaire uniquement, sans garantie de résultat.
                  J'accepte les <Link href="/cgu" style={{ color:'#1B3A6B' }}>CGU</Link> et la <Link href="/confidentialite" style={{ color:'#1B3A6B' }}>politique de confidentialité</Link>. *
                </span>
              </label>
            </>}

            <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
              {step > 1 && (
                <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s-1)} style={{ flex:1 }}>
                  ← Retour
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading || (step===3 && !agreed)} style={{ flex: step>1?1:undefined, width: step===1?'100%':undefined }}>
                {loading ? <><span className="spinner spinner-white" /> Création...</> :
                 step < 3 ? 'Continuer →' : 'Créer mon compte'}
              </button>
            </div>
          </form>

          <div style={{ textAlign:'center', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #F0F2F5', fontSize:'14px', color:'#6B7280' }}>
            Déjà inscrit ?{' '}
            <Link href="/login" style={{ color:'#1B3A6B', fontWeight:'600', textDecoration:'none' }}>Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
