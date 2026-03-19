import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'
import { FieldValue } from 'firebase-admin/firestore'

const ADMIN_ROLES = ['admin','super_admin','agent']

async function verifyAdmin(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') ?? ''
    const token  = cookie.match(/ip_token=([^;]+)/)?.[1]
      || req.headers.get('authorization')?.replace('Bearer ','')
    if (!token) return null
    const { adminAuth } = await import('@/lib/admin')
    const decoded = await adminAuth().verifyIdToken(token)
    const snap    = await adminDb().collection('users').doc(decoded.uid).get()
    const role    = snap.data()?.role ?? 'candidat'
    if (!ADMIN_ROLES.includes(role)) return null
    return { uid: decoded.uid, role }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error:'Non autorisé' }, { status:401 })

  const body = await req.json()
  const { action, candidateId } = body

  if (!action || !candidateId) {
    return NextResponse.json({ error:'action et candidateId requis' }, { status:400 })
  }

  try {
    // Récupérer les données du candidat
    const [userSnap, dossierSnap, docsSnap] = await Promise.all([
      adminDb().collection('users').doc(candidateId).get(),
      adminDb().collection('dossiers').doc(candidateId).get(),
      adminDb().collection('documents').where('uid','==',candidateId).get(),
    ])

    if (!userSnap.exists) {
      return NextResponse.json({ error:'Candidat introuvable' }, { status:404 })
    }

    const user    = userSnap.data()!
    const dossier = dossierSnap.data() ?? {}
    const docs    = docsSnap.docs.map(d => d.data())
    const apiKey  = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error:'OPENAI_API_KEY non configurée' }, { status:500 })

    const prompt = buildPrompt(action, user, dossier, docs)
    if (!prompt) return NextResponse.json({ error:`Action inconnue: ${action}` }, { status:400 })

    // Appel OpenAI
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role:'system', content: COMPLIANCE_SYSTEM },
          { role:'user',   content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      return NextResponse.json({ error:`OpenAI error: ${err.slice(0,200)}` }, { status:500 })
    }

    const aiData = await aiRes.json()
    const text   = aiData.choices?.[0]?.message?.content ?? ''

    // Logger dans Firestore
    await adminDb().collection('ai_runs').add({
      candidateId, action, triggeredBy: admin.uid,
      output: text, model:'gpt-4o-mini',
      created_at: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success:true, result:{ output:{ cvText:text, letterText:text, messageText:text, summaryFr:text, suggestedAction:text, clientMessageFr:text, summary:text } } })

  } catch (err) {
    console.error('[AI/run]', err)
    return NextResponse.json({ error:(err as Error).message }, { status:500 })
  }
}

const COMPLIANCE_SYSTEM = `Tu es un assistant de la plateforme ItalianiPro, service d'accompagnement documentaire.
RÈGLES ABSOLUES :
- Ne jamais promettre un emploi, un visa ou une nulla osta
- Ne jamais affirmer qu'un employeur est garanti
- Rester dans le cadre : préparation documentaire, CV, lettre, coaching
- Ton : professionnel, rassurant, factuel
- Langue : français sauf si explicitement demandé en italien`

