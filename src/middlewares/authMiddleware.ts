import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export function ensureClient(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (decoded.role !== 'CLIENT') {
       return res.status(403).json({ error: 'Access denied. Client role required.' });
    }

    (req as any).userId = decoded.id;
    (req as any).userSlug = decoded.slug;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
