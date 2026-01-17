import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host')!;

  // Defina seu domínio base aqui (localhost para dev, agency.com para prod)
  const allowedDomains = ['localhost:3000', 'agency.com'];
  const isLocalhost = hostname.includes('localhost');

  // Lógica de extração de subdomínio
  let subdomain: string | null = null;

  if (isLocalhost) {
    // localhost:3000 -> null
    // admin.localhost:3000 -> admin
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
        subdomain = parts[0];
    }
  } else {
    // agency.com -> null
    // admin.agency.com -> admin
    // dash.agency.com -> dash
    
    // Assumindo que o domínio principal é sempre o final (agency.com)
    // Se hostname for exatamente agency.com, subdomain é null
    if (hostname === 'agency.com' || hostname === 'www.agency.com') {
        subdomain = null;
    } else {
        // Pega a primeira parte antes do primeiro ponto
        subdomain = hostname.split('.')[0];
    }
  }

  console.log(`Middleware: Host=${hostname}, Subdomain=${subdomain}, Path=${url.pathname}`);

  // 1. Reescrever rotas baseadas no subdomínio
  
  // Admin Master
  if (subdomain === 'admin') {
    // Se for /login, mantém (ou redireciona para /auth/login se quiser centralizar)
    // Se for /, reescreve para /master
    // Se for /users, reescreve para /master/users
    
    if (url.pathname.startsWith('/auth')) {
       // Deixa passar ou reescreve? 
       // Vamos assumir que /auth é global
       return NextResponse.next();
    }
    
    // Evitar duplo prefixo: se já começa com /master, não adiciona de novo
    if (url.pathname.startsWith('/master')) {
        return NextResponse.rewrite(new URL(url.pathname, req.url));
    }

    // Reescrever para a pasta /master
    return NextResponse.rewrite(new URL(`/master${url.pathname}`, req.url));
  }

  // Cliente (Dash ou Personalizado)
  if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
    // Qualquer outro subdomínio é considerado um cliente
    
    if (url.pathname.startsWith('/auth')) {
       return NextResponse.next();
    }

    // Evitar duplo prefixo: se já começa com /client, não adiciona de novo
    if (url.pathname.startsWith('/client')) {
        const response = NextResponse.rewrite(new URL(url.pathname, req.url));
        response.headers.set('x-client-slug', subdomain);
        return response;
    }

    // Reescrever para a pasta /client
    // Podemos passar o subdomain como query param ou header se necessário
    // Mas aqui vamos apenas apontar para a estrutura de pastas /client
    // Opcional: Injetar o slug do cliente nos headers
    const response = NextResponse.rewrite(new URL(`/client${url.pathname}`, req.url));
    response.headers.set('x-client-slug', subdomain);
    return response;
  }

  // Domínio Raiz (Landing Page ou Redirecionamento)
  if (!subdomain || subdomain === 'www') {
    // Permitir acesso direto a /master e /client em localhost para facilitar o desenvolvimento
    if (isLocalhost && (url.pathname.startsWith('/master') || url.pathname.startsWith('/client'))) {
      return NextResponse.next();
    }

    // Pode ser uma Landing Page em /app/home
    // ou redirecionar para login
    return NextResponse.rewrite(new URL(`/home${url.pathname}`, req.url));
  }

  return NextResponse.next();
}
