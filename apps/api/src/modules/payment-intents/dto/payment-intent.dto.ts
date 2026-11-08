import {
  IsNumber, IsString, IsNotEmpty, IsOptional, IsObject, IsUrl, Min, Max, MaxLength, Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in major currency units (e.g. 10.50 GHS)', example: 10.50 })
  @IsNumber() @Min(0.01) @Type(() => Number)
  amount!: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'GHS' })
  @IsString() @IsNotEmpty() @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Unique idempotency key for this request', example: 'order-12345-attempt-1' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  idempotencyKey!: string;

  @ApiPropertyOptional({ description: 'Customer ID (if known)' })
  @IsOptional() @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Human-readable description', example: 'Subscription payment - January' })
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata object' })
  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'URL to redirect to after payment' })
  @IsOptional() @IsUrl()
  returnUrl?: string;
}

export class ConfirmPaymentIntentDto {
  @ApiProperty({ description: 'Provider name', example: 'paystack' })
  @IsString() @IsNotEmpty()
  provider!: string;

  @ApiPropertyOptional({ description: 'Provider-specific payment method data' })
  @IsOptional() @IsObject()
  providerPaymentMethod?: Record<string, unknown>;
}

export class ListPaymentIntentsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsNumber() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  currency?: string;
}
