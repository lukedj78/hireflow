import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Run next-intl middleware first to handle localization
  const response = intlMiddleware(request);

  // Get session from cookie
  const token = request.cookies.get("better-auth.session_token")?.value || request.cookies.get("__Secure-better-auth.session_token")?.value

  const protectedPaths = ["/dashboard", "/settings"]
  
  // Check if path is protected (considering locale prefix)
  const pathname = request.nextUrl.pathname;
  // Remove locale prefix (en or it) to check the base path
  const pathnameWithoutLocale = pathname.replace(/^\/(en|it)/, '') || '/';
  
  const isProtectedPath = protectedPaths.some((path) => 
    pathnameWithoutLocale === path || pathnameWithoutLocale.startsWith(`${path}/`)
  )

  // If accessing protected route without session, redirect to sign-in
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url))
  }

  return response
}

export const config = {
  // Matcher for next-intl (and auth)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
