import { IAdminRepository } from '../interfaces/IAdminRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

export class MasterService {
  constructor(
    private adminRepository: IAdminRepository,
    private userRepository: IUserRepository
  ) {}

  async getDashboardData() {
      return {
          message: 'Bem-vindo ao painel Master/Admin',
          context: 'Master Context'
      };
  }

  async getUsersList() {
      return this.userRepository.findAll();
  }

  async createAdmin(data: Prisma.AdminCreateInput) {
    const existingAdmin = await this.adminRepository.findByEmail(data.email);
    if (existingAdmin) {
      throw new Error('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    // Remove id if present, let DB handle it or if it's CUID
    // Prisma types usually handle this, but explicit password hashing is needed
    return this.adminRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async createClient(data: Prisma.UserCreateInput) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const existingSlug = await this.userRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new Error('Slug already taken');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }
}
