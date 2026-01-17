import { IAdminRepository } from '../interfaces/IAdminRepository';
import prisma from '../lib/prisma';
import { Admin, Prisma } from '@prisma/client';

export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return prisma.admin.create({
      data,
    });
  }
}
