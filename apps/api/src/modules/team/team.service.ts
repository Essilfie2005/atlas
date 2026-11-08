import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes, createHash } from 'crypto';

export type TeamRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async listMembers(merchantId: string) {
    // Team members are stored in merchant metadata under the `team` key
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, legalName: true, email: true, metadata: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const meta = (merchant.metadata as any) ?? {};
    const team: any[] = meta.team ?? [];

    // Always ensure the owner appears
    const ownerEntry = team.find((m: any) => m.role === 'OWNER');
    if (!ownerEntry) {
      team.unshift({
        id: `owner_${merchant.id}`,
        name: merchant.legalName,
        email: merchant.email,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
      });
    }
    return team;
  }

  async inviteMember(
    merchantId: string,
    dto: { email: string; name?: string; role: TeamRole },
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, metadata: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const meta = (merchant.metadata as any) ?? {};
    const team: any[] = meta.team ?? [];

    // Check for duplicates
    if (team.find((m: any) => m.email === dto.email)) {
      throw new ConflictException(`${dto.email} is already a team member`);
    }

    const rawInviteToken = randomBytes(16).toString('hex');
    // L2: Store only the SHA-256 hash of the invite token — the raw token goes to the invitee's email only
    const inviteTokenHash = createHash('sha256').update(rawInviteToken).digest('hex');

    const newMember = {
      id: randomBytes(8).toString('hex'),
      name: dto.name ?? '',
      email: dto.email,
      role: dto.role,
      status: 'PENDING',
      joinedAt: new Date().toISOString(),
      inviteToken: inviteTokenHash,  // hash stored, never the raw token
    };

    team.push(newMember);
    meta.team = team;

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { metadata: meta },
    });

    this.logger.log(`Invited ${dto.email} as ${dto.role} to merchant ${merchantId}`);

    // Send invite email (fire-and-forget) — email gets the RAW token, not the hash
    const merchantRecord = await this.prisma.merchant.findUnique({
      where: { id: merchantId }, select: { legalName: true, email: true },
    });
    void this.email.sendTeamInvite({
      to: dto.email,
      inviteeName: dto.name ?? '',
      merchantName: merchantRecord?.legalName ?? 'ATLAS Merchant',
      role: dto.role,
      inviterName: merchantRecord?.legalName ?? 'The team',
      token: rawInviteToken,  // raw token for the link, not the hash
    });

    // Return without the invite token
    const { inviteToken: _, ...safe } = newMember;
    return safe;
  }

  async removeMember(merchantId: string, memberId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, metadata: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const meta = (merchant.metadata as any) ?? {};
    const team: any[] = meta.team ?? [];

    const idx = team.findIndex((m: any) => m.id === memberId);
    if (idx === -1) throw new NotFoundException(`Member ${memberId} not found`);

    const member = team[idx];
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the account owner');
    }

    team.splice(idx, 1);
    meta.team = team;

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { metadata: meta },
    });

    this.logger.log(`Removed member ${memberId} from merchant ${merchantId}`);
  }

  async updateMemberRole(merchantId: string, memberId: string, role: TeamRole) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, metadata: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const meta = (merchant.metadata as any) ?? {};
    const team: any[] = meta.team ?? [];

    const member = team.find((m: any) => m.id === memberId);
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot change owner role');

    member.role = role;
    meta.team = team;

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { metadata: meta },
    });

    return member;
  }
}
