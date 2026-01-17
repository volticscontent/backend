import { IUserRepository } from '../interfaces/IUserRepository';
import prisma from '../lib/prisma';
import { User, Prisma } from '@prisma/client';

export class UserRepository implements IUserRepository {
  async findBySlug(slug: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { slug },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}
