import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: { merchantId, email: dto.email, name: dto.name, phone: dto.phone, externalReference: dto.externalReference },
    });
    this.logger.log(`Customer created: id=${customer.id} merchant=${merchantId}`);
    return customer;
  }

  async findAll(merchantId: string, params: { skip?: number; take?: number; search?: string }) {
    const where: any = { merchantId };
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where, skip: params.skip ?? 0, take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { paymentIntents: true } } },
      }),
    ]);
    return { items, total, page: Math.floor((params.skip ?? 0) / (params.take ?? 20)) + 1, pageSize: params.take ?? 20 };
  }

  async findOne(merchantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, merchantId },
      include: {
        paymentIntents: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, amount: true, currency: true, status: true, createdAt: true } },
        _count: { select: { paymentIntents: true } },
      },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async delete(merchantId: string, id: string) {
    await this.findOne(merchantId, id);
    await this.prisma.customer.delete({ where: { id } });
  }
}
