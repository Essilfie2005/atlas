import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateSubscriptionDto {
  @ApiProperty() @IsString() @IsNotEmpty() planName!: string;
  @ApiProperty() @IsNumber() @Min(1) amount!: number;
  @ApiProperty() @IsString() @IsNotEmpty() currency!: string;
  @ApiProperty() @IsIn(['DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY']) interval!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
}
