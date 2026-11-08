import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get() @ApiOperation({ summary: 'List audit logs' })
  async findAll(
    @CurrentMerchant() m: { id: string },
    @Query('skip') skip?: string, @Query('take') take?: string,
    @Query('action') action?: string, @Query('resource') resource?: string,
  ) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20, action, resource });
  }
}
