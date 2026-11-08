import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import { ImportSettlementDto, ListSettlementsDto } from './dto/settlement.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('settlements')
@Controller('settlements')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import a provider settlement report' })
  async import(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: ImportSettlementDto,
  ) {
    return this.service.importSettlement(merchant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List settlements with pagination' })
  async list(
    @CurrentMerchant() merchant: { id: string },
    @Query() query: ListSettlementsDto,
  ) {
    return this.service.listSettlements(merchant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single settlement' })
  async findOne(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.findSettlement(merchant.id, id);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Run reconciliation for a settlement against the ledger' })
  async reconcile(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.reconcile(merchant.id, id);
  }
}
