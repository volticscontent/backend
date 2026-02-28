import { ITeamMemberRepository } from '../interfaces/ITeamMemberRepository';
import prisma from '../lib/prisma';
import { TeamMember, Prisma } from '@prisma/client';

export class TeamMemberRepository implements ITeamMemberRepository {
  async findByEmail(email: string): Promise<(TeamMember & { user: { slug: string } }) | null> {
    return prisma.teamMember.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            slug: true
          }
        }
      }
    });
  }

  async create(data: Prisma.TeamMemberCreateInput): Promise<TeamMember> {
    return prisma.teamMember.create({
      data,
    });
  }

  async findAllByUserId(userId: string): Promise<TeamMember[]> {
    return prisma.teamMember.findMany({
      where: { userId },
      include: {
        teams: true,
        allowedServices: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: string): Promise<TeamMember> {
    return prisma.teamMember.delete({
      where: { id }
    });
  }

  async update(id: string, data: Prisma.TeamMemberUpdateInput): Promise<TeamMember> {
    return prisma.teamMember.update({
      where: { id },
      data,
      include: {
        teams: true,
        allowedServices: true
      }
    });
  }
}
