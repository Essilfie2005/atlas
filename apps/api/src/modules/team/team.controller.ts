import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TeamService, TeamRole } from './team.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

export class InviteMemberDto {
  @ApiProperty({ example: 'jane@company.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ enum: ['ADMIN', 'DEVELOPER', 'VIEWER'] })
  @IsEnum(['ADMIN', 'DEVELOPER', 'VIEWER'])
  role!: TeamRole;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'DEVELOPER', 'VIEWER'] })
  @IsEnum(['ADMIN', 'DEVELOPER', 'VIEWER'])
  role!: TeamRole;
}

@ApiTags('team')
@Controller('team')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'List all team members' })
  async listMembers(@CurrentMerchant() merchant: { id: string }) {
    return this.teamService.listMembers(merchant.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member' })
  async invite(
    @CurrentMerchant() merchant: { id: string },
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamService.inviteMember(merchant.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a team member' })
  async remove(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
  ) {
    await this.teamService.removeMember(merchant.id, id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a team member role' })
  async updateRole(
    @CurrentMerchant() merchant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.teamService.updateMemberRole(merchant.id, id, dto.role);
  }
}
