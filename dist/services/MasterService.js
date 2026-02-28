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
const client_1 = require("@prisma/client");
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
                            head: {
                                select: { id: true, name: true, role: true, email: true }
                            },
                            modules: {
                                include: {
                                    collaborators: {
                                        select: { id: true, name: true, role: true, email: true }
                                    }
                                }
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
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const service = yield tx.service.create({
                    data: {
                        title: data.title,
                        sector: data.sector,
                        description: data.description,
                        userId: userId,
                        status: client_1.ServiceStatus.ACTIVE,
                        headId: data.headId || undefined,
                        features: data.features
                    }
                });
                if (data.modules && data.modules.length > 0) {
                    for (const mod of data.modules) {
                        yield tx.serviceModule.create({
                            data: {
                                serviceId: service.id,
                                key: mod.key,
                                name: mod.name || mod.key,
                                collaborators: {
                                    connect: mod.collaboratorIds.map(id => ({ id }))
                                }
                            }
                        });
                    }
                }
                return tx.service.findUnique({
                    where: { id: service.id },
                    include: {
                        head: { select: { id: true, name: true, role: true, email: true } },
                        modules: {
                            include: {
                                collaborators: { select: { id: true, name: true, role: true, email: true } }
                            }
                        }
                    }
                });
            }));
        });
    }
    updateService(serviceId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[MasterService] updateService payload:', JSON.stringify(data, null, 2));
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Update Service fields
                yield tx.service.update({
                    where: { id: serviceId },
                    data: {
                        sector: data.sector,
                        status: data.status,
                        features: data.features,
                        headId: data.headId === "" ? null : data.headId
                    }
                });
                if (data.modules) {
                    // Get existing modules
                    const existingModules = yield tx.serviceModule.findMany({
                        where: { serviceId }
                    });
                    // Process modules in parallel
                    yield Promise.all(data.modules.map(mod => {
                        const existing = existingModules.find(m => m.key === mod.key);
                        if (existing) {
                            // Update
                            return tx.serviceModule.update({
                                where: { id: existing.id },
                                data: {
                                    name: mod.name || mod.key,
                                    collaborators: {
                                        set: mod.collaboratorIds.map(id => ({ id }))
                                    }
                                }
                            });
                        }
                        else {
                            // Create
                            return tx.serviceModule.create({
                                data: {
                                    serviceId,
                                    key: mod.key,
                                    name: mod.name || mod.key,
                                    collaborators: {
                                        connect: mod.collaboratorIds.map(id => ({ id }))
                                    }
                                }
                            });
                        }
                    }));
                    // Delete modules not in payload (user unchecked them)
                    const payloadKeys = data.modules.map(m => m.key);
                    yield tx.serviceModule.deleteMany({
                        where: {
                            serviceId,
                            key: { notIn: payloadKeys }
                        }
                    });
                }
                // Return updated service with all relations
                return tx.service.findUnique({
                    where: { id: serviceId },
                    include: {
                        head: {
                            select: { id: true, name: true, role: true, email: true }
                        },
                        modules: {
                            include: {
                                collaborators: {
                                    select: { id: true, name: true, role: true, email: true }
                                }
                            }
                        }
                    }
                });
            }), {
                timeout: 20000 // Increase timeout to 20s
            });
        });
    }
    deleteService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Delete related modules explicitly to ensure clean removal
                yield tx.serviceModule.deleteMany({
                    where: { serviceId }
                });
                // Delete the service
                return tx.service.delete({
                    where: { id: serviceId }
                });
            }));
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
