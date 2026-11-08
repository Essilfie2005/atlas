import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';
import { PrismaService } from '../../prisma/prisma.service';

const JWT_SECRET = process.env.ATLAS_SIGNING_SECRET ?? 'atlas-dev-signing-secret-change-in-production';

export interface AuthenticatedRequest extends FastifyRequest {
  merchant: {
    id: string;
    legalName: string;
    email: string;
    country: string | null;
    status: string;
  };
  apiKey: {
    id: string;
    name: string;
    type: string;
    scopes: string[];
    merchantId: string;
  };
  requestId: string;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header.',
      );
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken) throw new UnauthorizedException('Authorization token is empty');

    // ── 1. Try JWT (dashboard sessions) ─────────────────────────────────────
    try {
      const payload = jwt.verify(rawToken, JWT_SECRET) as {
        sub: string;
        email: string;
        legalName: string;
      };

      if (payload?.sub) {
        const merchant = await this.prisma.merchant.findUnique({
          where: { id: payload.sub },
          select: { id: true, legalName: true, email: true, country: true, status: true },
        });

        if (!merchant) throw new UnauthorizedException('Merchant not found');
        if (merchant.status !== 'ACTIVE') throw new UnauthorizedException('Merchant account is not active');

        request.merchant = merchant;
        request.apiKey = {
          id: 'jwt-session',
          name: 'Dashboard Session',
          type: 'DASHBOARD',
          scopes: ['*'],
          merchantId: merchant.id,
        };
        return true;
      }
    } catch (jwtErr) {
      // Not a valid JWT — fall through to API key lookup
      if (!(jwtErr instanceof jwt.JsonWebTokenError) && !(jwtErr instanceof jwt.TokenExpiredError) && !(jwtErr instanceof jwt.NotBeforeError)) {
        // It's a real error (DB, etc.), rethrow
        if ((jwtErr as any)?.status === 401) throw jwtErr;
      }
    }

    // ── 2. Fall back to API key (machine-to-machine) ─────────────────────────
    const keyHash = createHash('sha256').update(rawToken).digest('hex');

    let apiKey: {
      id: string; name: string; type: string; scopes: string[];
      status: string; expiresAt: Date | null; merchantId: string;
      merchant: { id: string; legalName: string; email: string; country: string | null; status: string };
    } | null;

    try {
      apiKey = await this.prisma.apiKey.findUnique({
        where: { keyHash },
        select: {
          id: true, name: true, type: true, scopes: true,
          status: true, expiresAt: true, merchantId: true,
          merchant: { select: { id: true, legalName: true, email: true, country: true, status: true } },
        },
      });
    } catch (err) {
      this.logger.error('DB error during API key lookup', err);
      throw new UnauthorizedException('Authentication service unavailable');
    }

    if (!apiKey) throw new UnauthorizedException('Invalid API key or session token');
    if (apiKey.status === 'REVOKED') throw new UnauthorizedException('API key has been revoked');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) throw new UnauthorizedException('API key has expired');
    if (apiKey.merchant.status !== 'ACTIVE') throw new UnauthorizedException('Merchant account is not active');

    request.merchant = apiKey.merchant;
    request.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      type: apiKey.type,
      scopes: apiKey.scopes,
      merchantId: apiKey.merchantId,
    };

    void this.prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch((err: Error) => this.logger.warn(`Failed to update lastUsedAt: ${err.message}`));

    return true;
  }
}
