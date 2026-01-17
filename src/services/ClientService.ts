import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '@prisma/client';

export class ClientService {
  constructor(private userRepository: IUserRepository) {}

  async getClientBySlug(slug: string): Promise<User> {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new Error('Client not found');
    }
    return user;
  }

  async getDashboardData(slug: string) {
    const user = await this.getClientBySlug(slug);
    return {
      message: `Bem-vindo ao painel do cliente: ${user.name}`,
      context: 'Client Context',
      clientId: user.id
    };
  }
  
  async getServices(slug: string) {
      const user = await this.getClientBySlug(slug);
      return {
          message: `Serviços ativos para ${user.name} (${slug})`
      }
  }
}
