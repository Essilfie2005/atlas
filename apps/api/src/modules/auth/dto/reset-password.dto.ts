import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The reset token sent to the user\'s email' })
  @IsString()
  @MaxLength(128)
  token!: string;

  @ApiProperty({ description: 'New password (8–128 characters)', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)  // M1: Prevent billion-laughs / DoS via oversized bcrypt input
  password!: string;
}
