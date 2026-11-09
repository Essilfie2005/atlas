import { IsString, IsOptional, IsUrl, MaxLength, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMerchantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Webhook delivery URL for this merchant' })
  @IsOptional() @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Custom merchant metadata including KYC' })
  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}
