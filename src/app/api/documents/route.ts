import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage, verifyToken } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// ── GET — list documents for a candidate ─────────────────
export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidate_id') ?? user.uid

  const snap = await adminDb()
    .collection('documents')
    .where('candidate_id', '==', candidateId)
    .orderBy('created_at', 'desc')
    .get()

  const documents = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ documents })
}

// ── POST — upload a document ──────────────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData    = await req.formData()
    const file        = formData.get('file') as File
    const candidateId = formData.get('candidate_id') as string
    const docTypeId   = formData.get('document_type_id') as string | null
    const docName     = formData.get('name') as string | null

    if (!file || !candidateId) {
      return NextResponse.json({ error: 'Missing file or candidate_id' }, { status: 400 })
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. PDF, JPG ou PNG uniquement.' }, { status: 400 })
    }

    // Upload to Firebase Storage
    const ext      = file.name.split('.').pop()
    const filename = `${candidateId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())
    const bucket   = adminStorage().bucket()
    const fileRef  = bucket.file(`documents/${filename}`)

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    })

    await fileRef.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/documents/${filename}`

    // Save to Firestore
    const docRef = await adminDb().collection('documents').add({
      candidate_id:     candidateId,
      document_type_id: docTypeId ?? null,
      name:             docName ?? file.name.replace(/\.[^.]+$/, ''),
      original_name:    file.name,
      file_url:         publicUrl,
      file_path:        `documents/${filename}`,
      file_size_bytes:  file.size,
      mime_type:        file.type,
      status:           'uploaded',
      uploaded_by:      user.uid,
      created_at:       FieldValue.serverTimestamp(),
      updated_at:       FieldValue.serverTimestamp(),
    })

    // Update candidate completeness score
    const docsSnap = await adminDb().collection('documents')
      .where('candidate_id', '==', candidateId)
      .where('status', 'in', ['uploaded', 'in_review', 'approved'])
      .get()

    const totalRequired = 8 // adjust based on doc types count
    const score = Math.min(100, Math.round((docsSnap.size / totalRequired) * 100))

    await adminDb().collection('candidate_profiles').doc(candidateId).update({
      completeness_score: score,
      updated_at: FieldValue.serverTimestamp(),
    }).catch(() => {}) // ignore if profile doesn't exist yet

    // Log activity
    await adminDb().collection('activity_logs').add({
      actor_id:    user.uid,
      action:      'document.uploaded',
      entity_type: 'document',
      entity_id:   docRef.id,
      metadata:    { file_name: file.name, candidate_id: candidateId },
      created_at:  FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success:  true,
      document: { id: docRef.id, file_url: publicUrl, name: file.name },
    }, { status: 201 })

  } catch (err) {
    console.error('Document upload error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}

// ── PATCH — update document status (admin only) ──────────
export async function PATCH(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user || !['admin', 'super_admin', 'agent'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { document_id, status, rejection_reason } = body

  if (!document_id || !status) {
    return NextResponse.json({ error: 'Missing document_id or status' }, { status: 400 })
  }

  await adminDb().collection('documents').doc(document_id).update({
    status,
    rejection_reason: rejection_reason ?? null,
    reviewed_by:      user.uid,
    reviewed_at:      FieldValue.serverTimestamp(),
    updated_at:       FieldValue.serverTimestamp(),
  })

  // Notify candidate if rejected
  if (status === 'rejected') {
    const docSnap = await adminDb().collection('documents').doc(document_id).get()
    const doc     = docSnap.data()
    if (doc?.candidate_id) {
      await adminDb().collection('notifications').add({
        user_id:    doc.candidate_id,
        type:       'document_rejected',
        title:      '❌ Document rejeté',
        message:    `Votre document "${doc.name}" a été rejeté : ${rejection_reason ?? 'Corrections requises.'}`,
        is_read:    false,
        action_url: '/documents',
        created_at: FieldValue.serverTimestamp(),
      })
    }
  }

  return NextResponse.json({ success: true })
}
