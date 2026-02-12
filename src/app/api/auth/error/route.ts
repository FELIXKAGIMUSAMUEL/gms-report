import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  
  // NextAuth error codes: Callback, OAuthSignin, OAuthCallback, OAuthCreateAccount,
  // EmailCreateAccount, Callback, EmailSignInError, AccessDenied, Verification
  
  // Simply redirect to login with the error parameter
  // (NextAuth's error: "/login" config will handle the redirect)
  return NextResponse.redirect(new URL(`/login?error=${error || "unknown"}`, request.url));
}
