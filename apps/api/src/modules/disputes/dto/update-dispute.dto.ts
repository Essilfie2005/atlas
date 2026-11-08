import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateDisputeDto {
  @ApiPropertyOptional() @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}
