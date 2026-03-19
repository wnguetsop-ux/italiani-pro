import { NextRequest, NextResponse } from 'next/server'
import { adminDb, verifyToken } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { order_id, milestone_id, promo_code } = body

    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })

    // Fetch order from Firestore
    const orderSnap = await adminDb().collection('orders').doc(order_id).get()
    if (!orderSnap.exists) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderSnap.data()!

    // Determine amount
    let amount: number = order.final_price_xaf

    if (milestone_id) {
      const mSnap = await adminDb().collection('milestones').doc(milestone_id).get()
      const m     = mSnap.data()
      if (!m?.is_unlocked) {
        return NextResponse.json({
          error: 'Milestone non débloqué. La preuve de travail doit être validée d\'abord.'
        }, { status: 403 })
      }
      amount = m.amount_xaf
    }

    // Apply promo code
    if (promo_code) {
      const promoSnap = await adminDb().collection('promo_codes')
        .where('code', '==', promo_code)
        .where('is_active', '==', true)
        .limit(1)
        .get()

      if (!promoSnap.empty) {
        const promo    = promoSnap.docs[0].data()
        const discount = promo.discount_type === 'percent'
          ? Math.round(amount * promo.discount_value / 100)
          : promo.discount_value
        amount = Math.max(0, amount - discount)

        await adminDb().collection('orders').doc(order_id).update({
          discount_amount: discount,
          promo_code,
          final_price_xaf: amount,
          updated_at: FieldValue.serverTimestamp(),
        })

        await promoSnap.docs[0].ref.update({
          used_count: FieldValue.increment(1),
        })
      }
    }

    // Create payment record
    const transactionId = `IP-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`

    const paymentRef = await adminDb().collection('payments').add({
      order_id,
      candidate_id:  order.candidate_id,
      amount_xaf:    amount,
      currency:      'XAF',
      provider:      'cinetpay',
      provider_ref:  transactionId,
      status:        'pending',
      milestone_id:  milestone_id ?? null,
      created_at:    FieldValue.serverTimestamp(),
    })

    // Call CinetPay API
    const cinetPayRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey:         process.env.CINETPAY_API_KEY,
        site_id:        process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId,
        amount,
        currency:       'XAF',
        description:    `ItalianiPro — Paiement dossier`,
        notify_url:     `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        return_url:     `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?pid=${paymentRef.id}`,
        customer_email: user.uid,
        channels:       'ALL',
      }),
    })

    const cpData = await cinetPayRes.json()

    if (cpData.code !== '201') {
      console.error('CinetPay error:', cpData)
      return NextResponse.json({ error: 'Erreur passerelle de paiement', details: cpData.message }, { status: 502 })
    }

    // Log
    await adminDb().collection('activity_logs').add({
      actor_id:    user.uid,
      action:      'payment.initiated',
      entity_type: 'payment',
      entity_id:   paymentRef.id,
      metadata:    { amount, transaction_id: transactionId },
      created_at:  FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success:        true,
      payment_id:     paymentRef.id,
      payment_url:    cpData.data?.payment_url,
      transaction_id: transactionId,
    })

  } catch (err) {
    console.error('Payment init error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
