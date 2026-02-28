import { TeamMember, Prisma } from '@prisma/client';

export interface ITeamMemberRepository {
  findByEmail(email: string): Promise<(TeamMember & { user: { slug: string } }) | null>;
  create(data: Prisma.TeamMemberCreateInput): Promise<TeamMember>;
  findAllByUserId(userId: string): Promise<TeamMember[]>;
  delete(id: string): Promise<TeamMember>;
  update(id: string, data: Prisma.TeamMemberUpdateInput): Promise<TeamMember>;
}
