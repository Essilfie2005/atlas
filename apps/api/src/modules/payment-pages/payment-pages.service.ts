import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentPageDto } from './dto/create-payment-page.dto';

@Injectable()
export class PaymentPagesService {
  private readonly logger = new Logger(PaymentPagesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreatePaymentPageDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);
    
    // Check if slug exists
    const existing = await this.prisma.paymentPage.findFirst({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug ${slug} is already taken`);

    const page = await this.prisma.paymentPage.create({
      data: {
        merchantId,
        name: dto.name,
        slug,
        description: dto.description,
        amount: dto.amount ? BigInt(Math.round(dto.amount)) : null,
        currency: dto.currency,
        redirectUrl: dto.redirectUrl,
      },
    });
    this.logger.log(`Payment page created: id=${page.id} slug=${page.slug} merchant=${merchantId}`);
    return this.serialize(page);
  }

  async findAll(merchantId: string, params: { skip?: number; take?: number }) {
    const where = { merchantId };
    const [total, items] = await Promise.all([
      this.prisma.paymentPage.count({ where }),
      this.prisma.paymentPage.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { items: items.map(p => this.serialize(p)), total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1 };
  }

  async findOne(merchantId: string, id: string) {
    const page = await this.prisma.paymentPage.findFirst({ where: { id, merchantId } });
    if (!page) throw new NotFoundException(`PaymentPage ${id} not found`);
    return this.serialize(page);
  }
  
  async update(merchantId: string, id: string, data: any) {
    await this.findOne(merchantId, id);
    const updated = await this.prisma.paymentPage.update({ where: { id }, data });
    this.logger.log(`Payment page updated: id=${id}`);
    return this.serialize(updated);
  }

  async delete(merchantId: string, id: string) {
    await this.findOne(merchantId, id);
    await this.prisma.paymentPage.delete({ where: { id } });
    this.logger.log(`Payment page deleted: id=${id}`);
  }

  /** Public — no auth needed */
  async findBySlug(slug: string) {
    const page = await this.prisma.paymentPage.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: {
        merchant: { select: { legalName: true, email: true, country: true } },
      },
    });
    if (!page) throw new NotFoundException(`Payment page "${slug}" not found or inactive`);
    return this.serialize(page);
  }

  private serialize(page: any) {
    if (!page) return page;
    return {
      ...page,
      amount: page.amount != null ? Number(page.amount) : null,
    };
  }

  /** Public — creates a PaymentIntent and returns Paystack reference for the popup */
  async initCheckout(slug: string, dto: { email: string; name?: string; amount?: number; phone?: string }) {
    const page = await this.findBySlug(slug);

    // Amount: fixed or customer-supplied
    const amountMinor = page.amount
      ? Number(page.amount)
      : dto.amount
        ? Math.round(dto.amount * 100)
        : null;

    if (!amountMinor || amountMinor <= 0) {
      throw new BadRequestException('Amount is required for open-amount payment pages');
    }

    // H4: Enforce minimum transaction amount (100 minor units = 1.00 of currency)
    if (amountMinor < 100) {
      throw new BadRequestException('Minimum payment amount is 1.00');
    }

    // H4: Fixed-amount pages must not accept a customer-supplied amount override
    if (page.amount && dto.amount) {
      throw new BadRequestException('This payment page has a fixed amount — do not pass a custom amount');
    }

    const reference = `atl_${page.id.slice(0, 8)}_${Date.now()}`;

    // Create a PaymentIntent record
    const intent = await this.prisma.paymentIntent.create({
      data: {
        merchantId: page.merchantId,
        amount: BigInt(amountMinor),
        currency: page.currency,
        status: 'CREATED',
        idempotencyKey: reference,
        description: page.name,
        metadata: {
          pageId: page.id,
          pageSlug: slug,
          customerEmail: dto.email,
          customerName: dto.name ?? '',
          customerPhone: dto.phone ?? '',
          provider: 'PAYSTACK',
          providerReference: reference,
          source: 'payment_page',
        },
      },
    });

    this.logger.log(`Checkout initiated: page=${slug} intent=${intent.id} amount=${amountMinor}`);

    return {
      reference,
      intentId: intent.id,
      amount: amountMinor,
      currency: page.currency,
      email: dto.email,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
      redirectUrl: page.redirectUrl ?? null,
      pageName: page.name,
      merchantName: (page as any).merchant?.legalName ?? 'ATLAS Merchant',
    };
  }

  /** Called by Paystack webhook OR by the frontend after popup success */
  async confirmCheckout(intentId: string, reference: string, paystackStatus: string) {
    const success = paystackStatus === 'success';
    const status = success ? 'SUCCEEDED' : 'FAILED';
    const now = new Date();

    // Fetch current metadata to merge, not overwrite
    const current = await this.prisma.paymentIntent.findUnique({
      where: { id: intentId },
      select: { metadata: true },
    });
    const meta = ((current?.metadata as any) ?? {});
    meta.providerReference = reference;
    meta.confirmedAt = now.toISOString();

    await this.prisma.paymentIntent.update({
      where: { id: intentId },
      data: {
        status,
        metadata: meta,
        ...(success ? { succeededAt: now } : { failedAt: now }),
      },
    });

    this.logger.log(`Checkout confirmed: intent=${intentId} status=${status}`);
    return { intentId, status, reference };
  }
}
