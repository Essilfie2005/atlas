import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ParticipantDto {
  @ApiProperty() @IsString() @IsNotEmpty() beneficiaryId!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sharePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) fixedAmount?: number;
}

export class CreateSplitPaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty() @IsString() @IsNotEmpty() currency!: string;
  @ApiProperty({ type: [ParticipantDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => ParticipantDto) participants!: ParticipantDto[];
}
