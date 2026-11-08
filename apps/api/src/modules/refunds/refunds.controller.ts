import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('refunds')
@Controller('refunds')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class RefundsController {
  constructor(private readonly service: RefundsService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a refund' })
  async create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateRefundDto) {
    return this.service.create(m.id, dto);
  }

  @Get() @ApiOperation({ summary: 'List refunds' })
  async findAll(
    @CurrentMerchant() m: { id: string },
    @Query('skip') skip?: string, @Query('take') take?: string, @Query('status') status?: string,
  ) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20, status });
  }

  @Get(':id') @ApiOperation({ summary: 'Get refund' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }
}
