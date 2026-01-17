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
exports.ClientService = void 0;
class ClientService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    getClientBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findBySlug(slug);
            if (!user) {
                throw new Error('Client not found');
            }
            return user;
        });
    }
    getDashboardData(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            return {
                message: `Bem-vindo ao painel do cliente: ${user.name}`,
                context: 'Client Context',
                clientId: user.id
            };
        });
    }
    getServices(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            return {
                message: `Serviços ativos para ${user.name} (${slug})`
            };
        });
    }
}
exports.ClientService = ClientService;
