import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { AdminRepository } from '../repositories/AdminRepository';

const authRoutes = Router();

const userRepository = new UserRepository();
const adminRepository = new AdminRepository();
const authService = new AuthService(userRepository, adminRepository);
const authController = new AuthController(authService);

// Client Auth
authRoutes.post('/register', (req, res) => authController.registerClient(req, res));
authRoutes.post('/login', (req, res) => authController.loginClient(req, res));

// Admin Auth
authRoutes.post('/admin/login', (req, res) => authController.loginAdmin(req, res));

export default authRoutes;
