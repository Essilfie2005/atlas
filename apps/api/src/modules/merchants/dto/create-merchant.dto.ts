import { IsString, IsNotEmpty, IsEmail, IsOptional, IsUrl, MaxLength, Length, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({ description: 'Legal business name', example: 'Delivery Ltd' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  legalName!: string;

  @ApiProperty({ description: 'Business contact email', example: 'hello@yourbusiness.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password for dashboard login (min 8 characters)' })
  @IsString() @MinLength(8) @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ description: 'Business website URL' })
  @IsOptional() @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code', example: 'GH' })
  @IsOptional() @IsString() @Length(2, 2)
  country?: string;
}
