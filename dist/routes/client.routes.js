"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserRepository_1 = require("../repositories/UserRepository");
const ClientService_1 = require("../services/ClientService");
const ClientController_1 = require("../controllers/ClientController");
const router = (0, express_1.Router)({ mergeParams: true });
// Dependency Injection Setup
const userRepository = new UserRepository_1.UserRepository();
const clientService = new ClientService_1.ClientService(userRepository);
const clientController = new ClientController_1.ClientController(clientService);
// Middleware
router.use(clientController.validateClientMiddleware);
// Routes
router.get('/dashboard', clientController.getDashboard);
router.get('/services', clientController.getServices);
exports.default = router;
