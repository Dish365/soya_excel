import { NextResponse } from 'next/server';

export function middleware() {
  // Since we're using localStorage for JWT tokens (which isn't accessible in middleware),
  // we'll handle authentication checks on the client side in each protected page
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 