import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreateBeneficiaryDto, CreatePayoutDto, ListPayoutsDto } from './dto/payout.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('payouts')
@Controller()
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class PayoutsController {
  constructor(private readonly service: PayoutsService) {}

  @Post('beneficiaries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a beneficiary (mobile money or bank account)' })
  async createBeneficiary(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: CreateBeneficiaryDto,
  ) {
    return this.service.createBeneficiary(merchant.id, dto);
  }

  @Get('beneficiaries')
  @ApiOperation({ summary: 'List active beneficiaries' })
  async listBeneficiaries(@CurrentMerchant() merchant: { id: string }) {
    return this.service.listBeneficiaries(merchant.id);
  }

  @Post('payouts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and execute a payout (idempotent)' })
  async createPayout(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: CreatePayoutDto,
  ) {
    return this.service.createPayout(merchant.id, dto);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'List payouts with pagination' })
  async listPayouts(
    @CurrentMerchant() merchant: { id: string },
    @Query() query: ListPayoutsDto,
  ) {
    return this.service.listPayouts(merchant.id, query);
  }

  @Get('payouts/:id')
  @ApiOperation({ summary: 'Get a single payout' })
  async findPayout(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.findPayout(merchant.id, id);
  }
}
