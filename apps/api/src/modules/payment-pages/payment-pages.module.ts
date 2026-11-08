import { Module } from '@nestjs/common';
import { PaymentPagesController } from './payment-pages.controller';
import { PaymentPagesService } from './payment-pages.service';
@Module({ controllers: [PaymentPagesController], providers: [PaymentPagesService] })
export class PaymentPagesModule {}
