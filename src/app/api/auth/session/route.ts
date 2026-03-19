// ============================================================
// ITALIANIPRO — API: Create Firebase session cookie
// POST /api/auth/session  { idToken }
// DELETE /api/auth/session  (logout)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000 // 5 days in ms

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

    // Verify token and create session cookie
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    })

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('__session', sessionCookie, {
      maxAge:   SESSION_DURATION / 1000,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
    })

    return response
  } catch (err) {
    console.error('Session error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.set('__session', '', { maxAge: 0, path: '/' })
  return response
}
