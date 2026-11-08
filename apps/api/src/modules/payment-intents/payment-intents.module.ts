import { Module } from '@nestjs/common';
import { PaymentIntentsController } from './payment-intents.controller';
import { PaymentIntentsService } from './payment-intents.service';
import { LedgerModule } from '../ledger/ledger.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [LedgerModule, WebhooksModule, ProvidersModule],
  controllers: [PaymentIntentsController],
  providers: [PaymentIntentsService],
  exports: [PaymentIntentsService],
})
export class PaymentIntentsModule {}
