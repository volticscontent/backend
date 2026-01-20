import { Admin, Prisma } from '@prisma/client';

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  create(data: Prisma.AdminCreateInput): Promise<Admin>;
  findAllPublic(): Promise<Partial<Admin>[]>;
}
