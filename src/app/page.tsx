'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, CheckCircle, AlertTriangle, Clock, Calendar,
  FileText, Users, Star, Shield, ChevronDown, MessageCircle,
  Globe, BookOpen, Zap, Target, TrendingUp, Award, Phone,
  Mail, Facebook, Layers, RefreshCw, BarChart2, Heart,
  GraduationCap, Plane
} from 'lucide-react'

function useDaysUntil(dateStr: string) {
  const [days, setDays] = useState(0)
  useEffect(() => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    setDays(Math.max(0, diff))
  }, [dateStr])
  return days
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = target / 60
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 24)
        observer.disconnect()
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-5 text-left gap-4 group">
        <span className="font-semibold text-white group-hover:text-gold-300 transition text-sm sm:text-base leading-snug">{q}</span>
        <ChevronDown size={18} className={`text-gold-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-gray-400 text-sm leading-relaxed">{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const days = useDaysUntil('2027-01-12')

  const FLUSSI_NEXT = [
    { date: '2027-01-12', label: 'Saisonniers Agricoles',    dot: 'bg-green-400'  },
    { date: '2027-02-09', label: 'Saisonniers Tourisme',     dot: 'bg-blue-400'   },
    { date: '2027-02-16', label: 'Non Saisonniers Généraux', dot: 'bg-indigo-400' },
    { date: '2027-02-18', label: 'Assistance Familiale',     dot: 'bg-purple-400' },
  ]

  return (
    <div className="min-h-screen bg-[#060e24] text-white font-sans overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#060e24]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-navy-900 font-black text-sm">IP</span>
            </div>
            <span className="font-black text-lg tracking-tight">Italiani<span className="text-gold-400">Pro</span></span>
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm text-gray-300">
            <a href="#comprendre" className="hover:text-white transition">Comprendre le Flusso</a>
            <a href="#methode" className="hover:text-white transition">Notre méthode</a>
            <a href="#packs" className="hover:text-white transition">Packs</a>
            <a href="#flussi" className="hover:text-white transition">Calendrier</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-xl transition">
              <MessageCircle size={13} /> WhatsApp
            </a>
            <Link href="/login" className="text-xs text-gray-300 hover:text-white px-3 py-2 transition">Connexion</Link>
            <Link href="/register" className="text-xs bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-4 py-2 rounded-xl transition">
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* DISCLAIMER */}
      <div className="fixed top-16 w-full z-40 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-[11px] text-amber-300">
        <AlertTriangle className="inline w-3 h-3 mr-1 mb-0.5" />
        ItalianiPro est une plateforme d'<strong>accompagnement documentaire uniquement</strong> — Aucune garantie d'emploi, visa ou nulla osta.
      </div>

      {/* HERO */}
      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#060e24] to-[#030810]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold-500/4 rounded-full blur-3xl" />
        <div className="absolute top-40 right-0 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full mb-8">
            <Clock size={12} />
            Prochain Click Day Flussi 2027 dans <strong className="text-gold-200 ml-1">{days} jours</strong>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] mb-6">
            La <span className="text-gold-400">phase la plus cruciale</span><br />
            de votre immigration<br />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-300 block mt-3">
              commence ici, avant le Click Day.
            </span>
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto mb-6 leading-relaxed">
            Le Flusso Migratoire Italien vous donne une chance d'entrer légalement en Italie pour travailler.
            Mais <strong className="text-white">cette chance dépend directement de la qualité et du nombre de vos candidatures</strong>.
            ItalianiPro vous aide à maximiser vos probabilités.
          </p>

          <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5 max-w-2xl mx-auto mb-10">
            <div className="flex gap-3 items-start text-left">
              <Zap size={18} className="text-gold-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gold-200 leading-relaxed">
                <strong>Notre principe fondateur :</strong> Plus votre dossier est complet, plus vous postulez à d'offres,
                et plus votre CV et lettre de motivation sont impeccables —
                <strong> plus votre probabilité d'être contacté par un employeur italien augmente.</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-black px-8 py-4 rounded-2xl text-base transition shadow-gold">
              Démarrer mon accompagnement <ArrowRight size={20} />
            </Link>
            <a href="#comprendre"
              className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/5 px-8 py-4 rounded-2xl text-base transition">
              <BookOpen size={18} /> Comprendre le Flusso
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { n: 500, s: '+', l: 'Dossiers accompagnés' },
              { n: 96,  s: '%', l: 'Satisfaction client'  },
              { n: 24,  s: '/7',l: 'Support disponible'  },
              { n: 3,   s: ' pays', l: 'Équipe présente'  },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-2xl sm:text-3xl font-black text-gold-400">
                  <Counter target={s.n} suffix={s.s} />
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION PÉDAGOGIQUE */}
      <section id="comprendre" className="py-24 bg-gradient-to-b from-[#060e24] to-[#0a1a3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs px-4 py-2 rounded-full mb-4">
              <GraduationCap size={13} /> Module pédagogique
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Qu'est-ce que le <span className="text-gold-400">Flusso Migratoire</span> Italien ?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Tout comprendre en 5 minutes. Cette information peut <strong className="text-white">changer votre vie</strong>.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gold-500/20 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-gold-400" />
                </div>
                <h3 className="text-xl font-bold">La définition simple</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Le <strong className="text-white">Decreto Flussi</strong> est une loi italienne qui, chaque année,
                fixe un <strong className="text-gold-300">quota de travailleurs étrangers extra-UE</strong> autorisés
                à entrer légalement en Italie pour travailler.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Ce quota est réparti par catégories : agriculture, tourisme, soins à domicile, secteurs généraux.
                À une date précise appelée <strong className="text-white">"Click Day"</strong>, les employeurs italiens
                soumettent leurs demandes en ligne. Les places partent en quelques <strong className="text-red-300">secondes ou minutes</strong>.
              </p>
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 text-sm text-gold-200">
                💡 <strong>En résumé :</strong> C'est la voie légale principale pour les travailleurs africains francophones en Italie.
              </div>
            </div>

            <div className="space-y-3">
              {[
                { step:'01', icon:Users,    color:'text-blue-400',   bg:'bg-blue-500/10',
                  title:"L'État italien fixe les quotas",
                  desc:"Le gouvernement publie le nombre de travailleurs autorisés par secteur (ex: 40 000 agricoles, 15 000 tourisme…)." },
                { step:'02', icon:Calendar, color:'text-green-400',  bg:'bg-green-500/10',
                  title:"Le Click Day arrive",
                  desc:"À une date fixe, les employeurs ayant déjà trouvé un candidat soumettent leur demande de Nulla Osta en ligne. Les places partent en quelques minutes." },
                { step:'03', icon:FileText, color:'text-gold-400',   bg:'bg-gold-500/10',
                  title:"L'employeur vous choisit",
                  desc:"Pour qu'un employeur soumette votre dossier, il doit vous avoir identifié AVANT le Click Day. Votre CV, votre lettre et votre profil doivent l'avoir convaincu." },
                { step:'04', icon:Shield,   color:'text-purple-400', bg:'bg-purple-500/10',
                  title:"Le Nulla Osta est accordé",
                  desc:"Si accepté, l'employeur vous transmet le Nulla Osta. Vous pouvez alors faire votre demande de visa de travail à l'ambassade d'Italie." },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold mb-0.5">ÉTAPE {s.step}</div>
                    <div className="font-bold text-white text-sm mb-1">{s.title}</div>
                    <div className="text-gray-400 text-xs leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Point crucial */}
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-500/30 rounded-3xl p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
              Pourquoi cette phase est <span className="text-red-400">la plus cruciale</span> de votre immigration
            </h3>
            <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-base mb-6">
              La plupart des candidats pensent que le Click Day est une loterie. <strong className="text-white">Ce n'est pas vrai.</strong>{' '}
              Les employeurs italiens cherchent activement des profils <em>avant</em> le Click Day.
              Celui qui a un <strong className="text-gold-300">dossier propre, un CV sans fautes, une lettre personnalisée,
              et qui a postulé à de nombreuses offres</strong> a une probabilité bien plus élevée d'être sélectionné.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { icon:'📄', title:'Dossier complet',         desc:"Zéro pièce manquante = employeur rassuré" },
                { icon:'🎯', title:'Multiplier les candidatures', desc:"Plus vous postulez, plus vous avez de chances" },
                { icon:'✍️', title:'CV & lettre impeccables', desc:"L'employeur vous choisit sur votre présentation" },
              ].map((p, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <div className="font-bold text-sm mb-1">{p.title}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MÉTHODE */}
      <section id="methode" className="py-24 bg-[#0a1a3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full mb-4">
              <Target size={13} /> Notre approche
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Comment nous <span className="text-gold-400">maximisons vos chances</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Notre objectif : relancer votre dossier le plus de fois possible auprès du plus grand nombre d'employeurs italiens.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { icon:FileText,  color:'bg-blue-500/20 text-blue-400',   title:'Dossier sans faute',        desc:"Nous vérifions chaque document. Un dossier incomplet est rejeté immédiatement par l'employeur." },
              { icon:RefreshCw, color:'bg-gold-500/20 text-gold-400',   title:'Relances multiples',        desc:"Nous republions votre candidature auprès de nombreux employeurs italiens. Plus de candidatures = plus de chances." },
              { icon:Award,     color:'bg-green-500/20 text-green-400', title:'CV optimisé pour l\'Italie',desc:"CV adapté aux standards italiens, sans fautes, avec les bons mots-clés. Disponible en FR, EN et IT." },
              { icon:Layers,    color:'bg-purple-500/20 text-purple-400',title:'Lettres personnalisées',   desc:"Une lettre générique n'intéresse personne. Nous personnalisons par secteur et région d'Italie ciblée." },
              { icon:BarChart2, color:'bg-red-500/20 text-red-400',     title:'Suivi & relances auto',     desc:"Notre plateforme suit chaque candidature et envoie des relances intelligentes pour rester visible." },
              { icon:Shield,    color:'bg-indigo-500/20 text-indigo-400',title:'Preuves horodatées',       desc:"Chaque action de notre équipe est documentée. Vous voyez exactement ce qui a été fait, quand." },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 card-hover group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Probabilités */}
          <div className="bg-gradient-to-r from-[#060e24] to-[#0a1a3d] border border-gold-500/20 rounded-3xl p-8">
            <h3 className="text-xl font-black text-center mb-8 text-gold-300">
              📊 La logique des probabilités — Pourquoi multiplier les candidatures
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { n:'1',   label:'candidature',  prob:'2%',   color:'text-red-400',    bg:'bg-red-500/10'    },
                { n:'10',  label:'candidatures', prob:'18%',  color:'text-orange-400', bg:'bg-orange-500/10' },
                { n:'50+', label:'candidatures', prob:'65%+', color:'text-green-400',  bg:'bg-green-500/10'  },
              ].map((p, i) => (
                <div key={i} className={`rounded-2xl p-6 border border-white/10 ${p.bg}`}>
                  <div className="text-4xl font-black text-white mb-1">{p.n}</div>
                  <div className="text-sm text-gray-400 mb-4">{p.label}</div>
                  <div className={`text-3xl font-black ${p.color}`}>{p.prob}</div>
                  <div className="text-xs text-gray-500 mt-1">probabilité estimée</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">* Estimations indicatives. Non garanties.</p>
          </div>
        </div>
      </section>

      {/* CALENDRIER FLUSSI */}
      <section id="flussi" className="py-24 bg-[#060e24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-2 rounded-full mb-4">
              <Clock size={13} /> Les dates 2026 sont passées
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Calendrier Click Day <span className="text-gold-400">Flussi 2027</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Préparez votre dossier <strong className="text-white">dès maintenant</strong>.
              Les employeurs cherchent leurs candidats <strong className="text-white">plusieurs mois à l'avance</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {FLUSSI_NEXT.map((e, i) => {
              const d = Math.max(0, Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000))
              const parts = e.date.split('-')
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center card-hover">
                  <div className={`w-8 h-1.5 rounded-full ${e.dot} mx-auto mb-4`} />
                  <div className="text-xs text-gray-500 mb-1">Click Day 2027</div>
                  <div className="text-3xl font-black text-white mb-1">{parts[2]}/{parts[1]}</div>
                  <div className="text-xs text-gray-300 font-medium mb-4">{e.label}</div>
                  {d > 0 ? (
                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl py-3">
                      <div className="text-2xl font-black text-gold-400">{d}</div>
                      <div className="text-[10px] text-gray-500">jours restants</div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-xl py-3 text-xs text-gray-500">Passé</div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 items-start">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 mb-1">Rappel légal important</div>
              <p className="text-sm text-gray-400 leading-relaxed">
                ItalianiPro vous aide à <strong className="text-white">préparer et organiser votre dossier</strong>.
                Nous ne déposons aucune demande de Nulla Osta. Cette démarche officielle est effectuée par l'employeur
                via le portail Sportello Unico delle Immigrazioni. ItalianiPro n'est pas une agence d'immigration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PACKS */}
      <section id="packs" className="py-24 bg-[#0a1a3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full mb-4">
              <Star size={13} /> Nos offres
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Choisissez votre pack</h2>
            <p className="text-gray-400">Paiement Mobile Money accepté · MTN · Orange Money · XAF</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name:'Pack CV', price:'45 000 XAF', badge:null,
                border:'border-white/10', bg:'bg-white/5',
                btn:'bg-white/10 hover:bg-white/20 text-white border border-white/20',
                features:['Analyse complète de votre CV','Corrections professionnelles','Version française & anglaise','1 lettre de motivation type','Conseils sectoriels']
              },
              {
                name:'Pack Dossier Complet', price:'120 000 XAF', badge:'Le plus choisi',
                border:'border-gold-400/50', bg:'bg-gradient-to-b from-navy-800 to-navy-900',
                btn:'bg-gold-500 hover:bg-gold-400 text-navy-900',
                features:['Checklist personnalisée','Vérification de tous vos documents','CV optimisé inclus','3 lettres de motivation','Relances employeurs x10','Export PDF dossier complet','Suivi 30 jours']
              },
              {
                name:'Pack Premium', price:'350 000 XAF', badge:null,
                border:'border-white/10', bg:'bg-white/5',
                btn:'bg-white/10 hover:bg-white/20 text-white border border-white/20',
                features:['Tout le Pack Dossier','4 séances de coaching vidéo','Simulation entretien employeur','Relances employeurs x50+','Priorité de traitement','Lettre en italien incluse','Suivi 90 jours','Support WhatsApp dédié']
              },
            ].map((p, i) => (
              <div key={i} className={`relative border rounded-3xl overflow-hidden transition-all card-hover ${p.border} ${p.bg} ${i===1?'scale-[1.02]':''}`}>
                {p.badge && (
                  <div className="absolute top-4 right-4 bg-gold-500 text-navy-900 text-xs font-black px-3 py-1 rounded-full">{p.badge}</div>
                )}
                <div className="p-8">
                  <div className="text-sm text-gray-400 font-medium mb-2">{p.name}</div>
                  <div className="text-3xl font-black text-white mb-1">{p.price}</div>
                  <div className="text-xs text-gray-500 mb-8">Paiement unique ou échelonné</div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <CheckCircle size={14} className="text-gold-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`w-full block text-center py-3 rounded-xl font-bold text-sm transition ${p.btn}`}>
                    Sélectionner ce pack
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">
            Paiement sécurisé · MTN Mobile Money · Orange Money · Carte bancaire
          </p>
        </div>
      </section>

      {/* SERVICES FUTURS */}
      <section className="py-16 bg-[#060e24]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="text-xl font-black mb-2">Bientôt disponible</h3>
            <p className="text-gray-400 text-sm mb-6">Notre ambition : vous accompagner sur tous vos projets vers l'Italie.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon:GraduationCap, label:'Visa Étudiant',         desc:'Dossier université italienne', color:'text-blue-400'  },
                { icon:Plane,         label:'Visa Tourisme',          desc:'Dossier Schengen & touriste',  color:'text-green-400' },
                { icon:Heart,         label:'Regroupement familial',  desc:'Rejoindre un proche en Italie',color:'text-pink-400'  },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 min-w-[160px]">
                  <s.icon size={24} className={s.color} />
                  <div className="font-bold text-sm">{s.label}</div>
                  <div className="text-[10px] text-gray-500 text-center">{s.desc}</div>
                  <span className="text-[10px] bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">Bientôt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#0a1a3d]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Questions fréquentes</h2>
          </div>
          {[
            { q:"Qu'est-ce que le Flusso Migratoire exactement ?",
              a:"Le Decreto Flussi est une loi italienne qui fixe chaque année le nombre de travailleurs extra-UE autorisés à entrer en Italie pour travailler. Des dates précises (Click Days) sont fixées par catégorie : agriculture, tourisme, soins à domicile, secteurs généraux. C'est la voie légale principale pour les travailleurs africains francophones en Italie." },
            { q:"Est-ce que vous garantissez un emploi ou un Nulla Osta ?",
              a:"Non. ItalianiPro est une plateforme d'accompagnement documentaire. Nous préparons votre dossier et multiplions vos candidatures pour augmenter vos chances. Mais la décision finale appartient à l'employeur et aux autorités italiennes. Toute plateforme qui vous garantit un Nulla Osta vous ment." },
            { q:"Pourquoi mon CV doit-il être irréprochable ?",
              a:"Parce que les employeurs italiens reçoivent des dizaines de candidatures. Un CV avec des fautes, mal présenté ou trop générique est immédiatement écarté. Notre équipe optimise votre CV selon les standards italiens, le traduit si nécessaire, et le personnalise pour votre secteur cible." },
            { q:"Combien de candidatures doit-on envoyer ?",
              a:"Le maximum possible. Avec notre Pack Premium, nous relançons votre dossier auprès de 50+ employeurs italiens dans votre secteur. 1 candidature = 2% de chances. 50 candidatures = 65%+ de chances. C'est notre engagement principal." },
            { q:"Peut-on payer en Mobile Money ?",
              a:"Oui, absolument. Nous acceptons MTN Mobile Money, Orange Money et Airtel Money pour les paiements en XAF. Des paiements par carte bancaire internationale sont également disponibles. Le paiement peut être fait en plusieurs fois." },
            { q:"Les dates 2026 sont passées. Est-il trop tard ?",
              a:"Non ! Le prochain cycle commence le 12 janvier 2027. Et c'est maintenant qu'il faut se préparer. Les employeurs identifient leurs candidats plusieurs mois à l'avance. Plus vous commencez tôt, plus vous avez de chances." },
          ].map((f, i) => <FaqItem key={i} {...f} />)}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-[#060e24]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-300 text-xs px-4 py-2 rounded-full mb-6">
            <Phone size={12} /> Disponible 24h/24 — 7j/7
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            Une question ? <span className="text-gold-400">Contactez-nous</span>
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Notre équipe est disponible à toute heure pour vous orienter et répondre à vos questions.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
              className="bg-green-600/20 border border-green-500/30 hover:border-green-400/60 rounded-2xl p-6 text-center transition card-hover group">
              <div className="w-12 h-12 mx-auto bg-green-600/30 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageCircle size={24} className="text-green-400" />
              </div>
              <div className="font-bold text-white mb-1">WhatsApp</div>
              <div className="text-green-400 font-mono text-sm">+39 329 963 9430</div>
              <div className="text-xs text-gray-500 mt-2">Réponse en moins de 2h</div>
            </a>

            <a href="mailto:associazionelacolom75@gmail.com"
              className="bg-blue-600/20 border border-blue-500/30 hover:border-blue-400/60 rounded-2xl p-6 text-center transition card-hover group">
              <div className="w-12 h-12 mx-auto bg-blue-600/30 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mail size={24} className="text-blue-400" />
              </div>
              <div className="font-bold text-white mb-1">Email</div>
              <div className="text-blue-400 text-xs font-medium break-all">associazionelacolom75@gmail.com</div>
              <div className="text-xs text-gray-500 mt-2">Réponse sous 24h</div>
            </a>

            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-indigo-600/30 rounded-2xl flex items-center justify-center mb-3">
                <Facebook size={24} className="text-indigo-400" />
              </div>
              <div className="font-bold text-white mb-1">Facebook</div>
              <div className="text-xs text-gray-400 mb-3">Suivez nos actualités Flussi</div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full">Page bientôt disponible</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-navy-900 to-[#0a1a3d] border border-gold-400/20 rounded-3xl p-10">
            <h3 className="text-2xl sm:text-3xl font-black mb-3">
              Commencez <span className="text-gold-400">dès aujourd'hui</span>
            </h3>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              Chaque semaine compte. Les employeurs italiens commencent leurs recherches bien avant le Click Day.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-black px-10 py-4 rounded-2xl text-lg transition shadow-gold">
              Créer mon espace gratuitement <ArrowRight size={22} />
            </Link>
            <p className="mt-4 text-xs text-gray-600">Inscription gratuite · Sans engagement · Paiement sécurisé</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#030810] border-t border-white/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-400 font-black text-sm">IP</span>
                </div>
                <span className="font-black text-white">Italiani<span className="text-gold-400">Pro</span></span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Plateforme d'accompagnement documentaire pour la préparation de candidature vers l'Italie. Ni agence d'emploi, ni agence de visa.
              </p>
              <div className="flex gap-3">
                <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center hover:bg-green-600/30 transition">
                  <MessageCircle size={16} className="text-green-400" />
                </a>
                <a href="mailto:associazionelacolom75@gmail.com"
                  className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center hover:bg-blue-600/30 transition">
                  <Mail size={16} className="text-blue-400" />
                </a>
                <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center opacity-40 cursor-not-allowed" title="Bientôt">
                  <Facebook size={16} className="text-indigo-400" />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Services</div>
              <div className="space-y-2.5 text-xs text-gray-500">
                <Link href="/register" className="block hover:text-white transition">Accompagnement Flussi</Link>
                <div className="text-gray-600">Visa Étudiant (bientôt)</div>
                <div className="text-gray-600">Visa Tourisme (bientôt)</div>
                <Link href="#packs" className="block hover:text-white transition">Nos packs & tarifs</Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Comprendre</div>
              <div className="space-y-2.5 text-xs text-gray-500">
                <a href="#comprendre" className="block hover:text-white transition">Qu'est-ce que le Flusso ?</a>
                <a href="#methode" className="block hover:text-white transition">Notre méthode</a>
                <a href="#flussi" className="block hover:text-white transition">Calendrier Click Day 2027</a>
                <Link href="/resources" className="block hover:text-white transition">Ressources gratuites</Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact 24h/7j</div>
              <div className="space-y-3 text-xs text-gray-500">
                <a href="https://wa.me/393299639430" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-green-400 transition">
                  <MessageCircle size={13} className="text-green-500 shrink-0" />
                  +39 329 963 9430
                </a>
                <a href="mailto:associazionelacolom75@gmail.com"
                  className="flex items-start gap-2 hover:text-blue-400 transition break-all">
                  <Mail size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  associazionelacolom75@gmail.com
                </a>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-green-400">Disponible maintenant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} ItalianiPro — Tous droits réservés</span>
            <div className="flex gap-4">
              <Link href="/legal/cgu" className="hover:text-white transition">CGU</Link>
              <Link href="/legal/privacy" className="hover:text-white transition">Confidentialité</Link>
              <Link href="/legal/disclaimer" className="hover:text-white transition">Disclaimer</Link>
            </div>
            <span className="text-center text-gray-700">Aucune garantie d'emploi, visa ou Nulla Osta n'est offerte.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
