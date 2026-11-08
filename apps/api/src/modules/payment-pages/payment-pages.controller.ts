import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { PaymentPagesService } from './payment-pages.service';
import { CreatePaymentPageDto } from './dto/create-payment-page.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

export class InitCheckoutDto {
  @ApiProperty({ example: 'customer@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Required for open-amount pages (in major units, e.g. 50.00 for GHS 50)', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class ConfirmCheckoutDto {
  @ApiProperty()
  @IsString()
  intentId!: string;

  @ApiProperty()
  @IsString()
  reference!: string;

  @ApiProperty({ example: 'success' })
  @IsString()
  status!: string;
}

@ApiTags('payment-pages')
@Controller('payment-pages')
export class PaymentPagesController {
  constructor(private readonly service: PaymentPagesService) {}

  // ── Public routes (no auth) ─────────────────────────────
  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public payment page by slug (no auth)' })
  async getPublicPage(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post('public/:slug/checkout')
  @ApiOperation({ summary: 'Initiate a checkout session for a payment page (via /public/ prefix)' })
  async initCheckoutPublic(@Param('slug') slug: string, @Body() dto: InitCheckoutDto) {
    return this.service.initCheckout(slug, dto);
  }

  /** Shorthand: POST /:slug/checkout — same as /public/:slug/checkout */
  @Post(':slug/checkout')
  @ApiOperation({ summary: 'Initiate a checkout session for a payment page' })
  async initCheckout(@Param('slug') slug: string, @Body() dto: InitCheckoutDto) {
    return this.service.initCheckout(slug, dto);
  }

  @Post('public/confirm')
  @ApiOperation({ summary: 'Confirm checkout after Paystack popup success' })
  async confirmCheckout(@Body() dto: ConfirmCheckoutDto) {
    return this.service.confirmCheckout(dto.intentId, dto.reference, dto.status);
  }

  // ── Authenticated merchant routes ───────────────────────
  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment page' })
  async create(@CurrentMerchant() m: { id: string }, @Body() dto: CreatePaymentPageDto) {
    return this.service.create(m.id, dto);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'List payment pages' })
  async findAll(@CurrentMerchant() m: { id: string }, @Query('skip') skip?: string, @Query('take') take?: string) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20 });
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Get payment page by ID' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Update payment page' })
  async update(@CurrentMerchant() m: { id: string }, @Param('id') id: string, @Body() data: any) {
    return this.service.update(m.id, id, data);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment page' })
  async delete(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    await this.service.delete(m.id, id);
  }
}
