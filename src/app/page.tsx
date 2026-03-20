'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Mail, CheckCircle, ArrowRight, Star, Calendar, Users, TrendingUp, Award, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ── Section Contact + Formulaire + Processus paiement ────
function ContactSection() {
  const [form, setForm] = useState({ nom:'', phone:'', email:'', pack:'Pack Standard — 100 000 XAF (20 employeurs)', secteur:'Agriculture / Saisonniers', message:'' })
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [reference, setReference] = useState('')

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.phone || !form.email) { toast.error('Nom, téléphone et email obligatoires'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setReference(data.reference)
        toast.success('✅ Demande envoyée ! Vérifiez votre email.')
      } else { toast.error(data.error ?? 'Erreur envoi') }
    } catch { toast.error('Erreur réseau. Contactez-nous sur WhatsApp.') }
    finally { setSending(false) }
  }

  const inp = { style:{ width:'100%', padding:'10px 13px', border:'1.5px solid #374151', borderRadius:'9px', fontSize:'14px', background:'#1F2937', color:'white', fontFamily:'inherit', boxSizing:'border-box' as const } }

  return (
    <section id="contact" style={{ background:'#111827', padding:'64px 20px' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>

        {/* Headline */}
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:'900', color:'white', margin:'0 0 10px' }}>
            Démarrez votre candidature
          </h2>
          <p style={{ color:'#9CA3AF', fontSize:'15px', margin:0 }}>
            Contactez-nous ou remplissez le formulaire — vous recevrez une <strong style={{color:'white'}}>confirmation par email</strong>
          </p>
        </div>

        {/* Contact rapide */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
          <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
            style={{ background:'#1F2937', border:'1.5px solid #374151', borderRadius:'12px', padding:'18px', display:'flex', gap:'14px', alignItems:'center', textDecoration:'none' }}>
            <div style={{ width:'46px', height:'46px', background:'#25D366', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>💬</div>
            <div>
              <div style={{ fontWeight:'700', fontSize:'15px', color:'white', marginBottom:'3px' }}>WhatsApp</div>
              <div style={{ fontSize:'14px', color:'#25D366', fontWeight:'600' }}>+39 329 963 9430</div>
              <div style={{ fontSize:'11px', color:'#6B7280', marginTop:'2px' }}>Réponse en moins de 2h · 24h/24</div>
            </div>
          </a>
          <a href="mailto:associazionelacolom75@gmail.com"
            style={{ background:'#1F2937', border:'1.5px solid #374151', borderRadius:'12px', padding:'18px', display:'flex', gap:'14px', alignItems:'center', textDecoration:'none' }}>
            <div style={{ width:'46px', height:'46px', background:'#2563EB', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>✉️</div>
            <div>
              <div style={{ fontWeight:'700', fontSize:'15px', color:'white', marginBottom:'3px' }}>Email</div>
              <div style={{ fontSize:'12px', color:'#93C5FD', wordBreak:'break-all' }}>associazionelacolom75@gmail.com</div>
              <div style={{ fontSize:'11px', color:'#6B7280', marginTop:'2px' }}>Réponse sous 24h</div>
            </div>
          </a>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', alignItems:'start' }}>

          {/* Formulaire demande */}
          <div style={{ background:'#1F2937', border:'1.5px solid #374151', borderRadius:'14px', padding:'24px' }}>
            <h3 style={{ fontWeight:'800', fontSize:'17px', color:'white', margin:'0 0 4px' }}>Faire une demande</h3>
            <p style={{ fontSize:'13px', color:'#9CA3AF', margin:'0 0 18px' }}>Vous recevez un email de confirmation immédiatement</p>

            {sent ? (
              <div style={{ textAlign:'center', padding:'24px 16px' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>✅</div>
                <div style={{ fontWeight:'800', fontSize:'17px', color:'white', marginBottom:'6px' }}>Demande reçue !</div>
                <div style={{ fontSize:'13px', color:'#9CA3AF', marginBottom:'12px', lineHeight:'1.6' }}>
                  Un email de confirmation a été envoyé à <strong style={{color:'white'}}>{form.email}</strong>
                </div>
                <div style={{ background:'#111827', borderRadius:'10px', padding:'10px 14px', fontSize:'12px', color:'#9CA3AF', marginBottom:'16px' }}>
                  Référence : <strong style={{color:'white', fontFamily:'monospace'}}>{reference}</strong>
                </div>
                <p style={{ fontSize:'13px', color:'#9CA3AF', lineHeight:'1.6' }}>
                  L'email contient les instructions de paiement et d'activation de votre pack. Vérifiez vos spams si nécessaire.
                </p>
                <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'12px', background:'#25D366', color:'white', padding:'10px 20px', borderRadius:'9px', fontSize:'13px', fontWeight:'700', textDecoration:'none' }}>
                  💬 Confirmer sur WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>Nom complet *</label>
                  <input type="text" value={form.nom} onChange={s('nom')} placeholder="Jean Dupont" required {...inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>WhatsApp *</label>
                  <input type="tel" value={form.phone} onChange={s('phone')} placeholder="+237 6XX XXX XXX" required {...inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>Email * (pour la confirmation)</label>
                  <input type="email" value={form.email} onChange={s('email')} placeholder="vous@email.com" required {...inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>Pack souhaité</label>
                  <select value={form.pack} onChange={s('pack')} {...inp} style={{ ...inp.style, paddingRight:'32px' }}>
                    <option>Pack Starter — 30 000 XAF (5 employeurs)</option>
                    <option>Pack Standard — 100 000 XAF (20 employeurs)</option>
                    <option>Pack Premium — 250 000 XAF (50+ employeurs)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>Secteur ciblé</label>
                  <select value={form.secteur} onChange={s('secteur')} {...inp} style={{ ...inp.style, paddingRight:'32px' }}>
                    <option>Agriculture / Saisonniers</option>
                    <option>Tourisme / Hôtellerie</option>
                    <option>Construction / BTP</option>
                    <option>Aide à domicile</option>
                    <option>Industrie / Logistique</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'5px' }}>Message (optionnel)</label>
                  <textarea value={form.message} onChange={s('message')} placeholder="Votre situation, vos questions..." rows={3} {...inp} style={{ ...inp.style, resize:'vertical', lineHeight:'1.5' }} />
                </div>
                <button type="submit" disabled={sending} style={{
                  background: sending?'#374151':'#D4A017', color:'white', border:'none',
                  padding:'13px', borderRadius:'10px', fontWeight:'700', fontSize:'14px',
                  cursor: sending?'wait':'pointer', fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                }}>
                  {sending
                    ? <><Loader2 size={16} style={{animation:'spin 0.7s linear infinite'}} /> Envoi en cours...</>
                    : <>Envoyer ma demande — Confirmation par email →</>
                  }
                </button>
                <p style={{ fontSize:'11px', color:'#6B7280', margin:0, textAlign:'center' }}>
                  Votre email ne sera pas partagé. Confirmation immédiate.
                </p>
              </form>
            )}
          </div>

          {/* Processus paiement avec preuve */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ background:'#1F2937', border:'1.5px solid #374151', borderRadius:'14px', padding:'20px' }}>
              <h3 style={{ fontWeight:'800', fontSize:'15px', color:'white', margin:'0 0 16px' }}>
                Comment payer et activer votre pack
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { n:'1', title:'Envoyez votre paiement', desc:<>Au numéro <strong style={{color:'#FFCB00'}}>651495483</strong> via MTN ou Orange Money Cameroun</>, badge:'651495483' },
                  { n:'2', title:'Prenez une capture du reçu', desc:<>Votre opérateur affiche un reçu avec un <strong style={{color:'white'}}>numéro de référence</strong>. Faites une capture d'écran.</> },
                  { n:'3', title:'Envoyez la capture sur WhatsApp', desc:<>Envoyez la capture + votre nom à <strong style={{color:'#25D366'}}>+39 329 963 9430</strong> — c'est votre preuve de paiement.</> },
                  { n:'4', title:'Activation dans les 2h ✅', desc:'Vous recevez un email de confirmation avec vos accès et les prochaines étapes.' },
                ].map((step, i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'12px', background:'#111827', borderRadius:'10px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: i===3?'#059669':'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'13px', flexShrink:0 }}>
                      {step.n}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'700', fontSize:'13px', color:'white', marginBottom:'3px' }}>{step.title}</div>
                      <div style={{ fontSize:'12px', color:'#9CA3AF', lineHeight:'1.6' }}>{step.desc}</div>
                      {step.badge && (
                        <div style={{ marginTop:'6px', display:'flex', gap:'6px' }}>
                          <span style={{ background:'#FFCB00', color:'#1A1A1A', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'99px' }}>MTN</span>
                          <span style={{ background:'#FF6600', color:'white', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'99px' }}>Orange</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation reçu */}
            <div style={{ background:'#1F2937', border:'1.5px solid #374151', borderRadius:'14px', padding:'18px' }}>
              <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'10px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Exemple de reçu MTN Mobile Money</div>
              <div style={{ background:'white', borderRadius:'10px', padding:'14px', fontSize:'12px', color:'#374151' }}>
                <div style={{ fontWeight:'700', textAlign:'center', marginBottom:'10px', color:'#1A1A1A', fontSize:'13px' }}>MTN Mobile Money</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  {[
                    ['Transaction', 'Envoi d\'argent'],
                    ['Destinataire', '651 495 483'],
                    ['Montant', '100 000 XAF'],
                    ['Frais', '0 XAF'],
                    ['Référence', 'TXN2025XXXXX'],
                    ['Statut', '✓ Succès'],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #F0F2F5', paddingBottom:'4px' }}>
                      <span style={{ color:'#6B7280' }}>{l}</span>
                      <span style={{ fontWeight:'600', color: l==='Statut'?'#059669':l==='Montant'?'#059669':'#111827' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'10px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'7px', padding:'8px', fontSize:'11px', color:'#15803D', textAlign:'center' }}>
                  → Faites une capture d'écran de ce reçu et envoyez-la sur WhatsApp
                </div>
              </div>
            </div>

            {/* CTA register */}
            <Link href="/register" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#D4A017', color:'white', textDecoration:'none', padding:'14px', borderRadius:'12px', fontWeight:'800', fontSize:'15px' }}>
              Créer mon espace gratuitement <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  )
}

const FLUSSI_DAYS = Math.max(0, Math.ceil((new Date('2027-01-12').getTime() - Date.now()) / 86400000))

const METIERS = [
  { icon:'🌾', label:'Agriculture & Récoltes',   desc:'Maraîchage, viticulture, arboriculture. Fort besoin chaque année.' },
  { icon:'🏨', label:'Tourisme & Hôtellerie',    desc:'Restauration, réception, ménage. Saison d\'été et d\'hiver.' },
  { icon:'🏗️', label:'Construction & BTP',       desc:'Maçons, électriciens, plombiers. Demande toute l\'année.' },
  { icon:'👴', label:'Aide à domicile',           desc:'Assistance aux personnes âgées. Très forte demande en Italie.' },
  { icon:'🏭', label:'Industrie & Logistique',   desc:'Opérateurs, conducteurs, magasiniers. Secteur en expansion.' },
  { icon:'🧹', label:'Services & Nettoyage',     desc:'Entretien, blanchisserie, collectivités. Places régulières.' },
]

const PACKS = [
  {
    badge: 'ESSENTIEL', name: 'Pack Starter',
    price: '30 000', currency: 'XAF',
    employers: '5',
    color: '#1B3A6B',
    features: [
      'Analyse de votre profil',
      'Optimisation de votre CV (FR)',
      'Traduction CV en italien',
      '1 lettre de motivation personnalisée',
      'Candidature auprès de 5 employeurs ciblés',
      'Vérification des documents essentiels',
    ],
    popular: false,
  },
  {
    badge: 'LE PLUS POPULAIRE',name: 'Pack Standard',
    price: '100 000', currency: 'XAF',
    employers: '20',
    color: '#059669',
    features: [
      'Tout le Pack Starter inclus',
      'CV optimisé + lettre en FR et IT',
      '3 lettres de motivation (agriculture, tourisme, soins)',
      'Candidature auprès de 20 employeurs',
      'Vérification complète de tous vos documents',
      'Préparation aux questions d\'entretien',
      '30 jours de suivi personnalisé',
      'WhatsApp dédié à votre dossier',
    ],
    popular: true,
  },
  {
    badge: 'MAXIMUM DE CHANCES', name: 'Pack Premium',
    price: '250 000', currency: 'XAF',
    employers: '50+',
    color: '#D97706',
    features: [
      'Tout le Pack Standard inclus',
      'Candidature auprès de 50+ employeurs',
      '2 séances de coaching vidéo',
      'Simulation d\'entretien avec notre équipe',
      'Suivi prioritaire pendant 90 jours',
      'Alertes employeurs en temps réel',
      'Mise à jour dossier illimitée',
    ],
    popular: false,
  },
]

const FAQ = [
  { q:'Qu\'est-ce que le Decreto Flussi exactement ?', a:'C\'est le décret annuel du gouvernement italien qui fixe le nombre de travailleurs non-européens autorisés à entrer légalement en Italie. Chaque année, des "Click Days" sont organisés : à une date précise, les employeurs italiens soumettent leurs demandes en ligne. Les quotas s\'épuisent en quelques minutes. C\'est pourquoi la préparation à l\'avance est absolument indispensable.' },
  { q:'Pourquoi soumettre plusieurs candidatures est-il si important ?', a:'Les employeurs reçoivent des dizaines de dossiers. Un candidat avec 1 seule candidature a environ 2% de chances d\'être sélectionné. Avec 20 candidatures, ses chances montent à plus de 35%. Avec 50+, les statistiques montrent plus de 65% de taux de sélection. ItalianiPro optimise votre dossier ET multiplie vos candidatures simultanément.' },
  { q:'Quel est exactement le rôle de ItalianiPro ?', a:'ItalianiPro est un service d\'intermédiation et d\'accompagnement documentaire. Nous préparons votre dossier (CV, lettres, documents), identifions les employeurs italiens qui recrutent dans votre secteur, et soumettons votre candidature en votre nom. Nous ne garantissons pas l\'emploi — c\'est l\'employeur qui choisit — mais nous maximisons vos chances en ayant le meilleur dossier possible auprès du plus grand nombre d\'employeurs.' },
  { q:'Qu\'est-ce que la Nulla Osta et qui la demande ?', a:'La Nulla Osta (autorisation de travail) est le document officiel délivré par le Sportello Unico delle Immigrazioni de la préfecture italienne. C\'est l\'EMPLOYEUR qui la demande pour vous, pas vous directement. Notre rôle est de vous aider à être sélectionné par un employeur avant le Click Day, afin qu\'il fasse cette démarche en votre nom.' },
  { q:'Comment se passe le paiement ?', a:'Vous pouvez payer par MTN Mobile Money ou Orange Money au numéro 651495483 (Cameroun). Après paiement, envoyez votre reçu sur WhatsApp au +39 329 963 9430. Votre pack est activé dans les 2 heures. Le paiement échelonné est possible pour le Pack Standard et Premium.' },
  { q:'Combien de temps prend la préparation du dossier ?', a:'Pack Starter : 5-7 jours. Pack Standard : 10-15 jours avec 30 jours de suivi. Pack Premium : préparation continue sur 90 jours avec relances et mises à jour. Plus vous commencez tôt avant le Click Day, meilleures sont vos chances.' },
]

export default function Home() {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:'#F8F9FC', color:'#111827' }}>

      {/* Bandeau alerte */}
      <div style={{ background:'#1B3A6B', color:'white', textAlign:'center', padding:'8px 16px', fontSize:'13px', fontWeight:'600' }}>
        ⚠️ Accompagnement documentaire uniquement — Aucune garantie d'emploi ou visa
      </div>

      {/* NAV */}
      <nav style={{ background:'white', borderBottom:'1.5px solid #E4E8EF', padding:'0 20px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <Image
            src="/logo-italianipro.svg"
            alt="ItalianiPro"
            width={208}
            height={52}
            priority
            style={{ width:'208px', height:'auto', display:'block' }}
          />
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <a href="#methode" style={{ fontSize:'13px', fontWeight:'600', color:'#6B7280', textDecoration:'none', padding:'7px 12px' }}>Comprendre le Flusso</a>
          <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:'13px', fontWeight:'700', color:'#059669', textDecoration:'none', padding:'8px 14px', background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:'9px', display:'flex', alignItems:'center', gap:'6px' }}>
            <span>💬</span> WhatsApp
          </a>
          <Link href="/login" style={{ fontSize:'13px', fontWeight:'600', color:'#1B3A6B', textDecoration:'none', padding:'8px 14px', border:'1.5px solid #E4E8EF', borderRadius:'9px' }}>
            Connexion
          </Link>
          <Link href="/register" style={{ fontSize:'13px', fontWeight:'700', color:'white', textDecoration:'none', padding:'9px 18px', background:'#1B3A6B', borderRadius:'9px' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'64px 20px 56px', textAlign:'center', background:'white', borderBottom:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'780px', margin:'0 auto' }}>

          {/* Countdown badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'99px', padding:'8px 20px', marginBottom:'28px' }}>
            <div style={{ width:'8px', height:'8px', background:'#F59E0B', borderRadius:'50%', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#92400E' }}>
              Click Day Flussi 2027 dans{' '}
              <strong style={{ color:'#D97706', fontSize:'16px' }}>{FLUSSI_DAYS}</strong> jours — Préparez-vous maintenant
            </span>
          </div>

          <h1 style={{ fontSize:'clamp(28px,5vw,56px)', fontWeight:'900', lineHeight:1.08, margin:'0 0 20px', color:'#111827' }}>
            Votre dossier de candidature{' '}
            <span style={{ color:'#1B3A6B', borderBottom:'4px solid #D4A017', paddingBottom:'2px' }}>parfait pour l'Italie</span>
          </h1>

          <p style={{ fontSize:'18px', color:'#6B7280', lineHeight:'1.7', maxWidth:'600px', margin:'0 auto 16px' }}>
            ItalianiPro prépare votre CV, vérifie vos documents et soumet votre candidature auprès de <strong>5 à 50+ employeurs italiens</strong> — avant que les quotas Flussi ne s'épuisent.
          </p>

          <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:'12px', padding:'12px 20px', display:'inline-block', marginBottom:'32px', fontSize:'14px', color:'#1E40AF', fontWeight:'600' }}>
            💡 1 candidature = 2% de chances · 20 candidatures = 35% · 50+ candidatures = 65%+
          </div>

          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#1B3A6B', color:'white', textDecoration:'none', padding:'15px 32px', borderRadius:'12px', fontWeight:'800', fontSize:'16px', boxShadow:'0 4px 20px rgba(27,58,107,0.3)' }}>
              Créer mon espace gratuitement <ArrowRight size={18} />
            </Link>
            <a href="#methode" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'white', color:'#374151', textDecoration:'none', padding:'15px 28px', borderRadius:'12px', fontWeight:'600', fontSize:'15px', border:'1.5px solid #E4E8EF' }}>
              Comment ça fonctionne
            </a>
          </div>
          <p style={{ marginTop:'14px', fontSize:'12px', color:'#9CA3AF' }}>Inscription gratuite · Paiement uniquement à l'activation du pack</p>
        </div>
      </section>

      {/* Bandeau défilant */}
      <section style={{ padding:'0 20px 28px', background:'white' }}>
        <div style={{ maxWidth:'780px', margin:'0 auto' }}>
          <div style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'18px', padding:'18px 20px', textAlign:'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', alignItems:'flex-start', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:'12px', fontWeight:'800', color:'#1D4ED8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                  Grandes lignes du Flusso italien
                </div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'#0F172A', marginBottom:'6px' }}>
                  4 idees a comprendre avant de lancer sa candidature
                </div>
                <div style={{ fontSize:'13px', color:'#64748B', lineHeight:'1.7' }}>
                  1. L Italie ouvre des quotas. 2. Les employeurs soumettent leurs demandes au Click Day. 3. Il faut etre pret avant cette date. 4. Plus votre dossier est professionnel et diffuse, plus vos chances augmentent.
                </div>
              </div>
              <a href="#methode" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#1B3A6B', color:'white', textDecoration:'none', padding:'11px 16px', borderRadius:'10px', fontWeight:'700', fontSize:'13px' }}>
                Lire le guide <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div style={{ background:'#111827', padding:'12px 0', overflow:'hidden' }}>
        <div style={{ display:'flex', gap:'40px', animation:'scroll 18s linear infinite', whiteSpace:'nowrap' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display:'flex', gap:'40px', flexShrink:0 }}>
              {['🇮🇹 Agriculture','🏨 Tourisme','🏗️ BTP','👴 Soins','🏭 Industrie','📱 MTN Mobile Money','🟠 Orange Money','⚡ CV en 5 jours','🎯 50+ employeurs'].map(t => (
                <span key={t} style={{ color:'#9CA3AF', fontSize:'13px', fontWeight:'500' }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FLUSSO EXPLIQUÉ */}
      <section id="methode" style={{ padding:'64px 20px', background:'#F8F9FC' }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <div style={{ display:'inline-block', background:'#EBF0FF', color:'#1B3A6B', fontSize:'12px', fontWeight:'700', padding:'5px 14px', borderRadius:'99px', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>
              📚 Comprendre le système
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:'900', margin:'0 0 12px' }}>
              Qu'est-ce que le Décret Flussi ?
            </h2>
            <p style={{ color:'#6B7280', fontSize:'16px', maxWidth:'600px', margin:'0 auto', lineHeight:'1.7' }}>
              La principale voie légale pour entrer en Italie comme travailleur étranger. Voici comment ça fonctionne.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px', marginBottom:'32px' }}>
            {[
              { n:'01', color:'#1B3A6B', bg:'#EBF0FF', title:"L'État publie les quotas", desc:'Le gouvernement fixe le nombre de travailleurs autorisés par secteur (agriculture, tourisme, soins, etc.).' },
              { n:'02', color:'#D97706', bg:'#FFFBEB', title:'Le Click Day arrive', desc:'À une date précise, les employeurs soumettent leurs demandes. Les places s\'épuisent en minutes. Tout se joue à la préparation.' },
              { n:'03', color:'#059669', bg:'#F0FDF4', title:'L\'employeur vous choisit', desc:'Un employeur qui a vu votre dossier AVANT le Click Day vous sélectionne. Notre rôle est de maximiser vos chances d\'être repéré.' },
              { n:'04', color:'#7C3AED', bg:'#F5F3FF', title:'Nulla Osta puis visa', desc:'L\'employeur demande le Nulla Osta à la préfecture. Vous obtenez votre visa d\'entrée. ItalianiPro vous guide à chaque étape.' },
            ].map(s => (
              <div key={s.n} style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', padding:'20px' }}>
                <div style={{ width:'44px', height:'44px', background:s.bg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'18px', color:s.color, marginBottom:'14px' }}>
                  {s.n}
                </div>
                <h3 style={{ fontWeight:'800', fontSize:'15px', margin:'0 0 8px' }}>{s.title}</h3>
                <p style={{ color:'#6B7280', fontSize:'13px', margin:0, lineHeight:'1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* La règle des 50 candidatures */}
          <div style={{ background:'#FFF7ED', border:'2px solid #FED7AA', borderRadius:'16px', padding:'24px 28px' }}>
            <h3 style={{ fontWeight:'900', fontSize:'18px', color:'#C2410C', margin:'0 0 12px', display:'flex', alignItems:'center', gap:'8px' }}>
              <TrendingUp size={22} /> La règle des 50 candidatures
            </h3>
            <p style={{ color:'#78350F', fontSize:'14px', lineHeight:'1.7', margin:'0 0 16px' }}>
              Les employeurs cherchent leurs candidats <strong>plusieurs mois avant</strong> le Click Day. Celui qui apparaît dans 50 dossiers différents a une probabilité beaucoup plus élevée d'être sélectionné. C'est le cœur de notre méthode : préparer le <strong>meilleur dossier possible</strong> et le soumettre au <strong>plus grand nombre d'employeurs</strong> dans votre secteur.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {[
                { n:'1',   label:'candidature',  pct:'~2%',  color:'#EF4444', bg:'#FFF1F2' },
                { n:'20',  label:'candidatures', pct:'~35%', color:'#F97316', bg:'#FFF7ED' },
                { n:'50+', label:'candidatures', pct:'65%+', color:'#059669', bg:'#F0FDF4' },
              ].map(p => (
                <div key={p.n} style={{ background:p.bg, borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:'22px', fontWeight:'900', color:p.color }}>{p.n}</div>
                  <div style={{ fontSize:'11px', color:p.color, opacity:0.8, marginBottom:'4px' }}>{p.label}</div>
                  <div style={{ fontSize:'24px', fontWeight:'900', color:p.color }}>{p.pct}</div>
                  <div style={{ fontSize:'11px', color:p.color, opacity:0.7 }}>de chances</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MÉTIERS */}
      <section style={{ padding:'64px 20px', background:'white', borderTop:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:'900', margin:'0 0 10px' }}>
              🇮🇹 Les métiers les plus demandés en Italie
            </h2>
            <p style={{ color:'#6B7280', fontSize:'15px', margin:0 }}>Secteurs avec le plus de quotas disponibles dans le Décret Flussi</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'14px' }}>
            {METIERS.map(m => (
              <div key={m.label} style={{ background:'#F8F9FC', border:'1.5px solid #E4E8EF', borderRadius:'12px', padding:'18px 20px', display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ fontSize:'28px', flexShrink:0 }}>{m.icon}</div>
                <div>
                  <div style={{ fontWeight:'800', fontSize:'15px', marginBottom:'5px' }}>{m.label}</div>
                  <div style={{ color:'#6B7280', fontSize:'13px', lineHeight:'1.5' }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTRE RÔLE */}
      <section style={{ padding:'64px 20px', background:'#1B3A6B', color:'white' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:'900', margin:'0 0 12px' }}>
              Notre rôle dans votre candidature
            </h2>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'15px', maxWidth:'580px', margin:'0 auto', lineHeight:'1.7' }}>
              Nous sommes votre intermédiaire entre vous et les employeurs italiens. Voici exactement ce que nous faisons.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'14px' }}>
            {[
              { icon:'📝', title:'Préparer votre dossier', desc:'CV corrigé et optimisé en français ET en italien. Lettres de motivation personnalisées par secteur. Vérification de tous vos documents.' },
              { icon:'🎯', title:'Identifier les employeurs', desc:'Nous cherchons les employeurs qui recrutent dans votre secteur et votre région. Nous construisons une liste ciblée pour maximiser vos chances.' },
              { icon:'📤', title:'Soumettre vos candidatures', desc:'Nous envoyons votre dossier aux employeurs en votre nom. C\'est l\'employeur qui décide — notre rôle est d\'être présent et visible partout.' },
              { icon:'📊', title:'Suivre et relancer', desc:'Nous suivons les retours des employeurs. En cas d\'intérêt, nous vous mettons en relation directe avec l\'employeur pour la suite du processus.' },
              { icon:'🎓', title:'Vous préparer', desc:'Coaching pour votre entretien, préparation aux questions, phrases utiles en italien. Vous arrivez préparé le jour J.' },
              { icon:'📱', title:'Support continu', desc:'WhatsApp, messagerie in-app, email. Votre équipe est disponible 24h/24 pour répondre à toutes vos questions.' },
            ].map(f => (
              <div key={f.title} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'18px' }}>
                <div style={{ fontSize:'26px', marginBottom:'10px' }}>{f.icon}</div>
                <div style={{ fontWeight:'800', fontSize:'15px', marginBottom:'7px' }}>{f.title}</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'13px', lineHeight:'1.6' }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', padding:'16px 20px', marginTop:'24px', textAlign:'center', fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>
            ⚠️ ItalianiPro est un service d'<strong style={{ color:'white' }}>intermédiation et d'accompagnement documentaire</strong>. Nous ne garantissons pas et n'obtenons pas directement la Nulla Osta ou le visa — ce sont les autorités italiennes qui décident.
          </div>
        </div>
      </section>

      {/* CALENDRIER FLUSSI */}
      <section style={{ padding:'56px 20px', background:'#F8F9FC', borderTop:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:'900', margin:'0 0 8px' }}>
              📅 Calendrier Click Days Flussi 2027
            </h2>
            <p style={{ color:'#EF4444', fontWeight:'600', fontSize:'14px', margin:0 }}>⚠️ Les dates 2026 sont passées. Commencez maintenant pour 2027.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
            {[
              { date:'12 Jan 2027', secteur:'Saisonniers Agricoles', days:FLUSSI_DAYS,      color:'#22C55E', bg:'#F0FDF4', border:'#86EFAC' },
              { date:'9 Fév 2027',  secteur:'Saisonniers Tourisme',  days:FLUSSI_DAYS+28,   color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE' },
              { date:'16 Fév 2027', secteur:'Non Saisonniers',       days:FLUSSI_DAYS+35,   color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE' },
              { date:'18 Fév 2027', secteur:'Aide à domicile',       days:FLUSSI_DAYS+37,   color:'#F97316', bg:'#FFF7ED', border:'#FED7AA' },
            ].map(e => (
              <div key={e.date} style={{ background:e.bg, border:`1.5px solid ${e.border}`, borderRadius:'12px', padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:'26px', fontWeight:'900', color:e.color }}>{Math.max(0,e.days)}</div>
                <div style={{ fontSize:'11px', color:e.color, marginBottom:'8px' }}>jours</div>
                <div style={{ fontWeight:'700', fontSize:'13px', color:'#111827', marginBottom:'3px' }}>{e.date}</div>
                <div style={{ fontSize:'12px', color:'#6B7280' }}>{e.secteur}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKS */}
      <section id="packs" style={{ padding:'64px 20px', background:'white', borderTop:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:'900', margin:'0 0 10px' }}>Nos offres d'accompagnement</h2>
            <p style={{ color:'#6B7280', fontSize:'15px', margin:0 }}>💳 Paiement MTN Mobile Money · Orange Money · N° 651495483 (Cameroun)</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', alignItems:'center' }}>
            {PACKS.map(p => (
              <div key={p.name} style={{
                background:'white', border:`2px solid ${p.popular?p.color:'#E4E8EF'}`, borderRadius:'16px',
                padding:'24px', position:'relative', transform: p.popular?'scale(1.04)':'none',
                boxShadow: p.popular?`0 8px 32px ${p.color}25`:'none',
              }}>
                {p.popular && (
                  <div style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:p.color, color:'white', fontSize:'11px', fontWeight:'800', padding:'4px 16px', borderRadius:'99px', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {p.badge}
                  </div>
                )}
                {!p.popular && (
                  <div style={{ display:'inline-block', background:'#F3F4F6', color:'#6B7280', fontSize:'11px', fontWeight:'700', padding:'3px 12px', borderRadius:'99px', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontWeight:'900', fontSize:'19px', margin: p.popular?'0 0 4px':'4px 0', color:'#111827' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'30px', fontWeight:'900', color:p.color }}>{p.price}</span>
                  <span style={{ fontSize:'14px', color:'#9CA3AF' }}>XAF</span>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${p.color}18`, color:p.color, fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'8px', marginBottom:'18px' }}>
                  <Users size={13} /> {p.employers} employeurs ciblés
                </div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'#374151' }}>
                      <CheckCircle size={15} color={p.color} style={{ flexShrink:0, marginTop:'1px' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{
                  display:'block', textAlign:'center', background:p.popular?p.color:'white',
                  color:p.popular?'white':p.color, border:`2px solid ${p.color}`,
                  borderRadius:'10px', padding:'12px', fontWeight:'800', textDecoration:'none', fontSize:'14px',
                }}>
                  Choisir ce pack →
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:'24px', color:'#9CA3AF', fontSize:'13px' }}>
            📱 Paiement Mobile Money au numéro <strong>651495483</strong> · Envoyez le reçu sur WhatsApp pour activer votre pack
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section style={{ padding:'56px 20px', background:'#F8F9FC', borderTop:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'36px' }}>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:'900', margin:'0 0 8px' }}>Ce que disent nos clients</h2>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
              {[...Array(5)].map((_,i) => <Star key={i} size={18} color="#F59E0B" fill="#F59E0B" />)}
              <span style={{ marginLeft:'6px', fontSize:'13px', color:'#6B7280' }}>4.9/5 · +500 clients accompagnés</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'14px' }}>
            {[
              { nom:'Marie T.', pays:'🇨🇲 Cameroun', pack:'Pack Standard', stars:5, texte:'Mon CV était en mauvais état. ItalianiPro l\'a entièrement refait en français et en italien. L\'équipe répond toujours rapidement sur WhatsApp. Je recommande vivement.' },
              { nom:'Ibrahim K.', pays:'🇨🇲 Cameroun', pack:'Pack Premium', stars:5, texte:'J\'ai vu exactement ce que l\'équipe a fait pour moi, document par document. La transparence m\'a vraiment convaincu. C\'est sérieux et professionnel.' },
              { nom:'Fatima D.', pays:'🇸🇳 Sénégal', pack:'Pack Starter', stars:5, texte:'Je ne savais pas comment fonctionnait le Flusso. ItalianiPro m\'a tout expliqué et préparé mon dossier. Simple, clair, efficace.' },
            ].map(t => (
              <div key={t.nom} style={{ background:'white', border:'1.5px solid #E4E8EF', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', gap:'4px', marginBottom:'12px' }}>
                  {[...Array(t.stars)].map((_,i) => <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" />)}
                </div>
                <p style={{ color:'#374151', fontSize:'14px', lineHeight:'1.7', margin:'0 0 16px', fontStyle:'italic' }}>"{t.texte}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'14px', flexShrink:0 }}>
                    {t.nom[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:'700', fontSize:'14px' }}>{t.nom}</div>
                    <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{t.pays} · {t.pack}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'64px 20px', background:'white', borderTop:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:'900', textAlign:'center', marginBottom:'40px' }}>Questions fréquentes</h2>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {FAQ.map((f, i) => (
              <details key={i} style={{ borderBottom:'1px solid #E4E8EF', padding:'18px 0' }}>
                <summary style={{ fontWeight:'700', fontSize:'15px', cursor:'pointer', color:'#111827', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', userSelect:'none' }}>
                  {f.q}
                  <span style={{ flexShrink:0, fontSize:'18px', color:'#9CA3AF' }}>+</span>
                </summary>
                <p style={{ color:'#6B7280', fontSize:'14px', lineHeight:'1.7', margin:'12px 0 0', paddingRight:'24px' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT + FORMULAIRE + PROCESSUS PAIEMENT */}
      <ContactSection />

      {/* FOOTER */}
      <footer style={{ background:'#0A0A0A', padding:'24px 20px', textAlign:'center', fontSize:'12px', color:'#6B7280' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'14px' }}>
          <Image
            src="/logo-italianipro-light.svg"
            alt="ItalianiPro"
            width={220}
            height={55}
            style={{ width:'220px', height:'auto', display:'block' }}
          />
        </div>
        <p style={{ margin:'0 0 6px' }}>© {new Date().getFullYear()} ItalianiPro · Intermédiation et accompagnement documentaire</p>
        <p style={{ margin:0 }}>⚠️ Aucune garantie d'emploi, visa ou nulla osta · La décision appartient à l'employeur et aux autorités italiennes</p>
      </footer>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}
        details summary::-webkit-details-marker{display:none}
        details[open] summary span{transform:rotate(45deg)}
        details summary span{display:inline-block;transition:transform 0.2s}
      `}</style>
    </div>
  )
}
