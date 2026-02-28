"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminRepository_1 = require("../repositories/AdminRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const MasterService_1 = require("../services/MasterService");
const MasterController_1 = require("../controllers/MasterController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Dependency Injection
const adminRepository = new AdminRepository_1.AdminRepository();
const userRepository = new UserRepository_1.UserRepository();
const masterService = new MasterService_1.MasterService(adminRepository, userRepository);
const masterController = new MasterController_1.MasterController(masterService);
router.use(authMiddleware_1.ensureAdmin); // Protect all master routes
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
exports.default = router;
