import { User, Prisma } from '@prisma/client';

export interface IUserRepository {
  findBySlug(slug: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: Prisma.UserCreateInput): Promise<User>;
}
