import { Router } from 'express';
import { AdminRepository } from '../repositories/AdminRepository';
import { UserRepository } from '../repositories/UserRepository';
import { MasterService } from '../services/MasterService';
import { MasterController } from '../controllers/MasterController';
import { ensureAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Dependency Injection
const adminRepository = new AdminRepository();
const userRepository = new UserRepository();
const masterService = new MasterService(adminRepository, userRepository);
const masterController = new MasterController(masterService);

router.use(ensureAdmin); // Protect all master routes

router.get('/dashboard', masterController.getDashboard);
router.get('/users', masterController.getUsers);
router.get('/users/:id', masterController.getUserDetails);
router.post('/users/:userId/services', masterController.createService);
router.put('/services/:id', masterController.updateService);
router.delete('/services/:id', masterController.deleteService);
router.get('/admins', masterController.getAdmins);
router.post('/admins', masterController.createAdmin);
router.post('/clients', masterController.createClient);

// Adicione mais rotas de serviço master aqui
// Ex: /services, /logs, etc.

export default router;
