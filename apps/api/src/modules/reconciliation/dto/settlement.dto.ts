import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsObject, Min, Max, Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportSettlementDto {
  @ApiProperty({ description: 'Provider name', example: 'paystack' })
  @IsString() @IsNotEmpty()
  provider!: string;

  @ApiProperty({ description: 'Period start (ISO 8601)', example: '2024-01-01T00:00:00Z' })
  @IsString() @IsNotEmpty()
  periodStart!: string;

  @ApiProperty({ description: 'Period end (ISO 8601)', example: '2024-01-31T23:59:59Z' })
  @IsString() @IsNotEmpty()
  periodEnd!: string;

  @ApiProperty({ description: 'Expected settlement amount in major units', example: 10000.00 })
  @IsNumber() @Min(0) @Type(() => Number)
  expectedAmount!: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'GHS' })
  @IsString() @IsNotEmpty() @Length(3, 3)
  currency!: string;

  @ApiPropertyOptional({ description: 'Raw provider settlement report data' })
  @IsOptional() @IsObject()
  rawReport?: Record<string, unknown>;
}

export class ListSettlementsDto {
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
  provider?: string;
}
