import { IAdminRepository } from '../interfaces/IAdminRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import bcrypt from 'bcryptjs';
import { Prisma, ServiceStatus } from '@prisma/client';
import prisma from '../lib/prisma';

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

  async getUserDetails(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            head: {
                select: { id: true, name: true, role: true, email: true }
            },
            modules: {
                include: {
                    collaborators: {
                        select: { id: true, name: true, role: true, email: true }
                    }
                }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getAllAdmins() {
    return prisma.admin.findMany({
      select: { id: true, name: true, role: true, email: true }
    });
  }

  async createService(userId: string, data: { 
    title: string, 
    sector?: string, 
    description?: string,
    headId?: string,
    modules?: { key: string, name?: string, collaboratorIds: string[] }[],
    features?: string[]
  }) {
    return prisma.$transaction(async (tx) => {
        const service = await tx.service.create({
            data: {
                title: data.title,
                sector: data.sector,
                description: data.description,
                userId: userId,
                status: ServiceStatus.ACTIVE,
                headId: data.headId || undefined,
                features: data.features
            }
        });

        if (data.modules && data.modules.length > 0) {
            for (const mod of data.modules) {
                await tx.serviceModule.create({
                    data: {
                        serviceId: service.id,
                        key: mod.key,
                        name: mod.name || mod.key,
                        collaborators: {
                            connect: mod.collaboratorIds.map(id => ({ id }))
                        }
                    }
                });
            }
        }

        return tx.service.findUnique({
            where: { id: service.id },
            include: {
                head: { select: { id: true, name: true, role: true, email: true } },
                modules: {
                    include: {
                        collaborators: { select: { id: true, name: true, role: true, email: true } }
                    }
                }
            }
        });
    });
  }

  async updateService(serviceId: string, data: { 
      sector?: string, 
      headId?: string | null,
      status?: ServiceStatus, 
      features?: string[], 
      modules?: { key: string, name?: string, collaboratorIds: string[] }[] 
  }) {
    console.log('[MasterService] updateService payload:', JSON.stringify(data, null, 2));
    
    return prisma.$transaction(async (tx) => {
        // Update Service fields
        await tx.service.update({
            where: { id: serviceId },
            data: {
                sector: data.sector,
                status: data.status,
                features: data.features,
                headId: data.headId === "" ? null : data.headId
            }
        });

        if (data.modules) {
            // Get existing modules
            const existingModules = await tx.serviceModule.findMany({
                where: { serviceId }
            });

            // Process modules in parallel
            await Promise.all(data.modules.map(mod => {
                const existing = existingModules.find(m => m.key === mod.key);
                
                if (existing) {
                    // Update
                    return tx.serviceModule.update({
                        where: { id: existing.id },
                        data: {
                            name: mod.name || mod.key,
                            collaborators: {
                                set: mod.collaboratorIds.map(id => ({ id }))
                            }
                        }
                    });
                } else {
                    // Create
                    return tx.serviceModule.create({
                        data: {
                            serviceId,
                            key: mod.key,
                            name: mod.name || mod.key,
                            collaborators: {
                                connect: mod.collaboratorIds.map(id => ({ id }))
                            }
                        }
                    });
                }
            }));

            // Delete modules not in payload (user unchecked them)
            const payloadKeys = data.modules.map(m => m.key);
            await tx.serviceModule.deleteMany({
                where: {
                    serviceId,
                    key: { notIn: payloadKeys }
                }
            });
        }
        
        // Return updated service with all relations
        return tx.service.findUnique({
            where: { id: serviceId },
            include: {
                head: {
                    select: { id: true, name: true, role: true, email: true }
                },
                modules: {
                    include: {
                        collaborators: {
                            select: { id: true, name: true, role: true, email: true }
                        }
                    }
                }
            }
        });
    }, {
        timeout: 20000 // Increase timeout to 20s
    });
  }

  async deleteService(serviceId: string) {
    return prisma.$transaction(async (tx) => {
        // Delete related modules explicitly to ensure clean removal
        await tx.serviceModule.deleteMany({
            where: { serviceId }
        });

        // Delete the service
        return tx.service.delete({
            where: { id: serviceId }
        });
    });
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
