import { IUserRepository } from '../interfaces/IUserRepository';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { User } from '@prisma/client';
import prisma from '../lib/prisma';

export class ClientService {
  constructor(
    private userRepository: IUserRepository,
    private adminRepository: IAdminRepository
  ) { }

  async getClientBySlug(slug: string): Promise<User> {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new Error('Client not found');
    }
    return user;
  }

  async getDashboardData(slug: string) {
    const user = await this.getClientBySlug(slug);

    const [activeServicesCount, pendingInvoicesSum, openTicketsCount, recentInvoices, recentTickets, cmsCollectionsCount, cmsEntriesCount, activeCampaignsCount, cmsTypes] = await Promise.all([
      prisma.service.count({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        }
      }),
      prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: 'PENDING'
        },
        _sum: {
          amount: true
        }
      }),
      prisma.ticket.count({
        where: {
          userId: user.id,
          status: 'OPEN'
        }
      }),
      prisma.invoice.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { service: true }
      }),
      prisma.ticket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      prisma.cmsContentType.count({
        where: { userId: user.id }
      }),
      prisma.cmsContentEntry.count({
        where: { contentType: { userId: user.id } }
      }),
      prisma.campaign.count({
        where: { userId: user.id, status: 'ACTIVE' }
      }),
      prisma.cmsContentType.findMany({
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
  }

  async getServices(slug: string) {
    const user = await this.getClientBySlug(slug);
    const services = await prisma.service.findMany({
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
  }

  async getTeam(slug: string) {
    // Validar se cliente existe
    await this.getClientBySlug(slug);

    // Retornar equipe
    return this.adminRepository.findAllPublic();
  }

  async getSidebarMenu(slug: string) {
    const user = await this.getClientBySlug(slug);
    const services = await prisma.service.findMany({
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
    const allFeatures = new Set<string>();
    services.forEach(service => {
      service.features?.forEach(f => allFeatures.add(f));
      service.modules?.forEach(m => allFeatures.add(m.key));
    });

    // Helper to check global feature presence
    const hasGlobalFeature = (key: string) => allFeatures.has(key);

    // Resolver definitions (Key situational items)
    const resolvers: any[] = [];

    // Bases de Dados (DataSources)
    // Activates if any data-generating feature is present
    if (
      hasGlobalFeature('TRACKING') ||
      hasGlobalFeature('CMS') ||
      hasGlobalFeature('FORMS') ||
      hasGlobalFeature('STRIPE') ||
      hasGlobalFeature('CHECKOUT')
    ) {
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

      const hasFeature = (key: string) => features.includes(key) || moduleKeys.includes(key);

      let items: { title: string; url: string }[] = [];
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
        if (HAS_TRACKING) items.push({ title: "Bases de Dados", url: `/client/services/${service.id}/integrations` });
        if (HAS_CAMPAIGNS) items.push({ title: "Campanhas", url: `/client/services/${service.id}/campaigns` });
        if (HAS_SEO) items.push({ title: "SEO & Visibilidade", url: `/client/services/${service.id}/seo` });
        if (HAS_CMS) items.push({ title: "Conteúdo (CMS)", url: `/client/services/${service.id}/cms` });
        if (HAS_FORMS) items.push({ title: "Formulários", url: `/client/services/${service.id}/web-dev/forms` });
        if (HAS_CHECKOUT) items.push({ title: "Checkout", url: `/client/services/${service.id}/web-dev/checkout` });

        // Set Icon based on dominance
        if (HAS_CAMPAIGNS) {
          if (titleLower.includes('social') || titleLower.includes('instagram') || titleLower.includes('facebook')) icon = "Megaphone";
          else if (titleLower.includes('ads') || titleLower.includes('tráfego') || titleLower.includes('google')) icon = "TrendingUp";
          else icon = "BarChart3";
        }
        else if (HAS_CMS) {
          if (titleLower.includes('blog')) icon = "PenTool";
          else icon = "Monitor";
        }
        else if (HAS_FORMS) icon = "ClipboardList";
        else if (HAS_CHECKOUT) icon = "CreditCard";
        else if (HAS_TRACKING) icon = "Database";
        else if (HAS_SEO) icon = "Search";
        else if (hasAnyFeature) icon = "Layers";

      } else {
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
  }

  async getServicesDashboard(slug: string) {
    const user = await this.getClientBySlug(slug);

    const [services, tickets, invoices] = await Promise.all([
      prisma.service.findMany({
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
      prisma.ticket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.invoice.findMany({
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
  }

  async getTickets(slug: string) {
    const user = await this.getClientBySlug(slug);
    return prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTicket(slug: string, data: { subject: string; message: string; priority: any }) {
    const user = await this.getClientBySlug(slug);
    return prisma.ticket.create({
      data: {
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        userId: user.id,
        status: 'OPEN'
      }
    });
  }

  async getInvoices(slug: string) {
    const user = await this.getClientBySlug(slug);
    return prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { dueDate: 'desc' },
      include: {
        service: {
          select: { title: true }
        }
      }
    });
  }
}
