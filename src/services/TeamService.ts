import { ITeamMemberRepository } from '../interfaces/ITeamMemberRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { TeamRepository } from '../repositories/TeamRepository'; // Using concrete class for now
import { TeamMember, TeamRole, Team } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class TeamService {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private userRepository: IUserRepository,
    private teamRepository: TeamRepository
  ) {}

  // Members
  async getMembers(clientSlug: string): Promise<TeamMember[]> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) {
      throw new Error('Client not found');
    }

    return this.teamMemberRepository.findAllByUserId(user.id);
  }

  async inviteMember(clientSlug: string, data: { name: string; email: string; role: TeamRole }): Promise<TeamMember> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) {
      throw new Error('Client not found');
    }

    const existingMember = await this.teamMemberRepository.findByEmail(data.email);
    if (existingMember) {
      throw new Error('Email already registered as team member');
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
        throw new Error('Email already registered as user');
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return this.teamMemberRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      user: {
        connect: { id: user.id }
      }
    });
  }

  async removeMember(clientSlug: string, memberId: string): Promise<void> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) {
      throw new Error('Client not found');
    }
    // TODO: Verify ownership
    await this.teamMemberRepository.delete(memberId);
  }

  async updateMember(clientSlug: string, memberId: string, data: { role?: TeamRole, teamIds?: string[], serviceIds?: string[] }): Promise<TeamMember> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) throw new Error('Client not found');

    // Prepare update data
    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    
    if (data.teamIds) {
        updateData.teams = {
            set: data.teamIds.map(id => ({ id }))
        };
    }

    if (data.serviceIds) {
        updateData.allowedServices = {
            set: data.serviceIds.map(id => ({ id }))
        };
    }

    return this.teamMemberRepository.update(memberId, updateData);
  }

  // Teams
  async getTeams(clientSlug: string): Promise<Team[]> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) throw new Error('Client not found');
    return this.teamRepository.findAllByUserId(user.id);
  }

  async createTeam(clientSlug: string, data: { name: string; description?: string }): Promise<Team> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) throw new Error('Client not found');

    return this.teamRepository.create({
        name: data.name,
        description: data.description,
        user: { connect: { id: user.id } }
    });
  }

  async updateTeam(clientSlug: string, teamId: string, data: { name?: string; description?: string, memberIds?: string[] }): Promise<Team> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) throw new Error('Client not found');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.memberIds) {
        updateData.members = {
            set: data.memberIds.map(id => ({ id }))
        };
    }

    return this.teamRepository.update(teamId, updateData);
  }

  async deleteTeam(clientSlug: string, teamId: string): Promise<void> {
    const user = await this.userRepository.findBySlug(clientSlug);
    if (!user) throw new Error('Client not found');
    await this.teamRepository.delete(teamId);
  }
}
