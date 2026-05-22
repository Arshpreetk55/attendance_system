import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't need auth
const PUBLIC_ROUTES = ['/', '/student/login', '/teacher/login', '/admin/login']

// Role-based route prefixes
const ROLE_ROUTES: Record<string, string> = {
  '/student': 'student',
  '/teacher': 'teacher',
  '/admin':   'admin',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow API routes and Next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Let client-side auth handle redirects for protected routes
  // (Firebase auth is client-side, so we just pass through here)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
