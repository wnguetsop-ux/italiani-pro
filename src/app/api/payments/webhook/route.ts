import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cpm_trans_id, cpm_result, cpm_amount } = body

    if (!cpm_trans_id) return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })

    // Find payment by provider_ref
    const snap = await adminDb().collection('payments')
      .where('provider_ref', '==', cpm_trans_id)
      .limit(1)
      .get()

    if (snap.empty) {
      console.error('Payment not found:', cpm_trans_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const paymentDoc  = snap.docs[0]
    const payment     = paymentDoc.data()
    const isSuccess   = cpm_result === '00'
    const newStatus   = isSuccess ? 'paid' : 'failed'

    // Update payment
    await paymentDoc.ref.update({
      status:        newStatus,
      paid_at:       isSuccess ? FieldValue.serverTimestamp() : null,
      provider_data: body,
      updated_at:    FieldValue.serverTimestamp(),
    })

    if (isSuccess) {
      // Update order
      await adminDb().collection('orders').doc(payment.order_id).update({
        payment_status: 'paid',
        started_at:     FieldValue.serverTimestamp(),
        updated_at:     FieldValue.serverTimestamp(),
      })

      // Update milestone if applicable
      if (payment.milestone_id) {
        await adminDb().collection('milestones').doc(payment.milestone_id).update({
          payment_status: 'paid',
          paid_at:        FieldValue.serverTimestamp(),
        })
      }

      // Generate invoice number
      const invoiceNum = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
      await adminDb().collection('invoices').add({
        payment_id:    paymentDoc.id,
        order_id:      payment.order_id,
        invoice_number: invoiceNum,
        amount_xaf:    payment.amount_xaf,
        issued_at:     FieldValue.serverTimestamp(),
      })

      // Notify candidate
      if (payment.candidate_id) {
        await adminDb().collection('notifications').add({
          user_id:    payment.candidate_id,
          type:       'payment_received',
          title:      '✅ Paiement confirmé',
          message:    `Votre paiement de ${Number(payment.amount_xaf).toLocaleString()} XAF a été reçu. Facture : ${invoiceNum}`,
          is_read:    false,
          action_url: '/payments',
          created_at: FieldValue.serverTimestamp(),
        })
      }

      // Log
      await adminDb().collection('activity_logs').add({
        action:      'payment.confirmed',
        entity_type: 'payment',
        entity_id:   paymentDoc.id,
        metadata:    { amount: payment.amount_xaf, transaction_id: cpm_trans_id },
        created_at:  FieldValue.serverTimestamp(),
      })

    } else {
      // Notify failure
      if (payment.candidate_id) {
        await adminDb().collection('notifications').add({
          user_id:    payment.candidate_id,
          type:       'payment_failed',
          title:      '❌ Paiement échoué',
          message:    'Votre tentative de paiement a échoué. Veuillez réessayer.',
          is_read:    false,
          action_url: '/payments',
          created_at: FieldValue.serverTimestamp(),
        })
      }
    }

    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
