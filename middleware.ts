import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  
  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return res;
  }
  
  // Skip auth check if bypass flag is present (for fixing auth loops)
  if (req.nextUrl.searchParams.get('bypass') === 'auth') {
    // Create a new URL without the bypass parameter to clean up
    const newUrl = new URL(req.nextUrl.href);
    newUrl.searchParams.delete('bypass');
    
    // Forward to the clean URL
    return NextResponse.redirect(newUrl);
  }
  
  // Create Supabase client for auth checks
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/find-registry', '/reset-password', '/auth/callback', '/auth/error'];
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    // Routes that require authentication
    const protectedRoutes = ['/dashboard', '/create-registry', '/my-registries', '/settings', '/manage-items'];
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    // Special case for registry pages - accessible by everyone but with different views
    if (pathname.startsWith('/registry/')) {
      return res;
    }
    
    // Redirect authenticated users from login/signup to dashboard
    if (session && (pathname === '/login' || pathname === '/signup')) {
      const redirectUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Redirect unauthenticated users from protected routes to login
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Redirect root path based on auth status
    if (pathname === '/') {
      // If not authenticated, always go to login first
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      // If authenticated, go to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If middleware fails, let the request proceed
    // The client-side will handle auth state appropriately
    return res;
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 