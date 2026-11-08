import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'API health check (no auth required)' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        const ok = await this.prisma.healthCheck();
        if (!ok) throw new Error('Database unhealthy');
        return { database: { status: 'up' } };
      },
      async () => {
        const ok = await this.redis.healthCheck();
        if (!ok) throw new Error('Redis unhealthy');
        return { redis: { status: 'up' } };
      },
    ]);
  }
}
