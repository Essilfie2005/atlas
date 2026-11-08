import {
  Controller, Get, Post, Patch, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new merchant (public endpoint)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async create(@Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(dto);
  }

  @Get('me')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Get current merchant profile' })
  async getMe(@CurrentMerchant() merchant: { id: string }) {
    return this.merchantsService.findById(merchant.id);
  }

  @Patch('me')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Update merchant profile (name, website, webhookUrl)' })
  async updateMe(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchantsService.update(merchant.id, dto);
  }
}
