import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { PaymentIntentsModule } from './modules/payment-intents/payment-intents.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { HealthModule } from './modules/health/health.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PaymentPagesModule } from './modules/payment-pages/payment-pages.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SplitPaymentsModule } from './modules/split-payments/split-payments.module';
import { TeamModule } from './modules/team/team.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    // C1: Global rate limiting — 100 req/min default, overridden per route
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000,  limit: 100  },  // 100/min global
      { name: 'auth',  ttl: 60000,  limit: 10   },  // 10/min on auth routes (applied per controller)
      { name: 'loose', ttl: 60000,  limit: 1000 },  // 1000/min for API consumers
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    MerchantsModule,
    PaymentIntentsModule,
    LedgerModule,
    PayoutsModule,
    WebhooksModule,
    ReconciliationModule,
    HealthModule,
    ProvidersModule,
    CustomersModule,
    RefundsModule,
    DisputesModule,
    AuditLogsModule,
    PaymentPagesModule,
    SubscriptionsModule,
    SplitPaymentsModule,
    TeamModule,
    EmailModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
