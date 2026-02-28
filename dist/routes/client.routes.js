"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserRepository_1 = require("../repositories/UserRepository");
const AdminRepository_1 = require("../repositories/AdminRepository");
const TeamMemberRepository_1 = require("../repositories/TeamMemberRepository");
const TeamRepository_1 = require("../repositories/TeamRepository");
const ClientService_1 = require("../services/ClientService");
const TeamService_1 = require("../services/TeamService");
const ClientController_1 = require("../controllers/ClientController");
const TeamController_1 = require("../controllers/TeamController");
const stripe_routes_1 = __importDefault(require("./stripe.routes"));
const crm_routes_1 = __importDefault(require("./crm.routes"));
const datasource_routes_1 = __importDefault(require("./datasource.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const router = (0, express_1.Router)({ mergeParams: true });
// Dependency Injection Setup
const userRepository = new UserRepository_1.UserRepository();
const adminRepository = new AdminRepository_1.AdminRepository();
const teamMemberRepository = new TeamMemberRepository_1.TeamMemberRepository();
const teamRepository = new TeamRepository_1.TeamRepository();
const clientService = new ClientService_1.ClientService(userRepository, adminRepository);
const teamService = new TeamService_1.TeamService(teamMemberRepository, userRepository, teamRepository);
const clientController = new ClientController_1.ClientController(clientService);
const teamController = new TeamController_1.TeamController(teamService);
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
router.use('/stripe', stripe_routes_1.default);
router.use('/crm', crm_routes_1.default);
router.use('/datasources', datasource_routes_1.default);
router.use('/products', product_routes_1.default);
exports.default = router;
