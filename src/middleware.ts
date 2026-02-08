import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    // Check if token exists and is not expired
    const now = Math.floor(Date.now() / 1000);
    const tokenExpired = token?.exp && now > token.exp;
    const isAuth = !!token && !tokenExpired;

    // If token is expired, redirect to login
    if (tokenExpired) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
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
