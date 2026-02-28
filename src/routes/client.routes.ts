import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { TeamMemberRepository } from '../repositories/TeamMemberRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { ClientService } from '../services/ClientService';
import { TeamService } from '../services/TeamService';
import { ClientController } from '../controllers/ClientController';
import { TeamController } from '../controllers/TeamController';
import stripeRoutes from './stripe.routes';
import crmRoutes from './crm.routes';
import datasourceRoutes from './datasource.routes';
import productRoutes from './product.routes';

const router = Router({ mergeParams: true });

// Dependency Injection Setup
const userRepository = new UserRepository();
const adminRepository = new AdminRepository();
const teamMemberRepository = new TeamMemberRepository();
const teamRepository = new TeamRepository();

const clientService = new ClientService(userRepository, adminRepository);
const teamService = new TeamService(teamMemberRepository, userRepository, teamRepository);

const clientController = new ClientController(clientService);
const teamController = new TeamController(teamService);

// Middleware
router.use(clientController.validateClientMiddleware);

// Routes
router.get('/dashboard', clientController.getDashboard);
router.get('/services', clientController.getServices);
router.get('/services/dashboard', clientController.getServicesDashboard);
router.get('/tickets', clientController.getTickets);
router.post('/tickets', clientController.createTicket);
router.get('/invoices', clientController.getInvoices);
router.get('/sidebar', clientController.getSidebarMenu);

// Team Members Routes
router.get('/team', teamController.getMembers);
router.post('/team', teamController.inviteMember);
router.put('/team/:id', teamController.updateMember);
router.delete('/team/:id', teamController.removeMember);

// Teams (Groups) Routes
router.get('/teams', teamController.getTeams);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

// Sub-routes
router.use('/stripe', stripeRoutes);
router.use('/crm', crmRoutes);
router.use('/datasources', datasourceRoutes);
router.use('/products', productRoutes);

export default router;
