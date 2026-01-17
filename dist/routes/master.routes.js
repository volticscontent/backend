"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminRepository_1 = require("../repositories/AdminRepository");
const MasterService_1 = require("../services/MasterService");
const MasterController_1 = require("../controllers/MasterController");
const router = (0, express_1.Router)();
// Dependency Injection
const adminRepository = new AdminRepository_1.AdminRepository();
const masterService = new MasterService_1.MasterService(adminRepository);
const masterController = new MasterController_1.MasterController(masterService);
router.get('/dashboard', masterController.getDashboard);
router.get('/users', masterController.getUsers);
// Adicione mais rotas de serviço master aqui
// Ex: /services, /logs, etc.
exports.default = router;
