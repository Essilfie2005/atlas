import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreatePaymentPageDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) amount?: number;
  @ApiProperty() @IsString() @IsNotEmpty() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() redirectUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
}
