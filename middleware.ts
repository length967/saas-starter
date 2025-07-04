import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/tcp-session';

const publicRoutes = ['/sign-in', '/sign-up', '/'];
const authRoutes = ['/sign-in', '/sign-up'];
const apiRoutes = '/api';
const agentRoutes = '/api/agent';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const authHeader = request.headers.get('authorization');
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  const isApiRoute = pathname.startsWith(apiRoutes);
  const isAgentRoute = pathname.startsWith(agentRoutes);
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute && sessionCookie) {
    try {
      await verifyToken(sessionCookie.value);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Invalid session, continue to auth page
    }
  }
  
  // API routes - check for Bearer token (agent or user API access)
  if (isApiRoute) {
    // Agent routes require agent authentication
    if (isAgentRoute) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }
      // Agent auth will be handled in the API route itself
      return NextResponse.next();
    }
    
    // Other API routes can use either session cookie or Bearer token
    if (!sessionCookie && !authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.next();
  }
  
  // Public routes - no auth required
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Protected routes - require session
  if (!sessionCookie) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  let res = NextResponse.next();
  
  // Refresh session token on GET requests
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      
      // Only refresh user sessions (not agent sessions)
      if (parsed.type === 'user') {
        const expiresInSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        res.cookies.set({
          name: 'session',
          value: await signToken({
            ...parsed,
            expires: expiresInSevenDays.toISOString()
          }),
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          expires: expiresInSevenDays
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      
      if (!isPublicRoute) {
        const url = new URL('/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};