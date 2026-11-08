import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateApiKeyDto, ApiKeyType } from './dto/create-api-key.dto';
import { LoginDto } from './dto/login.dto';

const JWT_SECRET = process.env.ATLAS_SIGNING_SECRET ?? 'atlas-dev-signing-secret-change-in-production';
const JWT_EXPIRES_IN = '8h';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ─── Dashboard login (email + password) ───────────────────────────────────

  async login(dto: LoginDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
      select: {
        id: true, legalName: true, email: true, country: true,
        status: true, passwordHash: true,
      },
    });

    if (!merchant || !merchant.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, merchant.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (merchant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is suspended. Contact support.');
    }

    const token = jwt.sign(
      { sub: merchant.id, email: merchant.email, legalName: merchant.legalName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    this.logger.log(`Merchant logged in: ${merchant.email}`);

    return {
      token,
      expiresIn: JWT_EXPIRES_IN,
      merchant: {
        id: merchant.id,
        legalName: merchant.legalName,
        email: merchant.email,
        country: merchant.country,
      },
    };
  }

  // ─── API Key management ────────────────────────────────────────────────────

  async createApiKey(merchantId: string, dto: CreateApiKeyDto) {
    const prefix = dto.type === ApiKeyType.LIVE ? 'sk_live' : 'sk_test';
    const pubPrefix = dto.type === ApiKeyType.LIVE ? 'pk_live' : 'pk_test';
    const secret = randomBytes(32).toString('hex');
    const rawKey = `${prefix}_${secret}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchantId,
        name: dto.name,
        type: dto.type,
        keyHash,
        keyPrefix,
        scopes: dto.scopes ?? [],
        status: 'ACTIVE',
        expiresAt,
      },
      select: {
        id: true, name: true, type: true, keyPrefix: true,
        scopes: true, status: true, createdAt: true, lastUsedAt: true, expiresAt: true,
      },
    });

    this.logger.log(`API key created: id=${apiKey.id} prefix=${keyPrefix} merchant=${merchantId}`);
    const publicKey = `${pubPrefix}_${createHash('sha256').update(apiKey.id + merchantId).digest('hex').substring(0, 24)}`;
    return { ...apiKey, rawKey, secretKey: rawKey, publicKey };
  }

  async listApiKeys(merchantId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { merchantId },
      select: {
        id: true, name: true, type: true, keyPrefix: true,
        scopes: true, status: true, createdAt: true, lastUsedAt: true, expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => {
      const pubPrefix = k.type === ApiKeyType.LIVE ? 'pk_live' : 'pk_test';
      const publicKey = `${pubPrefix}_${createHash('sha256').update(k.id + merchantId).digest('hex').substring(0, 24)}`;
      return { ...k, publicKey };
    });
  }

  async revokeApiKey(merchantId: string, keyId: string): Promise<void> {
    const key = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, merchantId: true },
    });
    if (!key) throw new NotFoundException(`API key ${keyId} not found`);
    if (key.merchantId !== merchantId) throw new ForbiddenException('API key does not belong to this merchant');
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    this.logger.log(`API key revoked: id=${keyId} merchant=${merchantId}`);
  }

  // ─── Password reset ──────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const merchant = await this.prisma.merchant.findUnique({ where: { email } });
    if (!merchant) return; // silent — don't reveal existence
    const token = randomBytes(32).toString('hex');
    // H2: Store only the SHA-256 hash in DB — the raw token goes to the user's email only
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        action: 'PASSWORD_RESET_REQUESTED',
        actorId: merchant.id,
        actorType: 'MERCHANT',
        resource: 'auth',
        resourceId: tokenHash,  // hash stored, never the raw token
        changes: { tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
      },
    });
    // Send real reset email — user gets the plain token, DB never sees it again
    await this.email.sendPasswordReset({
      to: merchant.email,
      name: merchant.legalName,
      token,
    });
    this.logger.log(`Password reset email sent to ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // H2: Hash the incoming token and look up the hash — never compare plain tokens
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const log = await this.prisma.auditLog.findFirst({
      where: { action: 'PASSWORD_RESET_REQUESTED', resourceId: tokenHash },
      orderBy: { createdAt: 'desc' },
    });
    if (!log) throw new UnauthorizedException('Invalid or expired reset token');
    const meta = log.changes as any;
    if (new Date(meta.expiresAt) < new Date()) throw new UnauthorizedException('Reset token has expired');
    if (!log.merchantId) throw new UnauthorizedException('Invalid reset token');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.merchant.update({
      where: { id: log.merchantId },
      data: { passwordHash },
    });
    await this.prisma.auditLog.delete({ where: { id: log.id } });
    this.logger.log(`Password reset completed for merchant ${log.merchantId}`);
    return { message: 'Password updated successfully. You can now sign in.' };
  }
}
