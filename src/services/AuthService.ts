import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { Prisma } from '@prisma/client';

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private adminRepository: IAdminRepository
  ) {}

  private generateToken(payload: object): string {
    const secret = process.env.JWT_SECRET || 'default_secret';
    return jwt.sign(payload, secret, { expiresIn: '1d' });
  }

  async registerClient(data: Prisma.UserCreateInput) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const existingSlug = await this.userRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new Error('Slug already taken');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = this.generateToken({ id: user.id, role: 'CLIENT', slug: user.slug });
    return { user, token };
  }

  async loginClient(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({ id: user.id, role: 'CLIENT', slug: user.slug });
    return { user, token };
  }

  async loginAdmin(email: string, password: string) {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({ id: admin.id, role: admin.role });
    return { admin, token };
  }
}
