// ============================================================
// ITALIANIPRO — Middleware (Auth Guard) — Firebase
// ============================================================
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/legal',
  '/api/payments/webhook',
  '/api/ai',
]

const ADMIN_ROLES = ['admin', 'super_admin', 'agent', 'coach']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques → passer directement
  const isPublic = PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )
  if (isPublic) return NextResponse.next()

  // Lire le cookie firebase-token (écrit par auth.ts après login)
  const token = request.cookies.get('firebase-token')?.value
  const role  = request.cookies.get('firebase-role')?.value ?? 'candidate'

  // Pas connecté → rediriger vers login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Déjà connecté + page login/register → rediriger vers dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    const dest = ADMIN_ROLES.includes(role) ? '/admin/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Route admin → vérifier le rôle
  if (pathname.startsWith('/admin')) {
    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}