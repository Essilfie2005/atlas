import { IsEmail, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class CreateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) name?: string;
  @ApiPropertyOptional({
    description: 'Phone number in E.164 format',
    example: '+233244123456',
  })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'phone must be a valid E.164 number e.g. +233244123456' })
  phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalReference?: string;
}
