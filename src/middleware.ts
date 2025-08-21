import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isProtectedRoute = path.startsWith('/dashboard')

  const userId = request.cookies.get('user_id')?.value
  const userEmail = request.cookies.get('user_email')?.value

  if (isProtectedRoute && (!userId || !userEmail)) {
    const signInUrl = new URL('/sign_in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if ((path === '/sign_in' || path === '/sign_up') && userId && userEmail) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sign_in',
    '/sign_up'
  ]
}
