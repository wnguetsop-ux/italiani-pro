import Link from 'next/link'

const FLUSSI_DAYS = Math.max(0, Math.ceil((new Date('2027-01-12').getTime() - Date.now()) / 86400000))

export default function Home() {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:'#F8F9FC', minHeight:'100vh' }}>

      {/* NAV */}
      <nav style={{ background:'white', borderBottom:'1.5px solid #E4E8EF', padding:'0 20px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', background:'#1B3A6B', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#D4A017', fontWeight:'900', fontSize:'13px' }}>IP</span>
          </div>
          <span style={{ fontWeight:'800', fontSize:'18px', color:'#111827' }}>Italiani<span style={{ color:'#D4A017' }}>Pro</span></span>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:'13px', fontWeight:'600', color:'#059669', textDecoration:'none', padding:'7px 14px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:'8px' }}>
            💬 WhatsApp
          </a>
          <Link href="/login" style={{ fontSize:'13px', fontWeight:'600', color:'#1B3A6B', textDecoration:'none', padding:'7px 14px', background:'#EBF0FF', borderRadius:'8px' }}>
            Connexion
          </Link>
          <Link href="/register" style={{ fontSize:'13px', fontWeight:'700', color:'white', textDecoration:'none', padding:'8px 18px', background:'#1B3A6B', borderRadius:'9px' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'64px 20px 48px', textAlign:'center', maxWidth:'720px', margin:'0 auto' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'white', border:'1.5px solid #E4E8EF', borderRadius:'99px', padding:'7px 16px', fontSize:'13px', color:'#D97706', fontWeight:'600', marginBottom:'28px' }}>
          <span style={{ width:'8px', height:'8px', background:'#F59E0B', borderRadius:'50%', display:'inline-block', animation:'pulse 2s infinite' }} />
          Click Day Flussi 2027 dans <strong style={{ color:'#1B3A6B' }}>{FLUSSI_DAYS} jours</strong>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:'900', color:'#111827', lineHeight:1.1, marginBottom:'18px' }}>
          Préparez votre dossier<br />
          <span style={{ color:'#1B3A6B' }}>pour travailler en Italie</span>
        </h1>
        <p style={{ fontSize:'17px', color:'#6B7280', lineHeight:'1.7', marginBottom:'32px', maxWidth:'560px', margin:'0 auto 32px' }}>
          ItalianiPro accompagne votre candidature : CV optimisé, documents vérifiés, dossier complet — sans garantir d'emploi ni de visa.
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#1B3A6B', color:'white', textDecoration:'none', padding:'14px 28px', borderRadius:'12px', fontWeight:'700', fontSize:'16px' }}>
            Créer mon espace gratuit →
          </Link>
          <a href="#methode" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'white', color:'#374151', textDecoration:'none', padding:'14px 28px', borderRadius:'12px', fontWeight:'600', fontSize:'16px', border:'1.5px solid #E4E8EF' }}>
            Comment ça marche
          </a>
        </div>
        <p style={{ marginTop:'16px', fontSize:'12px', color:'#9CA3AF' }}>Accompagnement documentaire uniquement · Aucune garantie d'emploi ou visa</p>
      </section>

      {/* DISCLAIMER */}
      <div style={{ maxWidth:'720px', margin:'0 auto 40px', padding:'0 20px' }}>
        <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'12px', padding:'14px 18px', fontSize:'13px', color:'#92400E', display:'flex', gap:'10px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
          <span><strong>Important :</strong> ItalianiPro est un service d'accompagnement documentaire et de préparation de candidature. Nous ne garantissons pas et n'obtenons pas de nulla osta, de visa ni d'emploi. La décision finale appartient à l'employeur et aux autorités italiennes.</span>
        </div>
      </div>

      {/* METHODE */}
      <section id="methode" style={{ padding:'48px 20px', background:'white', borderTop:'1.5px solid #E4E8EF', borderBottom:'1.5px solid #E4E8EF' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'28px', fontWeight:'800', textAlign:'center', marginBottom:'8px' }}>Comment ça fonctionne</h2>
          <p style={{ textAlign:'center', color:'#6B7280', marginBottom:'40px' }}>4 étapes simples pour préparer votre candidature</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'20px' }}>
            {[
              { n:'1', title:'Vous vous inscrivez', desc:'Créez votre espace gratuitement et remplissez votre profil professionnel.' },
              { n:'2', title:'Vous uploadez vos documents', desc:'CV, diplômes, passeport — ou décrivez simplement votre parcours par écrit.' },
              { n:'3', title:'Notre équipe prépare votre dossier', desc:'Vérification, optimisation du CV, lettre de motivation, checklist complète.' },
              { n:'4', title:'Vous candidatez à 50+ employeurs', desc:'Plus vous postulez avant le Click Day, plus vous avez de chances d\'être sélectionné.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign:'center', padding:'20px' }}>
                <div style={{ width:'48px', height:'48px', background:'#1B3A6B', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'white', fontWeight:'900', fontSize:'20px' }}>{s.n}</div>
                <h3 style={{ fontWeight:'700', fontSize:'15px', marginBottom:'8px' }}>{s.title}</h3>
                <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:'1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKS */}
      <section id="packs" style={{ padding:'56px 20px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'28px', fontWeight:'800', textAlign:'center', marginBottom:'8px' }}>Nos offres</h2>
          <p style={{ textAlign:'center', color:'#6B7280', marginBottom:'40px' }}>Paiement Mobile Money · MTN · Orange · XAF</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'16px' }}>
            {[
              { name:'Pack CV', prix:'45 000 XAF', features:['Analyse et optimisation CV','Version française et anglaise','1 lettre de motivation','Conseils secteur Italia'], popular:false },
              { name:'Pack Dossier Complet', prix:'120 000 XAF', features:['Tout le Pack CV inclus','Vérification tous documents','CV en français ET italien','3 lettres personnalisées','Candidatures ×10 employeurs','Suivi 30 jours'], popular:true },
              { name:'Pack Premium', prix:'350 000 XAF', features:['Tout le Pack Dossier','Coaching entretien vidéo','Candidatures ×50 employeurs','Suivi 90 jours','WhatsApp dédié'], popular:false },
            ].map(p => (
              <div key={p.name} style={{ background:'white', border:`2px solid ${p.popular?'#1B3A6B':'#E4E8EF'}`, borderRadius:'16px', padding:'24px', position:'relative', transform: p.popular?'scale(1.03)':'none', boxShadow: p.popular?'0 8px 32px rgba(27,58,107,0.12)':'none' }}>
                {p.popular && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#1B3A6B', color:'white', fontSize:'11px', fontWeight:'700', padding:'4px 14px', borderRadius:'99px', whiteSpace:'nowrap' }}>LE PLUS POPULAIRE</div>}
                <div style={{ fontWeight:'800', fontSize:'17px', marginBottom:'4px' }}>{p.name}</div>
                <div style={{ fontSize:'24px', fontWeight:'900', color:'#1B3A6B', marginBottom:'18px' }}>{p.prix}</div>
                <ul style={{ listStyle:'none', padding:0, marginBottom:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {p.features.map(f => <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'#374151' }}><span style={{ color:'#22C55E', flexShrink:0, marginTop:'1px' }}>✓</span>{f}</li>)}
                </ul>
                <Link href="/register" style={{ display:'block', textAlign:'center', background: p.popular?'#1B3A6B':'white', color: p.popular?'white':'#1B3A6B', border:`2px solid #1B3A6B`, borderRadius:'10px', padding:'11px', fontWeight:'700', textDecoration:'none', fontSize:'14px' }}>
                  Choisir ce pack
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ padding:'56px 20px', background:'#111827', color:'white', textAlign:'center' }}>
        <h2 style={{ fontSize:'28px', fontWeight:'800', marginBottom:'8px' }}>Contactez-nous</h2>
        <p style={{ color:'#9CA3AF', marginBottom:'32px' }}>Disponible 24h/24 — 7j/7</p>
        <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer" style={{ background:'#059669', color:'white', textDecoration:'none', padding:'14px 28px', borderRadius:'12px', fontWeight:'700', fontSize:'15px' }}>
            💬 WhatsApp : +39 329 963 9430
          </a>
          <a href="mailto:associazionelacolom75@gmail.com" style={{ background:'#1F2937', color:'white', textDecoration:'none', padding:'14px 28px', borderRadius:'12px', fontWeight:'600', fontSize:'14px', border:'1px solid #374151' }}>
            ✉️ associazionelacolom75@gmail.com
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0A0A0A', color:'#6B7280', padding:'24px 20px', textAlign:'center', fontSize:'12px' }}>
        <p>© {new Date().getFullYear()} ItalianiPro — Accompagnement documentaire uniquement · Aucune garantie d'emploi, visa ou nulla osta</p>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
