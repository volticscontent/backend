import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { ITeamMemberRepository } from '../interfaces/ITeamMemberRepository';
import { Prisma } from '@prisma/client';

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private adminRepository: IAdminRepository,
    private teamMemberRepository: ITeamMemberRepository
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

    const token = this.generateToken({ 
      id: user.id, 
      role: 'OWNER', // Changed from CLIENT to OWNER
      slug: user.slug,
      memberId: null
    });
    return { user, token };
  }

  async loginClient(email: string, password: string) {
    // 1. Try to find as Account Owner (User)
    const user = await this.userRepository.findByEmail(email);
    
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const token = this.generateToken({ 
          id: user.id, 
          role: 'OWNER', 
          slug: user.slug,
          memberId: null
        });
        return { user, token, isMember: false };
      }
    }

    // 2. Try to find as Team Member
    const member = await this.teamMemberRepository.findByEmail(email);
    
    if (member) {
      const isPasswordValid = await bcrypt.compare(password, member.password);
      if (isPasswordValid) {
        // IMPORTANT: id in token is the Account ID (member.userId) so permissions work
        const token = this.generateToken({ 
          id: member.userId, 
          role: member.role, 
          slug: member.user.slug,
          memberId: member.id 
        });
        // We return the member object but maybe the frontend expects the 'user' object structure?
        // For now let's return member as user, but we might need to normalize response
        return { user: member, token, isMember: true };
      }
    }

    throw new Error('Invalid credentials');
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
