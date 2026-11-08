import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Dashboard login — public ─────────────────────────────────────────────
  @Post('login')
  @Throttle({ short: { limit: 10, ttl: 60000 } })  // C1: 10 attempts/min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email + password (returns JWT for dashboard)' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @Throttle({ short: { limit: 5, ttl: 60000 } })  // C1: 5 attempts/min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link (always returns 200 to prevent email enumeration)' })
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email).catch(() => {});
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // ─── API Key management — requires API key auth ──────────────────────────
  @Post('keys')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Create a new API key (shown once — copy it)' })
  async createApiKey(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.authService.createApiKey(merchant.id, dto);
  }

  @Get('keys')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'List API keys for this merchant' })
  async listApiKeys(@CurrentMerchant() merchant: { id: string }) {
    return this.authService.listApiKeys(merchant.id);
  }

  @Delete('keys/:id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    await this.authService.revokeApiKey(merchant.id, id);
  }
}
