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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
class MasterService {
    constructor(adminRepository, userRepository) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
    }
    getDashboardData() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                message: 'Bem-vindo ao painel Master/Admin',
                context: 'Master Context'
            };
        });
    }
    getUsersList() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.findAll();
        });
    }
    getUserDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.findUnique({
                where: { id },
                include: {
                    services: {
                        include: {
                            collaborators: {
                                select: { id: true, name: true, role: true, email: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        });
    }
    getAllAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.admin.findMany({
                select: { id: true, name: true, role: true, email: true }
            });
        });
    }
    createService(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.service.create({
                data: {
                    title: data.title,
                    sector: data.sector,
                    description: data.description,
                    userId: userId,
                    status: 'ACTIVE'
                }
            });
        });
    }
    updateService(serviceId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.service.update({
                where: { id: serviceId },
                data: {
                    sector: data.sector,
                    status: data.status,
                    collaborators: data.collaboratorIds ? {
                        set: data.collaboratorIds.map(id => ({ id }))
                    } : undefined
                }
            });
        });
    }
    createAdmin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingAdmin = yield this.adminRepository.findByEmail(data.email);
            if (existingAdmin) {
                throw new Error('Admin already exists');
            }
            const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
            // Remove id if present, let DB handle it or if it's CUID
            // Prisma types usually handle this, but explicit password hashing is needed
            return this.adminRepository.create(Object.assign(Object.assign({}, data), { password: hashedPassword }));
        });
    }
    createClient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(data.email);
            if (existingUser) {
                throw new Error('User already exists');
            }
            const existingSlug = yield this.userRepository.findBySlug(data.slug);
            if (existingSlug) {
                throw new Error('Slug already taken');
            }
            const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
            return this.userRepository.create(Object.assign(Object.assign({}, data), { password: hashedPassword }));
        });
    }
}
exports.MasterService = MasterService;