function buildPrompt(action: string, user: any, dossier: any, docs: any[]): string | null {
  const nom      = user.full_name ?? '—'
  const profession = dossier.profession ?? '—'
  const exp      = dossier.annees_experience ?? 0
  const secteur  = dossier.secteur_cible ?? '—'
  const region   = dossier.region_italie ?? '—'
  const etudes   = dossier.niveau_etudes ?? '—'
  const langues  = Array.isArray(dossier.langues) ? dossier.langues.join(', ') : (dossier.langues ?? '—')
  const exps     = dossier.experiences ?? ''
  const comps    = dossier.competences ?? ''
  const nDocs    = docs.length
  const docsText = docs.map(d => `- ${d.nom||d.name||'document'} (${d.statut||'?'})`).join('\n')

  switch (action) {
    case 'analyze_profile':
      return `Analyse le profil de ce candidat et fournis un résumé structuré.

Candidat : ${nom}
Profession : ${profession}
Expérience : ${exp} an(s)
Études : ${etudes}
Langues : ${langues}
Secteur ciblé en Italie : ${secteur}
Région : ${region}
Expériences décrites : ${exps || '(non renseigné)'}
Compétences : ${comps || '(non renseigné)'}
Documents uploadés : ${nDocs} (${docsText || 'aucun'})

Fournis :
1. Forces du profil (3-5 points)
2. Points à améliorer (2-3 points)
3. Secteurs italiens les plus adaptés
4. Score de préparation estimé sur 100
5. Prochaines actions recommandées
6. Résumé en 3 phrases

Sois factuel et constructif. Ne promets aucun emploi ou visa.`

    case 'generate_checklist':
      return `Génère la checklist des documents manquants pour ce candidat.

Candidat : ${nom}
Secteur ciblé : ${secteur}
Documents déjà uploadés :
${docsText || '(aucun document uploadé)'}

Liste les documents manquants par ordre de priorité pour le Décret Flussi 2027.
Pour chaque document : indique pourquoi il est nécessaire.
Rédige aussi un message professionnel prêt à envoyer au client pour lui demander ces documents.`

    case 'generate_cv_fr':
      return `Génère un CV professionnel en français pour ce candidat.

Nom : ${nom}
Profession : ${profession}
Expérience : ${exp} an(s)
Études : ${etudes}
Langues : ${langues}
Secteur ciblé : ${secteur}
Région Italie : ${region}
Expériences décrites :
${exps || '(non renseigné - indique de compléter le profil)'}
Compétences :
${comps || '(non renseigné)'}

Règles :
- CV structuré et professionnel
- Réécris et améliore les expériences sans inventer
- Adapte au secteur ciblé
- Format : Informations personnelles, Profil, Expériences, Formation, Compétences, Langues
- Si des informations manquent, laisse des espaces à remplir entre [crochets]`

    case 'generate_cv_it':
      return `Crea un CV professionale in italiano per questo candidato.

Nome : ${nom}
Professione : ${profession}
Esperienza : ${exp} anno/anni
Studi : ${etudes}
Lingue : ${langues}
Settore target : ${secteur}
Regione Italia : ${region}
Esperienze descritte :
${exps || '(non specificato)'}
Competenze :
${comps || '(non specificato)'}

Regole :
- CV in italiano professionale (non traduzione letterale)
- Adatta le formule al mercato del lavoro italiano
- Se mancano informazioni, lascia spazi tra [parentesi]
- Struttura : Informazioni personali, Profilo, Esperienze, Formazione, Competenze, Lingue`

    case 'generate_cover_letter':
      return `Rédige une lettre de motivation professionnelle en français pour ce candidat.

Nom : ${nom}
Profession : ${profession}
Secteur ciblé en Italie : ${secteur}
Région Italie : ${region}
Expérience : ${exp} an(s)
Langues : ${langues}

Règles :
- 250-350 mots
- Ton professionnel mais humain
- Met en avant la motivation et la disponibilité
- Adapté au secteur italien ciblé
- Ne garantit aucun emploi ou résultat
- Finir par une formule de politesse classique`

    case 'assist_admin':
      return `En tant qu'assistant admin de la plateforme ItalianiPro, résume l'état du dossier de ce candidat.

Candidat : ${nom}
Profession : ${profession}
Secteur ciblé : ${secteur}
Documents : ${nDocs} (${docsText || 'aucun'})
Expériences renseignées : ${exps ? 'Oui' : 'Non'}
Compétences renseignées : ${comps ? 'Oui' : 'Non'}

Fournis :
1. Résumé de l'état du dossier (2-3 phrases)
2. Prochaine action prioritaire pour l'admin
3. Niveau de priorité : FAIBLE / MOYEN / URGENT
4. Message suggéré à envoyer au client (1-3 phrases, professionnel)
5. Points bloquants éventuels`

    case 'payment_reminder':
      return `Génère un message de relance paiement professionnel pour ce candidat.

Nom : ${nom}
Service : Accompagnement dossier Flussi — ${secteur}

Règles :
- Ton professionnel, poli, non agressif
- Rappeler le service déjà effectué ou en cours
- Expliquer l'importance de finaliser le paiement
- Proposer de contacter par WhatsApp
- 80-120 mots maximum
- Ne jamais menacer ni promettre un résultat`

    case 'prepare_interview':
      return `Prépare ce candidat à un entretien avec un employeur italien.

Candidat : ${nom}
Profession : ${profession}
Secteur ciblé : ${secteur}
Expérience : ${exp} an(s)

Génère :
1. 8 questions probables d'un employeur italien pour ce secteur
2. Pour chaque question : une suggestion de réponse simple et honnête
3. Conseils généraux pour l'entretien (tenue, ponctualité, attitude)
4. Phrases utiles en italien basiques (bonjour, merci, je suis disponible...)`

    default:
      return null
  }
}
