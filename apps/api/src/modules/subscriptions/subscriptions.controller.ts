import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subscription' })
  async create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateSubscriptionDto) {
    return this.service.create(m.id, dto);
  }

  @Get() @ApiOperation({ summary: 'List subscriptions' })
  async findAll(
    @CurrentMerchant() m: { id: string },
    @Query('skip') skip?: string, @Query('take') take?: string, @Query('status') status?: string,
  ) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20, status });
  }

  @Get(':id') @ApiOperation({ summary: 'Get subscription' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }

  @Post(':id/cancel') @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.cancel(m.id, id);
  }
}
