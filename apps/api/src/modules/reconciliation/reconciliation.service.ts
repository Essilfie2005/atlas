import {
  Injectable, Logger, NotFoundException, ConflictException,
} from '@nestjs/common';
import { Prisma, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { ImportSettlementDto, ListSettlementsDto } from './dto/settlement.dto';

const TOLERANCE_BPS = 1; // 1 basis point tolerance (0.01%)

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async importSettlement(merchantId: string, dto: ImportSettlementDto) {
    const expectedAmountMinor = BigInt(Math.round(dto.expectedAmount * 100));

    const settlement = await this.prisma.settlement.create({
      data: {
        merchantId,
        provider: dto.provider,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        expectedAmount: expectedAmountMinor,
        currency: dto.currency.toUpperCase(),
        status: SettlementStatus.PENDING,
        rawReport: (dto.rawReport ?? {}) as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Settlement imported: id=${settlement.id} provider=${dto.provider} expected=${expectedAmountMinor}n ${dto.currency}`,
    );

    return this.serialize(settlement);
  }

  async reconcile(merchantId: string, settlementId: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { id: settlementId, merchantId },
    });

    if (!settlement) throw new NotFoundException(`Settlement ${settlementId} not found`);
    if (settlement.status === SettlementStatus.MATCHED) {
      throw new ConflictException('Settlement is already reconciled');
    }

    // Load ledger entries for the settlement period
    const entries = await this.ledger.getEntriesForPeriod(
      merchantId,
      settlement.currency,
      settlement.periodStart,
      settlement.periodEnd,
      settlement.provider,
    );

    // Sum settled CREDIT entries from the provider
    const actualAmount = entries
      .filter((e) => e.type === 'CREDIT' && e.status === 'SETTLED')
      .reduce((sum, e) => sum + e.amount, BigInt(0));

    const expectedAmount = settlement.expectedAmount;
    const diff = actualAmount > expectedAmount
      ? actualAmount - expectedAmount
      : expectedAmount - actualAmount;

    // 1 basis point tolerance of expected amount
    const tolerance = (expectedAmount * BigInt(TOLERANCE_BPS)) / BigInt(10000);

    let status: SettlementStatus;
    let notes: string;

    if (diff <= tolerance) {
      status = SettlementStatus.MATCHED;
      notes = `Reconciled: actual=${actualAmount}n expected=${expectedAmount}n diff=${diff}n (within ${TOLERANCE_BPS}bps tolerance)`;
    } else if (actualAmount > BigInt(0)) {
      status = SettlementStatus.MISMATCHED;
      notes = `Mismatch: actual=${actualAmount}n expected=${expectedAmount}n diff=${diff}n exceeds tolerance=${tolerance}n`;
    } else {
      status = SettlementStatus.EXCEPTION;
      notes = `Exception: no settled ledger entries found for period ${settlement.periodStart.toISOString()} to ${settlement.periodEnd.toISOString()} provider=${settlement.provider}`;
    }

    const updated = await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status,
        actualAmount,
        reconciledAt: new Date(),
        notes,
        entryCount: entries.length,
      },
    });

    this.logger.log(
      `Settlement reconciled: id=${settlementId} status=${status} actual=${actualAmount}n expected=${expectedAmount}n`,
    );

    return this.serialize(updated);
  }

  async listSettlements(merchantId: string, query: ListSettlementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SettlementWhereInput = {
      merchantId,
      ...(query.status ? { status: query.status as SettlementStatus } : {}),
      ...(query.provider ? { provider: query.provider } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where, skip, take: limit, orderBy: { periodStart: 'desc' },
      }),
      this.prisma.settlement.count({ where }),
    ]);
    return {
      items: items.map((s) => this.serialize(s)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findSettlement(merchantId: string, settlementId: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { id: settlementId, merchantId },
    });
    if (!settlement) throw new NotFoundException(`Settlement ${settlementId} not found`);
    return this.serialize(settlement);
  }

  private serialize(settlement: {
    expectedAmount: bigint;
    actualAmount?: bigint | null;
    [k: string]: unknown;
  }): Record<string, unknown> {
    return {
      ...settlement,
      expectedAmount: settlement.expectedAmount.toString(),
      actualAmount: settlement.actualAmount?.toString() ?? null,
    };
  }
}
