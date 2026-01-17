import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { ClientService } from '../services/ClientService';
import { ClientController } from '../controllers/ClientController';

const router = Router({ mergeParams: true });

// Dependency Injection Setup
const userRepository = new UserRepository();
const clientService = new ClientService(userRepository);
const clientController = new ClientController(clientService);

// Middleware
router.use(clientController.validateClientMiddleware);

// Routes
router.get('/dashboard', clientController.getDashboard);
router.get('/services', clientController.getServices);

export default router;
