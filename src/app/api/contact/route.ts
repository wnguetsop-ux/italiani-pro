import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nom, phone, email, pack, secteur, message } = body

    if (!nom || !phone || !email) {
      return NextResponse.json({ error: 'Nom, téléphone et email obligatoires' }, { status: 400 })
    }

    // Référence unique
    const ref = `IP-${Date.now().toString(36).toUpperCase()}`

    // Sauvegarder dans Firestore
    await adminDb().collection('contact_requests').add({
      nom: nom.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pack: pack ?? 'Pack Standard',
      secteur: secteur ?? '',
      message: message ?? '',
      reference: ref,
      statut: 'nouveau',
      created_at: FieldValue.serverTimestamp(),
    })

    // Email de confirmation via l'API Resend si configuré
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'ItalianiPro <contact@italianipro.com>',
          to: [email.trim()],
          subject: `✅ Confirmation de votre demande — ItalianiPro`,
          html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;background:#f8f9fc}
.card{background:white;border-radius:14px;padding:28px;border:1px solid #e4e8ef}
.badge{display:inline-block;background:#f0fdf4;color:#15803d;padding:4px 12px;border-radius:99px;font-size:13px;font-weight:600}
h2{color:#1B3A6B;margin:0 0 16px}
.step{display:flex;gap:14px;margin-bottom:14px;align-items:flex-start}
.step-num{width:28px;height:28px;background:#1B3A6B;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;margin-top:2px}
.ref{background:#f3f4f6;font-family:monospace;padding:6px 12px;border-radius:7px;font-size:14px;display:inline-block}
.warning{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:13px;color:#92400e;margin-top:16px}
.whatsapp{display:inline-block;background:#25D366;color:white;padding:10px 20px;border-radius:9px;text-decoration:none;font-weight:600;font-size:14px;margin-top:10px}
.footer{font-size:11px;color:#9ca3af;text-align:center;margin-top:20px;line-height:1.6}
</style></head>
<body>
<div style="text-align:center;margin-bottom:20px">
  <div style="display:inline-flex;align-items:center;gap:10px">
    <div style="width:40px;height:40px;background:#1B3A6B;border-radius:10px;display:flex;align-items:center;justify-content:center">
      <span style="color:#D4A017;font-weight:900;font-size:14px">IP</span>
    </div>
    <span style="font-weight:800;font-size:20px;color:#111827">Italiani<span style="color:#D4A017">Pro</span></span>
  </div>
</div>

<div class="card">
  <div class="badge">✅ Demande reçue et confirmée</div>
  <h2 style="margin-top:14px">Bonjour ${nom},</h2>
  <p style="color:#6b7280;line-height:1.7">Votre demande d'accompagnement a bien été enregistrée. Notre équipe va vous contacter dans les <strong>24 heures</strong> pour démarrer la préparation de votre dossier.</p>

  <div style="background:#f8f9fc;border-radius:10px;padding:16px;margin:16px 0">
    <table style="width:100%;font-size:13px;border-collapse:collapse">
      <tr><td style="color:#6b7280;padding:5px 0">Nom</td><td style="font-weight:600;text-align:right">${nom}</td></tr>
      <tr><td style="color:#6b7280;padding:5px 0">Email</td><td style="font-weight:600;text-align:right">${email}</td></tr>
      <tr><td style="color:#6b7280;padding:5px 0">Téléphone</td><td style="font-weight:600;text-align:right">${phone}</td></tr>
      <tr><td style="color:#6b7280;padding:5px 0">Pack demandé</td><td style="font-weight:600;text-align:right">${pack}</td></tr>
      <tr><td style="color:#6b7280;padding:5px 0">Secteur ciblé</td><td style="font-weight:600;text-align:right">${secteur}</td></tr>
      <tr><td style="color:#6b7280;padding:5px 0">Référence</td><td style="font-weight:600;text-align:right"><span class="ref">${ref}</span></td></tr>
    </table>
  </div>

  <h3 style="font-size:15px;font-weight:700;margin:18px 0 12px;color:#111827">Comment activer votre pack</h3>

  <div class="step">
    <div class="step-num">1</div>
    <div style="font-size:13px;line-height:1.6"><strong>Envoyez votre paiement Mobile Money</strong><br>
    Envoyez le montant de votre pack au <strong>651495483</strong> (MTN ou Orange Cameroun).<br>
    Pack sélectionné : <strong>${pack}</strong></div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div style="font-size:13px;line-height:1.6"><strong>Prenez une capture du reçu de transaction</strong><br>
    Après paiement, votre opérateur affiche un reçu avec un numéro de référence. <strong>Faites une capture d'écran.</strong></div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div style="font-size:13px;line-height:1.6"><strong>Envoyez la capture sur WhatsApp</strong><br>
    Envoyez la capture d'écran + votre nom et cet email à :<br>
    <a href="https://wa.me/393299639430" class="whatsapp">💬 WhatsApp +39 329 963 9430</a>
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div style="font-size:13px;line-height:1.6"><strong>Activation dans les 2 heures</strong><br>
    Dès confirmation du paiement, votre espace est créé et l'accompagnement démarre. Vous recevrez un email avec vos accès.</div>
  </div>

  <div class="warning">
    ⚠️ <strong>Rappel important :</strong> ItalianiPro est un service d'accompagnement documentaire uniquement. Nous ne garantissons pas et n'obtenons pas directement un emploi, une nulla osta ou un visa. La décision appartient à l'employeur et aux autorités italiennes.
  </div>
</div>

<div class="footer">
  ItalianiPro · accompagnement documentaire pour l'Italie<br>
  WhatsApp : +39 329 963 9430 · associazionelacolom75@gmail.com<br>
  Référence de votre demande : <strong>${ref}</strong>
</div>
</body></html>`,
        }),
      })
    }

    // Notification email à l'admin
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'ItalianiPro <contact@italianipro.com>',
          to: ['associazionelacolom75@gmail.com'],
          subject: `🔔 Nouvelle demande — ${nom} — ${pack}`,
          html: `
<h2>Nouvelle demande de contact</h2>
<table style="font-size:14px;border-collapse:collapse;width:100%">
  <tr><td style="padding:6px;color:#6b7280">Nom</td><td style="padding:6px;font-weight:600">${nom}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Email</td><td style="padding:6px">${email}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Téléphone</td><td style="padding:6px">${phone}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Pack</td><td style="padding:6px;font-weight:600">${pack}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Secteur</td><td style="padding:6px">${secteur}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Message</td><td style="padding:6px">${message || '—'}</td></tr>
  <tr><td style="padding:6px;color:#6b7280">Référence</td><td style="padding:6px;font-family:monospace">${ref}</td></tr>
</table>
<a href="https://wa.me/${phone?.replace(/\D/g,'')}" style="display:inline-block;margin-top:14px;background:#25D366;color:white;padding:10px 20px;border-radius:9px;text-decoration:none;font-weight:600">Contacter sur WhatsApp</a>
          `,
        }),
      })
    }

    return NextResponse.json({ success: true, reference: ref })

  } catch (err: any) {
    console.error('[API/contact] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
