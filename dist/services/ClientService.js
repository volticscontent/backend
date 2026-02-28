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
            const [activeServicesCount, pendingInvoicesSum, openTicketsCount, recentInvoices, recentTickets, cmsCollectionsCount, cmsEntriesCount, activeCampaignsCount, cmsTypes] = yield Promise.all([
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
                }),
                prisma_1.default.cmsContentType.count({
                    where: { userId: user.id }
                }),
                prisma_1.default.cmsContentEntry.count({
                    where: { contentType: { userId: user.id } }
                }),
                prisma_1.default.campaign.count({
                    where: { userId: user.id, status: 'ACTIVE' }
                }),
                prisma_1.default.cmsContentType.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: { entries: true }
                        }
                    }
                })
            ]);
            // Combinar e ordenar atividades recentes (simplificado)
            const recentActivity = [
                ...recentInvoices.map(inv => ({
                    type: 'invoice',
                    id: inv.id,
                    description: `Fatura #${inv.id.slice(-4)} - ${inv.status}`,
                    date: inv.createdAt,
                    amount: Number(inv.amount)
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
                    pendingInvoicesAmount: Number(pendingInvoicesSum._sum.amount || 0),
                    openTickets: openTicketsCount,
                    campaigns: {
                        active: activeCampaignsCount,
                        spend: 0, // Placeholder until external API integration
                        clicks: 0 // Placeholder until external API integration
                    },
                    cms: {
                        collections: cmsCollectionsCount,
                        entries: cmsEntriesCount,
                        types: cmsTypes.map(t => ({
                            id: t.id,
                            name: t.name,
                            count: t._count.entries
                        }))
                    }
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
                orderBy: { createdAt: 'desc' },
                include: {
                    head: { select: { name: true, email: true, role: true } },
                    modules: {
                        include: {
                            collaborators: { select: { name: true, email: true, role: true } }
                        }
                    }
                }
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
                select: {
                    title: true,
                    id: true,
                    features: true,
                    modules: {
                        select: { key: true }
                    }
                }
            });
            // 1. Gather all features from all active services
            const allFeatures = new Set();
            services.forEach(service => {
                var _a, _b;
                (_a = service.features) === null || _a === void 0 ? void 0 : _a.forEach(f => allFeatures.add(f));
                (_b = service.modules) === null || _b === void 0 ? void 0 : _b.forEach(m => allFeatures.add(m.key));
            });
            // Helper to check global feature presence
            const hasGlobalFeature = (key) => allFeatures.has(key);
            // Resolver definitions (Key situational items)
            const resolvers = [];
            // Bases de Dados (DataSources)
            // Activates if any data-generating feature is present
            if (hasGlobalFeature('TRACKING') ||
                hasGlobalFeature('CMS') ||
                hasGlobalFeature('FORMS') ||
                hasGlobalFeature('STRIPE') ||
                hasGlobalFeature('CHECKOUT')) {
                resolvers.push({
                    title: "Bases de Dados",
                    url: "/client/databases",
                    icon: "Database",
                });
            }
            // Produtos (Products)
            if (hasGlobalFeature('PRODUCTS') || hasGlobalFeature('CHECKOUT') || hasGlobalFeature('ECOMMERCE')) {
                resolvers.push({
                    title: "Produtos",
                    url: "/client/products",
                    icon: "ShoppingBag",
                });
            }
            const baseMenu = [
                {
                    title: "Meu Painel",
                    url: "/client",
                    icon: "LayoutDashboard",
                    items: [
                        { title: "Visão Geral", url: "/client" },
                        { title: "Relatórios", url: "/client/reports" },
                        { title: "Minha Equipe", url: "/client/team" },
                    ],
                },
                ...resolvers,
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
                    title: "Suporte",
                    url: "/client/support",
                    icon: "LifeBuoy",
                    items: [
                        { title: "Abrir Ticket", url: "/client/support/new" },
                        { title: "Meus Tickets", url: "/client/support" },
                    ],
                },
                {
                    title: "Configurações",
                    url: "/client/settings",
                    icon: "Settings",
                    items: [
                        { title: "Negócio", url: "/client/settings" },
                        { title: "Equipe", url: "/client/team" },
                    ],
                },
            ];
            const customServiceMenus = services.map(service => {
                const titleLower = service.title.toLowerCase();
                const features = service.features || [];
                const moduleKeys = service.modules ? service.modules.map(m => m.key) : [];
                const hasFeature = (key) => features.includes(key) || moduleKeys.includes(key);
                let items = [];
                let icon = "Box";
                // Feature flags constants
                const HAS_TRACKING = hasFeature('TRACKING');
                const HAS_CAMPAIGNS = hasFeature('CAMPAIGNS') || hasFeature('Gestão de Ads');
                // Helper to check if title implies Web Dev (where SEO might be redundant if not primary)
                const isWebDev = titleLower.includes('web') || titleLower.includes('desenvolvimento') || titleLower.includes('site');
                const isSEO = titleLower.includes('seo') || titleLower.includes('otimização');
                // SEO trigger refined: Show if feature is present
                const HAS_SEO = hasFeature('SEO') || hasFeature('Análise de keywords') || isSEO;
                const HAS_CMS = hasFeature('CMS');
                const HAS_FORMS = hasFeature('FORMS');
                const HAS_CHECKOUT = hasFeature('CHECKOUT');
                const hasAnyFeature = HAS_TRACKING || HAS_CAMPAIGNS || HAS_SEO || HAS_CMS || HAS_FORMS || HAS_CHECKOUT;
                if (hasAnyFeature) {
                    // Explicit mode: use features to build menu
                    if (HAS_TRACKING)
                        items.push({ title: "Bases de Dados", url: `/client/services/${service.id}/integrations` });
                    if (HAS_CAMPAIGNS)
                        items.push({ title: "Campanhas", url: `/client/services/${service.id}/campaigns` });
                    if (HAS_SEO)
                        items.push({ title: "SEO & Visibilidade", url: `/client/services/${service.id}/seo` });
                    if (HAS_CMS)
                        items.push({ title: "Conteúdo (CMS)", url: `/client/services/${service.id}/cms` });
                    if (HAS_FORMS)
                        items.push({ title: "Formulários", url: `/client/services/${service.id}/web-dev/forms` });
                    if (HAS_CHECKOUT)
                        items.push({ title: "Checkout", url: `/client/services/${service.id}/web-dev/checkout` });
                    // Set Icon based on dominance
                    if (HAS_CAMPAIGNS) {
                        if (titleLower.includes('social') || titleLower.includes('instagram') || titleLower.includes('facebook'))
                            icon = "Megaphone";
                        else if (titleLower.includes('ads') || titleLower.includes('tráfego') || titleLower.includes('google'))
                            icon = "TrendingUp";
                        else
                            icon = "BarChart3";
                    }
                    else if (HAS_CMS) {
                        if (titleLower.includes('blog'))
                            icon = "PenTool";
                        else
                            icon = "Monitor";
                    }
                    else if (HAS_FORMS)
                        icon = "ClipboardList";
                    else if (HAS_CHECKOUT)
                        icon = "CreditCard";
                    else if (HAS_TRACKING)
                        icon = "Database";
                    else if (HAS_SEO)
                        icon = "Search";
                    else if (hasAnyFeature)
                        icon = "Layers";
                }
                else {
                    // No features configured — show only base items.
                    // Admin should configure features/modules for proper menu visibility.
                    icon = "Box";
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
                prisma_1.default.service.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        head: { select: { name: true, email: true, role: true } },
                        modules: {
                            include: {
                                collaborators: { select: { name: true, email: true, role: true } }
                            }
                        }
                    }
                }),
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
