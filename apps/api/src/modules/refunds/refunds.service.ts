import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateRefundDto) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: dto.paymentIntentId, merchantId },
    });
    if (!intent) throw new NotFoundException(`PaymentIntent ${dto.paymentIntentId} not found`);
    if (intent.status !== 'SUCCEEDED') throw new BadRequestException('Can only refund succeeded payments');
    const amount = dto.amount ? BigInt(Math.round(dto.amount)) : intent.amount;
    const refund = await this.prisma.refund.create({
      data: {
        merchantId,
        paymentIntentId: dto.paymentIntentId,
        amount,
        currency: intent.currency,
        status: 'PENDING',
        reason: (dto.reason ?? 'CUSTOMER_REQUEST') as any,
        description: dto.description,
      },
    });
    this.logger.log(`Refund created: id=${refund.id} amount=${amount} intent=${dto.paymentIntentId}`);
    return refund;
  }

  async findAll(merchantId: string, params: { skip?: number; take?: number; status?: string }) {
    const where: any = { merchantId };
    if (params.status) where.status = params.status as any;
    const [total, items] = await Promise.all([
      this.prisma.refund.count({ where }),
      this.prisma.refund.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
        include: { paymentIntent: { select: { id: true, amount: true, currency: true, description: true } } },
      }),
    ]);
    return { items, total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1 };
  }

  async findOne(merchantId: string, id: string) {
    const refund = await this.prisma.refund.findFirst({
      where: { id, merchantId },
      include: { paymentIntent: true },
    });
    if (!refund) throw new NotFoundException(`Refund ${id} not found`);
    return refund;
  }
}
