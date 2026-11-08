import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, Headers, RawBodyRequest, Req, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { WebhooksService } from './webhooks.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

class WebhookTestDto {
  @ApiProperty({ example: 'payment_intent.succeeded' })
  @IsString() @IsNotEmpty()
  eventType!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsObject()
  payload?: Record<string, unknown>;
}

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test webhook event to configured URL' })
  async test(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: WebhookTestDto,
  ) {
    await this.service.emit(
      merchant.id,
      dto.eventType,
      dto.payload ?? { test: true, timestamp: new Date().toISOString() },
    );
    return { dispatched: true, eventType: dto.eventType };
  }

  @Get('events')
  @ApiOperation({ summary: 'List webhook events with delivery status' })
  async listEvents(
    @CurrentMerchant() merchant: { id: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listEvents(merchant.id, page ?? 1, limit ?? 20);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get webhook event with all delivery attempts' })
  async findEvent(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.findEvent(merchant.id, id);
  }

  @Post('events/:id/retry')
  @ApiOperation({ summary: 'Manually retry a failed webhook event' })
  async retryEvent(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    return this.service.retryEvent(merchant.id, id);
  }

  // ── Inbound: Paystack → ATLAS ───────────────────────────────────────
  @Post('inbound/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async paystackInbound(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: Record<string, unknown>,
    @Req() req: FastifyRequest,
  ) {
    // Fastify gives us raw body access via req.rawBody if configured,
    // otherwise use the parsed body re-serialised (safe for HMAC since Paystack sends JSON)
    const rawPayload = (req as any).rawBody
      ? (Buffer.isBuffer((req as any).rawBody)
          ? (req as any).rawBody.toString('utf8')
          : String((req as any).rawBody))
      : JSON.stringify(body);
    const verified = this.service.verifyPaystackWebhook(rawPayload, signature);
    if (!verified) {
      throw new BadRequestException('Invalid Paystack webhook signature');
    }
    await this.service.handlePaystackEvent(body);
    return { received: true };
  }
}
