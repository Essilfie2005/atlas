import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApiKeyType {
  TEST = 'TEST',
  LIVE = 'LIVE',
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Human-readable name for this key', example: 'Production Key' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: ApiKeyType, description: 'TEST or LIVE mode' })
  @IsEnum(ApiKeyType)
  type!: ApiKeyType;

  @ApiPropertyOptional({
    type: [String],
    description: 'Scopes e.g. ["payments:write", "payouts:read"]',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Optional expiry ISO date' })
  @IsOptional()
  expiresAt?: string;
}
