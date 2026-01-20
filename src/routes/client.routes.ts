import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { ClientService } from '../services/ClientService';
import { ClientController } from '../controllers/ClientController';

const router = Router({ mergeParams: true });

// Dependency Injection Setup
const userRepository = new UserRepository();
const adminRepository = new AdminRepository();
const clientService = new ClientService(userRepository, adminRepository);
const clientController = new ClientController(clientService);

// Middleware
router.use(clientController.validateClientMiddleware);

// Routes
router.get('/dashboard', clientController.getDashboard);
router.get('/services', clientController.getServices);
router.get('/services/dashboard', clientController.getServicesDashboard);
router.get('/tickets', clientController.getTickets);
router.post('/tickets', clientController.createTicket);
router.get('/invoices', clientController.getInvoices);
router.get('/team', clientController.getTeam);
router.get('/sidebar', clientController.getSidebarMenu);

export default router;
