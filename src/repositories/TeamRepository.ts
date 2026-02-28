import prisma from '../lib/prisma';
import { Team, Prisma } from '@prisma/client';

export class TeamRepository {
  async create(data: Prisma.TeamCreateInput): Promise<Team> {
    return prisma.team.create({
      data,
    });
  }

  async findAllByUserId(userId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: { userId },
      include: {
        members: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
        where: { id },
        include: { members: true }
    });
  }

  async update(id: string, data: Prisma.TeamUpdateInput): Promise<Team> {
    return prisma.team.update({
        where: { id },
        data,
        include: { members: true }
    });
  }

  async delete(id: string): Promise<Team> {
    return prisma.team.delete({
      where: { id }
    });
  }
}
