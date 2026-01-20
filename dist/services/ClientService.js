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
exports.ClientService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ClientService {
    constructor(userRepository, adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
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
            const [activeServicesCount, pendingInvoicesSum, openTicketsCount, recentInvoices, recentTickets] = yield Promise.all([
                prisma_1.default.service.count({
                    where: {
                        userId: user.id,
                        status: 'ACTIVE'
                    }
                }),
                prisma_1.default.invoice.aggregate({
                    where: {
                        userId: user.id,
                        status: 'PENDING'
                    },
                    _sum: {
                        amount: true
                    }
                }),
                prisma_1.default.ticket.count({
                    where: {
                        userId: user.id,
                        status: 'OPEN'
                    }
                }),
                prisma_1.default.invoice.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    include: { service: true }
                }),
                prisma_1.default.ticket.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                })
            ]);
            // Combinar e ordenar atividades recentes (simplificado)
            const recentActivity = [
                ...recentInvoices.map(inv => ({
                    type: 'invoice',
                    id: inv.id,
                    description: `Fatura #${inv.id.slice(-4)} - ${inv.status}`,
                    date: inv.createdAt,
                    amount: inv.amount
                })),
                ...recentTickets.map(ticket => ({
                    type: 'ticket',
                    id: ticket.id,
                    description: `Ticket: ${ticket.subject}`,
                    date: ticket.createdAt,
                    amount: null
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
            return {
                user: {
                    name: user.name,
                    slug: user.slug,
                    email: user.email
                },
                stats: {
                    activeServices: activeServicesCount,
                    pendingInvoicesAmount: pendingInvoicesSum._sum.amount || 0,
                    openTickets: openTicketsCount
                },
                recentActivity
            };
        });
    }
    getServices(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            const services = yield prisma_1.default.service.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });
            return services;
        });
    }
    getTeam(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validar se cliente existe
            yield this.getClientBySlug(slug);
            // Retornar equipe
            return this.adminRepository.findAllPublic();
        });
    }
    getSidebarMenu(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            const services = yield prisma_1.default.service.findMany({
                where: { userId: user.id, status: 'ACTIVE' },
                select: { title: true, id: true }
            });
            const baseMenu = [
                {
                    title: "Meu Painel",
                    url: "/client",
                    icon: "LayoutDashboard",
                    items: [
                        { title: "Visão Geral", url: "/client" },
                        { title: "Relatórios", url: "/client/reports" },
                    ],
                },
                {
                    title: "Serviços",
                    url: "/client/services",
                    icon: "SquareTerminal",
                    items: [
                        { title: "Meus Contratos", url: "/client/services" },
                        { title: "Faturas", url: "/client/invoices" },
                    ],
                },
                {
                    title: "CMS",
                    url: "/client/cms",
                    icon: "FileText",
                    items: [
                        { title: "Conteúdo", url: "/client/cms" },
                    ],
                },
                {
                    title: "Suporte",
                    url: "/client/support",
                    icon: "LifeBuoy",
                    items: [
                        { title: "Abrir Ticket", url: "/client/support/new" },
                        { title: "Meus Tickets", url: "/client/support" },
                    ],
                },
            ];
            const customServiceMenus = services.map(service => {
                const titleLower = service.title.toLowerCase();
                let items = [];
                let icon = "Box";
                if (titleLower.includes('marketing') || titleLower.includes('tráfego') || titleLower.includes('social')) {
                    icon = "PieChart";
                    items = [
                        { title: "Bases de Dados", url: `/client/services/${service.id}/integrations` },
                        { title: "Campanhas", url: `/client/services/${service.id}/campaigns` },
                    ];
                }
                else if (titleLower.includes('web') || titleLower.includes('site') || titleLower.includes('seo')) {
                    icon = "Globe";
                    items = [
                        { title: "SEO & Visibilidade", url: `/client/services/${service.id}/seo` },
                        { title: "CMS / Conteúdo", url: `/client/services/${service.id}/cms` },
                    ];
                }
                else {
                    items = [
                        { title: "Configurações", url: `/client/services/${service.id}/settings` }
                    ];
                }
                items.push({ title: "Falar com Especialista", url: `/client/services/${service.id}/contact` });
                return {
                    title: service.title,
                    url: `/client/services/${service.id}`,
                    icon: icon,
                    items: items
                };
            });
            return [...baseMenu, ...customServiceMenus];
        });
    }
    getServicesDashboard(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            const [services, tickets, invoices] = yield Promise.all([
                prisma_1.default.service.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
                prisma_1.default.ticket.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }),
                prisma_1.default.invoice.findMany({
                    where: { userId: user.id },
                    orderBy: { dueDate: 'asc' },
                    // take: 10 // Get all relevant for calendar or limit? Let's take 20 for now
                    take: 20
                })
            ]);
            return {
                summary: {
                    totalServices: services.length,
                    activeServices: services.filter(s => s.status === 'ACTIVE').length,
                    openTickets: tickets.filter(t => t.status === 'OPEN').length,
                    pendingInvoices: invoices.filter(i => i.status === 'PENDING').length
                },
                recentTickets: tickets,
                upcomingEvents: invoices.map(i => ({
                    id: i.id,
                    date: i.dueDate,
                    title: `Fatura`,
                    description: `Vencimento de fatura`,
                    amount: i.amount,
                    type: 'invoice',
                    status: i.status
                })),
                services
            };
        });
    }
    getTickets(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            return prisma_1.default.ticket.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });
        });
    }
    createTicket(slug, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            return prisma_1.default.ticket.create({
                data: {
                    subject: data.subject,
                    message: data.message,
                    priority: data.priority,
                    userId: user.id,
                    status: 'OPEN'
                }
            });
        });
    }
    getInvoices(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getClientBySlug(slug);
            return prisma_1.default.invoice.findMany({
                where: { userId: user.id },
                orderBy: { dueDate: 'desc' },
                include: {
                    service: {
                        select: { title: true }
                    }
                }
            });
        });
    }
}
exports.ClientService = ClientService;
