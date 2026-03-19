import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/', '/login', '/register', '/api/auth', '/api/webhook']
const ADMIN_ROLES = ['admin', 'super_admin', 'agent']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get('ip_token')?.value
  const role  = req.cookies.get('ip_role')?.value ?? 'candidat'

  // Pas connecté → login
  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Déjà connecté → rediriger depuis login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL(ADMIN_ROLES.includes(role) ? '/admin' : '/dashboard', req.url))
  }

  // Route admin → vérifier le rôle
  if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json).*)'],
}
