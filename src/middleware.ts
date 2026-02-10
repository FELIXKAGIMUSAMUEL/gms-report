import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    // Security headers
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Check if token exists and is not expired
    const now = Math.floor(Date.now() / 1000);
    const tokenExpired = token?.exp && now > token.exp;
    const isAuth = !!token && !tokenExpired;

    // If token is expired, redirect to login
    if (tokenExpired) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // CSRF Protection: Validate origin for state-changing requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      
      if (origin || referer) {
        const allowedOrigins = [
          process.env.NEXTAUTH_URL,
          'http://localhost:3003',
          'http://localhost:3000',
        ].filter(Boolean);
        
        const requestOrigin = origin || referer;
        const isValidOrigin = allowedOrigins.some(allowed => 
          requestOrigin?.startsWith(allowed || '')
        );
        
        if (!isValidOrigin) {
          console.warn(`CSRF: Invalid origin ${requestOrigin}`);
          return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
          );
        }
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without token
        if (req.nextUrl.pathname === "/login") {
          return true;
        }
        
        // Check if token is valid and not expired
        if (!token) return false;
        const now = Math.floor(Date.now() / 1000);
        return !token.exp || now < token.exp;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect all routes except login, api routes, and static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api (API routes)
     * - /_next (Next.js internals)
     * - /static (static files)
     * - /*.* (files with extensions)
     * - /login (login page)
     */
    "/((?!api|_next|static|login|.*\\..*).*)",
  ],
};
