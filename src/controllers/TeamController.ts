import { Request, Response } from 'express';
import { TeamService } from '../services/TeamService';

export class TeamController {
  constructor(private teamService: TeamService) {}

  // Members
  getMembers = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params as { clientSlug: string };
    try {
      const members = await this.teamService.getMembers(clientSlug);
      res.json(members);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  inviteMember = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params as { clientSlug: string };
    const { name, email, role } = req.body;
    try {
      const member = await this.teamService.inviteMember(clientSlug, { name, email, role });
      res.status(201).json(member);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  updateMember = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug, id } = req.params as { clientSlug: string; id: string };
    const { role, teamIds, serviceIds } = req.body;
    try {
        const member = await this.teamService.updateMember(clientSlug, id, { role, teamIds, serviceIds });
        res.json(member);
    } catch (error: any) {
        this.handleError(res, error);
    }
  }

  removeMember = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug, id } = req.params as { clientSlug: string; id: string };
    try {
      await this.teamService.removeMember(clientSlug, id);
      res.status(204).send();
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  // Teams
  getTeams = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params as { clientSlug: string };
    try {
      const teams = await this.teamService.getTeams(clientSlug);
      res.json(teams);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  createTeam = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params as { clientSlug: string };
    const { name, description } = req.body;
    try {
      const team = await this.teamService.createTeam(clientSlug, { name, description });
      res.status(201).json(team);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  updateTeam = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug, id } = req.params as { clientSlug: string; id: string };
    const { name, description, memberIds } = req.body;
    try {
        const team = await this.teamService.updateTeam(clientSlug, id, { name, description, memberIds });
        res.json(team);
    } catch (error: any) {
        this.handleError(res, error);
    }
  }

  deleteTeam = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug, id } = req.params as { clientSlug: string; id: string };
    try {
      await this.teamService.deleteTeam(clientSlug, id);
      res.status(204).send();
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any) {
    if (error.message === 'Client not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('already registered')) {
        res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
