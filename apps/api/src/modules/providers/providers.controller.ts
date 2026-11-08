import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('health')
@Controller('providers')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered payment providers' })
  listProviders() {
    return this.service.listProviders();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get health status for all payment providers' })
  async getHealth() {
    return this.service.getHealth();
  }
}
