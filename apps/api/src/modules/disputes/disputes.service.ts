import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(merchantId: string, params: { skip?: number; take?: number; status?: string }) {
    const where: any = { merchantId };
    if (params.status) where.status = params.status as any;
    const [total, items] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
        include: { paymentIntent: { select: { id: true, amount: true, currency: true, description: true } } },
      }),
    ]);
    return { items, total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1 };
  }

  async findOne(merchantId: string, id: string) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { id, merchantId },
      include: { paymentIntent: true },
    });
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async updateEvidence(merchantId: string, id: string, evidence: Record<string, unknown>) {
    await this.findOne(merchantId, id);
    const dispute = await this.prisma.dispute.update({
      where: { id },
      data: { evidence: evidence as any, status: 'UNDER_REVIEW' },
    });
    this.logger.log(`Dispute updated: id=${dispute.id} merchant=${merchantId}`);
    return dispute;
  }
}
