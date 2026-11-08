import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateRefundDto {
  @ApiProperty() @IsString() @IsNotEmpty() paymentIntentId!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(['DUPLICATE','FRAUDULENT','CUSTOMER_REQUEST','OTHER']) reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
