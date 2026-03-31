import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if we are trying to access the admin panel
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('yentech_admin_session')?.value

    if (!session) {
      // No session, redirect to home (or a login page if you have one, but here we use /)
      // Actually, since the admin dashboard itself handles the login overlay,
      // we might want to let it pass but protect the DATA actions.
      // However, for total security, we can redirect or just rely on the component
      // and server actions.
      // For this project, let's just let the route through OR use a separate login page.
      // If we want to hide even the admin page shell, we redirect.
      // Let's redirect to / if no session exists, 
      // but the admin page itself IS the login page if not authenticated.
      // So we shouldn't block the PAGE itself if it's dual-purpose.
      return NextResponse.next()
    }

    try {
      const payload = await decrypt(session)
      if (payload && payload.admin) {
        return NextResponse.next()
      }
    } catch {
      // Invalid session
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
