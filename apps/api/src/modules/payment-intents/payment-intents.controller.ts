import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentIntentsService } from './payment-intents.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  ListPaymentIntentsDto,
} from './dto/payment-intent.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('payment-intents')
@Controller('payment-intents')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class PaymentIntentsController {
  constructor(private readonly service: PaymentIntentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment intent (idempotent)' })
  async create(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.service.create(merchant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment intents with pagination and filters' })
  async list(
    @CurrentMerchant() merchant: { id: string },
    @Query() query: ListPaymentIntentsDto,
  ) {
    return this.service.list(merchant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payment intent with all attempts' })
  async findOne(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.findOne(merchant.id, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm and trigger payment via provider' })
  async confirm(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentIntentDto,
  ) {
    return this.service.confirm(merchant.id, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending payment intent' })
  async cancel(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.cancel(merchant.id, id);
  }
}
