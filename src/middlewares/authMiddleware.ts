import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface TokenPayload {
  id: string;
  role?: string;
  slug?: string;
  iat: number;
  exp: number;
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded.role || (decoded.role !== 'MASTER' && decoded.role !== 'DEV' && decoded.role !== 'COLABORADOR')) {
       return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Attach admin info to request if needed
    (req as any).adminId = decoded.id;
    (req as any).adminRole = decoded.role;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function ensureClient(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  // 1. Tentar API Key via Header Específico (x-api-key)
  if (apiKeyHeader) {
    try {
       const credential = await prisma.credential.findFirst({
         where: { apiKey: apiKeyHeader },
         include: { user: true }
       });
       
       if (credential && credential.user) {
         (req as any).userId = credential.user.id;
         (req as any).userSlug = credential.user.slug;
         return next();
       }
    } catch (err) {
       console.error("API Key Auth Error", err);
       // Não retorna erro aqui, deixa cair no fluxo de auth missing se falhar
    }
  }

  // 2. Tentar Authorization Header
  if (authHeader) {
    const parts = authHeader.split(' ');
    
    // Suporte a "Bearer <token>" ou "ApiKey <key>"
    if (parts.length === 2) {
      const [scheme, token] = parts;

      if (/^Bearer$/i.test(scheme)) {
        // Fluxo JWT Existente
        try {
          const secret = process.env.JWT_SECRET || 'default_secret';
          const decoded = jwt.verify(token, secret) as TokenPayload;

          const allowedClientRoles = ['CLIENT', 'OWNER', 'ADMIN', 'MEMBER'];
          const allowedAdminRoles = ['MASTER', 'DEV', 'COLABORADOR'];

          if (allowedClientRoles.includes(decoded.role || '')) {
              // Verify if user still exists (in case of DB reset or deleted user)
              const userExists = await prisma.user.findUnique({ where: { id: decoded.id } });
              if (!userExists) {
                return res.status(401).json({ error: 'User not found or deleted' });
              }

              (req as any).userId = decoded.id;
              (req as any).userSlug = decoded.slug;
              return next();
          } else if (allowedAdminRoles.includes(decoded.role || '')) {
              // Admin accessing client route
              (req as any).adminId = decoded.id;
              (req as any).adminRole = decoded.role;

              // Try to set client context if provided
              let targetSlug: string | undefined = req.params.clientSlug as string | undefined;
              const headerSlug = req.headers['x-client-slug'];
              if (!targetSlug && headerSlug) {
                  targetSlug = Array.isArray(headerSlug) ? headerSlug[0] : headerSlug;
              }

              if (targetSlug) {
                 const targetUser = await prisma.user.findUnique({ where: { slug: targetSlug } });
                 if (targetUser) {
                    (req as any).userId = targetUser.id;
                    (req as any).userSlug = targetUser.slug;
                 }
              }
              return next();
          } else {
             return res.status(403).json({ error: 'Access denied. Client role required.' });
          }
        } catch (err) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      } 
      
      if (/^ApiKey$/i.test(scheme)) {
         // Fluxo Api Key no Authorization Header
         try {
           const credential = await prisma.credential.findFirst({
             where: { apiKey: token },
             include: { user: true }
           });
           
           if (credential && credential.user) {
             (req as any).userId = credential.user.id;
             (req as any).userSlug = credential.user.slug;
             return next();
           }
        } catch (err) {
           console.error("API Key Auth Error", err);
        }
      }
    }
  }

  return res.status(401).json({ error: 'Authentication credentials missing or invalid' });
}
