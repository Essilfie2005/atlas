import { Module } from '@nestjs/common';
import { SplitPaymentsController } from './split-payments.controller';
import { SplitPaymentsService } from './split-payments.service';
@Module({ controllers: [SplitPaymentsController], providers: [SplitPaymentsService] })
export class SplitPaymentsModule {}
