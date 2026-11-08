import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSplitPaymentDto } from './dto/create-split-payment.dto';

@Injectable()
export class SplitPaymentsService {
  private readonly logger = new Logger(SplitPaymentsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateSplitPaymentDto) {
    if (!dto.participants || dto.participants.length === 0) {
      throw new BadRequestException('At least one participant is required');
    }
    
    // total fixed amounts
    let totalFixed = BigInt(0);
    let totalPercent = 0;
    
    for (const p of dto.participants) {
      if (p.sharePercent) totalPercent += p.sharePercent;
      if (p.fixedAmount) totalFixed += BigInt(Math.round(p.fixedAmount));
    }
    
    if (totalPercent > 100) {
      throw new BadRequestException('Total share percent cannot exceed 100');
    }
    
    const split = await this.prisma.splitPayment.create({
      data: {
        merchantId,
        name: dto.name,
        currency: dto.currency,
        totalAmount: totalFixed, // Just a placeholder for now, actual is on the transaction
        participants: {
          create: dto.participants.map(p => ({
            beneficiaryId: p.beneficiaryId,
            sharePercent: p.sharePercent,
            fixedAmount: p.fixedAmount ? BigInt(Math.round(p.fixedAmount)) : null,
          })),
        },
      },
      include: { participants: true },
    });
    
    this.logger.log(`Split payment created: id=${split.id} merchant=${merchantId}`);
    return split;
  }

  async findAll(merchantId: string, params: { skip?: number; take?: number }) {
    const where = { merchantId };
    const [total, items] = await Promise.all([
      this.prisma.splitPayment.count({ where }),
      this.prisma.splitPayment.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { items, total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1 };
  }

  async findOne(merchantId: string, id: string) {
    const split = await this.prisma.splitPayment.findFirst({
      where: { id, merchantId },
      include: { participants: true },
    });
    if (!split) throw new NotFoundException(`SplitPayment ${id} not found`);
    return split;
  }
}
