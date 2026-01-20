"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserRepository_1 = require("../repositories/UserRepository");
const AdminRepository_1 = require("../repositories/AdminRepository");
const ClientService_1 = require("../services/ClientService");
const ClientController_1 = require("../controllers/ClientController");
const router = (0, express_1.Router)({ mergeParams: true });
// Dependency Injection Setup
const userRepository = new UserRepository_1.UserRepository();
const adminRepository = new AdminRepository_1.AdminRepository();
const clientService = new ClientService_1.ClientService(userRepository, adminRepository);
const clientController = new ClientController_1.ClientController(clientService);
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
exports.default = router;
