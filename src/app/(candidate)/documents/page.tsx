'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, RefreshCw, FileText, Globe,
  Loader2, CheckCircle, Zap, Copy, Eye
} from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CVVersion {
  id:        string
  lang:      string
  content:   string
  sections?: { title: string; content: string }[]
  keywords?: string[]
  warnings?: string[]
  created_at: any
}

export default function CVPage() {
  const params  = useParams()
  const router  = useRouter()
  const uid     = params.id as string
  const printRef = useRef<HTMLDivElement>(null)

  const [cvVersions, setCvVersions]   = useState<CVVersion[]>([])
  const [selectedCV, setSelectedCV]   = useState<CVVersion | null>(null)
  const [candidateName, setCandidateName] = useState('')
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState<string | null>(null)

  // Charger les CVs générés depuis Firestore
  const loadCVs = async () => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid))
      if (userSnap.exists()) setCandidateName(userSnap.data().full_name ?? '')

      const snap = await getDocs(
        query(collection(db, 'cv_versions'), where('candidate_id', '==', uid))
      )
      const versions = snap.docs.map(d => ({ id: d.id, ...d.data() } as CVVersion))
      setCvVersions(versions)
      if (versions.length > 0) setSelectedCV(versions[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCVs() }, [uid])

  // Générer un CV via l'agent IA
  const generateCV = async (lang: 'fr' | 'it') => {
    setGenerating(lang)
    try {
      const token = document.cookie.match(/firebase-token=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/ai/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: lang === 'fr' ? 'generate_cv_fr' : 'generate_cv_it',
          candidateId: uid,
          options: {}
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`✅ CV en ${lang.toUpperCase()} généré !`)
        await loadCVs()
      } else {
        toast.error(data.error ?? 'Erreur génération CV')
      }
    } catch {
      toast.error('Erreur API')
    } finally {
      setGenerating(null)
    }
  }

  // ✅ Télécharger le CV comme fichier texte / HTML imprimable
  const downloadCV = (format: 'txt' | 'html') => {
    if (!selectedCV) return

    let content = ''
    let filename = `CV_${candidateName.replace(/\s+/g,'_')}_${selectedCV.lang.toUpperCase()}`
    let type = ''

    if (format === 'txt') {
      content  = `${candidateName}\n${'='.repeat(50)}\n\n${selectedCV.content}`
      filename += '.txt'
      type      = 'text/plain'
    } else {
      content = `
<!DOCTYPE html>
<html lang="${selectedCV.lang}">
<head>
  <meta charset="UTF-8">
  <title>CV — ${candidateName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.6; }
    h1   { color: #0f2454; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }
    h2   { color: #1e4789; margin-top: 30px; border-left: 4px solid #f59e0b; padding-left: 12px; }
    p    { margin: 8px 0; }
    .keywords { margin-top: 20px; padding: 10px; background: #f8fafc; border-radius: 8px; }
    .keyword  { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${candidateName}</h1>
  ${selectedCV.sections
    ? selectedCV.sections.map(s => `<h2>${s.title}</h2><p>${s.content.replace(/\n/g,'<br>')}</p>`).join('')
    : `<p>${selectedCV.content.replace(/\n/g,'<br>')}</p>`
  }
  ${selectedCV.keywords?.length
    ? `<div class="keywords"><strong>Mots-clés :</strong><br>${selectedCV.keywords.map(k=>`<span class="keyword">${k}</span>`).join('')}</div>`
    : ''
  }
  <p style="color:#999;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:10px">
    Généré par ItalianiPro — Accompagnement documentaire
  </p>
</body>
</html>`
      filename += '.html'
      type      = 'text/html'
    }

    const blob = new Blob([content], { type })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`📥 CV téléchargé : ${filename}`)
  }

  // Imprimer / Sauvegarder en PDF via le navigateur
  const printCV = () => {
    if (!selectedCV || !printRef.current) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>CV — ${candidateName}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.6; }
        h1   { color: #0f2454; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }
        h2   { color: #1e4789; margin-top: 25px; border-left: 4px solid #f59e0b; padding-left: 12px; }
        pre  { white-space: pre-wrap; font-family: Arial, sans-serif; }
      </style>
      </head><body>
      <h1>${candidateName}</h1>
      <pre>${selectedCV.content}</pre>
      </body></html>
    `)
    w.document.close()
    w.print()
    toast.success('🖨️ Fenêtre d\'impression ouverte — Sauvegarde en PDF possible')
  }

  // Copier le texte
  const copyText = () => {
    if (!selectedCV) return
    navigator.clipboard.writeText(selectedCV.content)
    toast.success('📋 Texte copié dans le presse-papier')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
          <ArrowLeft size={16} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-navy-900">CV — {candidateName}</h1>
          <p className="text-gray-500 text-sm">{cvVersions.length} version(s) générée(s)</p>
        </div>
      </div>

      {/* Boutons générer */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => generateCV('fr')} disabled={!!generating}
          className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          {generating === 'fr'
            ? <><Loader2 size={14} className="animate-spin" /> Génération en cours...</>
            : <><Zap size={14} /> Générer CV Français</>
          }
        </button>
        <button onClick={() => generateCV('it')} disabled={!!generating}
          className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          {generating === 'it'
            ? <><Loader2 size={14} className="animate-spin" /> Génération en cours...</>
            : <><Globe size={14} /> Générer CV Italien</>
          }
        </button>
        <button onClick={loadCVs}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {cvVersions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <FileText size={32} className="mx-auto mb-3 text-gray-200" />
          <div className="text-gray-400 text-sm mb-2">Aucun CV généré encore</div>
          <div className="text-xs text-gray-400">
            Clique sur "Générer CV Français" ou "Générer CV Italien" ci-dessus
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Liste versions */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Versions disponibles</div>
            {cvVersions.map(cv => (
              <button key={cv.id} onClick={() => setSelectedCV(cv)}
                className={cn('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition',
                  selectedCV?.id === cv.id
                    ? 'bg-navy-50 border-navy-300'
                    : 'bg-white border-gray-200 hover:border-navy-200')}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs',
                  cv.lang === 'fr' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700')}>
                  {cv.lang.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-navy-900">
                    CV en {cv.lang === 'fr' ? 'Français' : 'Italien'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {cv.created_at?.toDate?.()?.toLocaleDateString('fr-FR') ?? 'Date inconnue'}
                  </div>
                </div>
                {selectedCV?.id === cv.id && (
                  <CheckCircle size={14} className="ml-auto text-navy-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Contenu + actions téléchargement */}
          {selectedCV && (
            <div className="lg:col-span-2 space-y-4">

              {/* Boutons téléchargement */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Télécharger / Exporter
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* PDF via impression navigateur */}
                  <button onClick={printCV}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                    <Download size={14} /> Sauvegarder en PDF
                  </button>
                  {/* HTML */}
                  <button onClick={() => downloadCV('html')}
                    className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                    <Download size={14} /> Télécharger HTML
                  </button>
                  {/* TXT */}
                  <button onClick={() => downloadCV('txt')}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition">
                    <Download size={14} /> Télécharger TXT
                  </button>
                  {/* Copier */}
                  <button onClick={copyText}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition">
                    <Copy size={14} /> Copier le texte
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                  💡 Pour un PDF professionnel : clique "Sauvegarder en PDF" → dans la fenêtre d'impression → "Enregistrer en PDF"
                </p>
              </div>

              {/* Mots-clés */}
              {selectedCV.keywords && selectedCV.keywords.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-indigo-700 mb-2">Mots-clés secteur</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCV.keywords.map((k, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings IA */}
              {selectedCV.warnings && selectedCV.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-amber-700 mb-2">⚠️ Points à vérifier</div>
                  {selectedCV.warnings.map((w, i) => (
                    <div key={i} className="text-xs text-amber-700 mb-1">• {w}</div>
                  ))}
                </div>
              )}

              {/* Aperçu du contenu */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" ref={printRef}>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-navy-900">
                    Aperçu — CV {selectedCV.lang === 'fr' ? 'Français' : 'Italien'}
                  </span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Généré par IA ✅
                  </span>
                </div>
                <div className="p-6">
                  {selectedCV.sections && selectedCV.sections.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCV.sections.map((section, i) => (
                        <div key={i}>
                          <h3 className="font-bold text-navy-800 text-sm border-b border-gray-100 pb-1 mb-2">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {section.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedCV.content}
                    </pre>
                  )}
                </div>
              </div>

              {/* Sites de dépôt suggérés */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-gray-600 mb-3">Sites pour poster ce CV</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name:'Indeed Italie',   url:'https://it.indeed.com',    emoji:'🇮🇹' },
                    { name:'LinkedIn',         url:'https://linkedin.com',     emoji:'💼' },
                    { name:'Infojobs.it',     url:'https://www.infojobs.it',  emoji:'📋' },
                    { name:'Monster Italie',   url:'https://www.monster.it',   emoji:'👾' },
                    { name:'Subito.it',       url:'https://www.subito.it',    emoji:'⚡' },
                    { name:'Agriturismo.it',  url:'https://www.agriturismo.it',emoji:'🌾' },
                  ].map(site => (
                    <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:border-navy-300 hover:bg-navy-50 transition">
                      <span>{site.emoji}</span>
                      {site.name}
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}