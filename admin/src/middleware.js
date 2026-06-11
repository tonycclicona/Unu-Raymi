import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Si no hay token y se intenta acceder a una ruta protegida
  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya hay token e intenta acceder al login, redirigir al Dashboard
  if (token && pathname === '/login') {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Proteger todas las rutas excepto archivos estáticos, favicon y api routes internas
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
