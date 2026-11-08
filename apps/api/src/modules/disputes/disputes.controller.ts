import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class DisputesController {
  constructor(private readonly service: DisputesService) {}

  @Get() @ApiOperation({ summary: 'List disputes' })
  async findAll(
    @CurrentMerchant() m: { id: string },
    @Query('skip') skip?: string, @Query('take') take?: string, @Query('status') status?: string,
  ) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20, status });
  }

  @Get(':id') @ApiOperation({ summary: 'Get dispute' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }

  @Patch(':id/evidence') @ApiOperation({ summary: 'Update dispute evidence' })
  async updateEvidence(@CurrentMerchant() m: { id: string }, @Param('id') id: string, @Body() dto: UpdateDisputeDto) {
    return this.service.updateEvidence(m.id, id, dto.evidence ?? {});
  }
}
