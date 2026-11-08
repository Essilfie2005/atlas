import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';


const MERCHANT_SELECT = {
  id: true,
  legalName: true,
  email: true,
  website: true,
  webhookUrl: true,
  country: true,
  status: true,
  riskProfile: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMerchantDto) {
    const existing = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const merchant = await this.prisma.merchant.create({
      data: {
        legalName: dto.legalName,
        email: dto.email,
        passwordHash,
        website: dto.website ?? null,
        country: dto.country ?? 'GH',
        status: 'ACTIVE',
      },
      select: MERCHANT_SELECT,
    });

    // Auto-provision a test API key so merchant can log in immediately
    const secret = randomBytes(32).toString('hex');
    const rawKey = `sk_test_${secret}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);

    await this.prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        name: 'Default Test Key',
        type: 'TEST',
        keyHash,
        keyPrefix,
        scopes: [],
        status: 'ACTIVE',
      },
    });

    this.logger.log(
      `Merchant created: id=${merchant.id} — test key auto-provisioned`,
    );

    return {
      merchant,
      testApiKey: rawKey,
      message:
        'Copy your test API key now — it will not be shown again. Use it to sign in to the dashboard.',
    };
  }

  async findById(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: MERCHANT_SELECT,
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    return merchant;
  }

  async update(merchantId: string, dto: UpdateMerchantDto) {
    await this.findById(merchantId);

    // H3: Block SSRF via webhookUrl — prevent pointing to private/loopback/cloud-metadata addresses
    if (dto.webhookUrl) {
      let parsed: URL;
      try {
        parsed = new URL(dto.webhookUrl);
      } catch {
        throw new BadRequestException('webhookUrl is not a valid URL');
      }
      if (parsed.protocol !== 'https:') {
        throw new BadRequestException('webhookUrl must use HTTPS');
      }
      const blockedHosts = [
        'localhost', '127.0.0.1', '0.0.0.0', '::1',
        '169.254.169.254',       // AWS/GCP/Azure metadata
        '100.100.100.200',       // Alibaba Cloud metadata
        '192.168.', '10.', '172.',
      ];
      const hostname = parsed.hostname.toLowerCase();
      if (blockedHosts.some((b) => hostname === b || hostname.startsWith(b))) {
        throw new BadRequestException('webhookUrl cannot point to private, loopback, or cloud-metadata addresses');
      }
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.webhookUrl !== undefined && { webhookUrl: dto.webhookUrl }),
      },
      select: MERCHANT_SELECT,
    });

    this.logger.log(`Merchant updated: id=${merchantId}`);
    return updated;
  }
}
