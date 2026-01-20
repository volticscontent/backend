import { IUserRepository } from '../interfaces/IUserRepository';
import { IAdminRepository } from '../interfaces/IAdminRepository';
import { User } from '@prisma/client';
import prisma from '../lib/prisma';

export class ClientService {
  constructor(
    private userRepository: IUserRepository,
    private adminRepository: IAdminRepository
  ) {}

  async getClientBySlug(slug: string): Promise<User> {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new Error('Client not found');
    }
    return user;
  }

  async getDashboardData(slug: string) {
    const user = await this.getClientBySlug(slug);
    
    const [activeServicesCount, pendingInvoicesSum, openTicketsCount, recentInvoices, recentTickets] = await Promise.all([
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
  }
  
  async getServices(slug: string) {
      const user = await this.getClientBySlug(slug);
      const services = await prisma.service.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
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
        } else if (titleLower.includes('web') || titleLower.includes('site') || titleLower.includes('seo')) {
             icon = "Globe";
             items = [
                { title: "SEO & Visibilidade", url: `/client/services/${service.id}/seo` },
                { title: "Conteúdo", url: `/client/services/${service.id}/cms` },
             ];
        } else {
            items = [
                { title: "Configurações", url: `/client/services/${service.id}/settings` }
            ]
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
      prisma.service.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
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
