"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterController = void 0;
class MasterController {
    constructor(masterService) {
        this.masterService = masterService;
        this.getDashboard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.masterService.getDashboardData();
                res.json(data);
            }
            catch (error) {
                console.error('[MasterController] getDashboard Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.getUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.masterService.getUsersList();
                res.json(data);
            }
            catch (error) {
                console.error('[MasterController] getUsers Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.getUserDetails = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (typeof id !== 'string') {
                    return res.status(400).json({ error: 'Invalid ID format' });
                }
                const data = yield this.masterService.getUserDetails(id);
                if (!data)
                    return res.status(404).json({ error: 'User not found' });
                res.json(data);
            }
            catch (error) {
                console.error('[MasterController] getUserDetails Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.getAdmins = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.masterService.getAllAdmins();
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.createService = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                if (typeof userId !== 'string') {
                    return res.status(400).json({ error: 'Invalid User ID format' });
                }
                const service = yield this.masterService.createService(userId, req.body);
                res.status(201).json(service);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        this.deleteService = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (typeof id !== 'string') {
                    return res.status(400).json({ error: 'Invalid ID format' });
                }
                yield this.masterService.deleteService(id);
                res.status(204).send();
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        this.updateService = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (typeof id !== 'string') {
                    return res.status(400).json({ error: 'Invalid ID format' });
                }
                const service = yield this.masterService.updateService(id, req.body);
                res.json(service);
            }
            catch (error) {
                console.error('[MasterController] Update Error:', error);
                res.status(400).json({ error: error.message });
            }
        });
        this.createAdmin = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield this.masterService.createAdmin(req.body);
                res.status(201).json(admin);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        this.createClient = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield this.masterService.createClient(req.body);
                res.status(201).json(client);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }
}
exports.MasterController = MasterController;
