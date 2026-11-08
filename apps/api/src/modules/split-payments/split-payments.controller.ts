import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SplitPaymentsService } from './split-payments.service';
import { CreateSplitPaymentDto } from './dto/create-split-payment.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('split-payments')
@Controller('split-payments')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class SplitPaymentsController {
  constructor(private readonly service: SplitPaymentsService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a split payment' })
  async create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateSplitPaymentDto) {
    return this.service.create(m.id, dto);
  }

  @Get() @ApiOperation({ summary: 'List split payments' })
  async findAll(@CurrentMerchant() m: { id: string }, @Query('skip') skip?: string, @Query('take') take?: string) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20 });
  }

  @Get(':id') @ApiOperation({ summary: 'Get split payment' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }
}
