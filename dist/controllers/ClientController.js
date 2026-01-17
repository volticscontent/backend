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
exports.ClientController = void 0;
class ClientController {
    constructor(clientService) {
        this.clientService = clientService;
        // Usar arrow functions para preservar o 'this' ou fazer bind no router
        this.getDashboard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { clientSlug } = req.params;
            try {
                if (!clientSlug || typeof clientSlug !== 'string') {
                    res.status(400).json({ error: 'Client slug required and must be a string' });
                    return;
                }
                const data = yield this.clientService.getDashboardData(clientSlug);
                res.json(data);
            }
            catch (error) {
                this.handleError(res, error);
            }
        });
        this.getServices = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { clientSlug } = req.params;
            try {
                if (!clientSlug || typeof clientSlug !== 'string') {
                    res.status(400).json({ error: 'Client slug required and must be a string' });
                    return;
                }
                const data = yield this.clientService.getServices(clientSlug);
                res.json(data);
            }
            catch (error) {
                this.handleError(res, error);
            }
        });
        this.validateClientMiddleware = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { clientSlug } = req.params;
            if (!clientSlug || typeof clientSlug !== 'string') {
                res.status(400).json({ error: 'Client slug not provided or invalid' });
                return;
            }
            try {
                yield this.clientService.getClientBySlug(clientSlug);
                next();
            }
            catch (error) {
                if (error.message === 'Client not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    console.error(error);
                    res.status(500).json({ error: 'Internal server error checking client' });
                }
            }
        });
    }
    handleError(res, error) {
        if (error.message === 'Client not found') {
            res.status(404).json({ error: error.message });
        }
        else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
exports.ClientController = ClientController;
