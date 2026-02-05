import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    
    // Check if token exists and is not expired
    const now = Math.floor(Date.now() / 1000);
    const tokenExpired = token?.exp && now > token.exp;
    const isAuth = !!token && !tokenExpired;

    // If not authenticated or token expired, redirect to login
    if ((!isAuth || tokenExpired) && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If authenticated and trying to access login page, redirect to dashboard
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Check if token is valid and not expired
        if (!token) return false;
        const now = Math.floor(Date.now() / 1000);
        return !token.exp || now < token.exp;
      },
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
     */
    "/((?!api|_next|static|.*\\..*).*)",
  ],
};
