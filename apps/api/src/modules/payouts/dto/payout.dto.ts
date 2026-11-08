import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsObject,
  Length, MaxLength, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AccountType {
  MOBILE_MONEY = 'mobile_money',
  BANK_ACCOUNT = 'bank_account',
}

export enum MobileNetwork {
  MTN = 'MTN',
  VODAFONE = 'VODAFONE',
  AIRTELTIGO = 'AIRTELTIGO',
}

export class CreateBeneficiaryDto {
  @ApiProperty({ description: 'Full name of the beneficiary', example: 'Kwame Mensah' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name!: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType!: AccountType;

  @ApiProperty({ description: 'Account or mobile number', example: '0244123456' })
  @IsString() @IsNotEmpty() @MaxLength(50)
  accountNumber!: string;

  @ApiPropertyOptional({ description: 'Bank code (for bank_account)' })
  @IsOptional() @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ enum: MobileNetwork, description: 'Network (for mobile_money)' })
  @IsOptional() @IsEnum(MobileNetwork)
  mobileNetwork?: MobileNetwork;

  @ApiPropertyOptional({ example: 'GHS' })
  @IsOptional() @IsString() @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'GH' })
  @IsOptional() @IsString() @Length(2, 2)
  country?: string;
}

export class CreatePayoutDto {
  @ApiProperty({ description: 'Beneficiary ID' })
  @IsString() @IsNotEmpty()
  beneficiaryId!: string;

  @ApiProperty({ description: 'Amount in major units', example: 50.00 })
  @IsNumber() @Min(0.01) @Type(() => Number)
  amount!: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'GHS' })
  @IsString() @IsNotEmpty() @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Idempotency key', example: 'payout-vendor-44-2024-01' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  idempotencyKey!: string;

  @ApiProperty({ description: 'Provider to route payout through', example: 'paystack' })
  @IsString() @IsNotEmpty()
  provider!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListPayoutsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsNumber() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  status?: string;
}
