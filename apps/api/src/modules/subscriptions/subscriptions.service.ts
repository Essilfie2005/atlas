import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateSubscriptionDto) {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, merchantId } });
      if (!customer) throw new BadRequestException(`Customer ${dto.customerId} not found`);
    }
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    
    const sub = await this.prisma.subscription.create({
      data: {
        merchantId,
        customerId: dto.customerId,
        planName: dto.planName,
        amount: BigInt(Math.round(dto.amount)),
        currency: dto.currency,
        interval: dto.interval as any,
        startDate,
        status: 'ACTIVE',
      },
    });
    this.logger.log(`Subscription created: id=${sub.id} plan=${dto.planName} merchant=${merchantId}`);
    return sub;
  }

  async findAll(merchantId: string, params: { skip?: number; take?: number; status?: string }) {
    const where: any = { merchantId };
    if (params.status) where.status = params.status as any;
    const [total, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { items, total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1 };
  }

  async findOne(merchantId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { id, merchantId } });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);
    return sub;
  }
  
  async cancel(merchantId: string, id: string) {
    await this.findOne(merchantId, id);
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    this.logger.log(`Subscription cancelled: id=${id}`);
    return updated;
  }
}
