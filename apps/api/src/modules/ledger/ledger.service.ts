import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerEntryStatus = 'PENDING' | 'SETTLED' | 'REVERSED';

export interface CreateLedgerEntryData {
  merchantId: string;
  type: LedgerEntryType;
  amount: bigint;
  currency: string;
  status: LedgerEntryStatus;
  description?: string;
  transactionId?: string;
  payoutId?: string;
  settlementId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * APPEND-ONLY write to the ledger.
   * This service NEVER calls ledgerEntry.update() or ledgerEntry.delete().
   */
  async writeEntry(data: CreateLedgerEntryData) {
    try {
      const entry = await this.prisma.ledgerEntry.create({
        data: {
          merchantId: data.merchantId,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          description: data.description ?? null,
          transactionId: data.transactionId ?? null,
          payoutId: data.payoutId ?? null,
          metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `Ledger: ${data.type} ${data.amount}n ${data.currency} [${data.status}] id=${entry.id}`,
      );

      return entry;
    } catch (error) {
      this.logger.error('Failed to write ledger entry', error);
      throw new InternalServerErrorException('Failed to write ledger entry');
    }
  }

  /**
   * Settled balance: sum(CREDIT SETTLED) - sum(DEBIT SETTLED)
   */
  async getBalance(merchantId: string, currency: string): Promise<bigint> {
    const [credits, debits] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { merchantId, currency, type: 'CREDIT', status: 'SETTLED' },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { merchantId, currency, type: 'DEBIT', status: 'SETTLED' },
        _sum: { amount: true },
      }),
    ]);

    return (credits._sum.amount ?? BigInt(0)) - (debits._sum.amount ?? BigInt(0));
  }

  async getEntriesForTransaction(transactionId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getEntriesForPayout(payoutId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { payoutId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getEntriesForPeriod(
    merchantId: string,
    currency: string,
    from: Date,
    to: Date,
    provider?: string,
  ) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        merchantId,
        currency,
        createdAt: { gte: from, lte: to },
        ...(provider
          ? { metadata: { path: ['provider'], equals: provider } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
