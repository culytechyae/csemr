/**
 * Next.js Middleware
 * Applies security headers and CSRF protection globally
 */

import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from './security/middleware/security-headers';
import { setCSRFToken, csrfProtection } from './security/middleware/csrf-protection';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Add security headers to all responses
  addSecurityHeaders(response);

  // Skip CSRF protection for API routes (they use JWT authentication)
  if (pathname.startsWith('/api')) {
    return response;
  }

  // Set CSRF token for GET requests (so frontend can use it)
  if (request.method === 'GET') {
    setCSRFToken(response);
  }

  // Validate CSRF token for state-changing requests (only for non-API routes)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfResponse = csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - excluded because they use JWT auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

