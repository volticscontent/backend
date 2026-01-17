import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed...');

  const salt = await bcrypt.genSalt(10);
  const hashedPasswordAdmin = await bcrypt.hash('admin123', salt);
  const hashedPasswordClient = await bcrypt.hash('client123', salt);

  // 1. Criar Admin Master
  const masterEmail = 'master@agency.com';
  const master = await prisma.admin.upsert({
    where: { email: masterEmail },
    update: {
      password: hashedPasswordAdmin
    },
    create: {
      name: 'Master Admin',
      email: masterEmail,
      password: hashedPasswordAdmin,
      role: 'MASTER',
    },
  });
  console.log(`✅ Admin Master criado: ${master.email} (senha: admin123)`);

  // 2. Criar Cliente Demo
  const clientSlug = 'demo-client';
  const client = await prisma.user.upsert({
    where: { slug: clientSlug },
    update: {
      password: hashedPasswordClient
    },
    create: {
      name: 'Cliente Demo LTDA',
      email: 'contato@demo.com',
      slug: clientSlug,
      password: hashedPasswordClient,
    },
  });
  console.log(`✅ Cliente criado: ${client.slug} (senha: client123)`);

  // 3. Criar Serviços para o Cliente Demo
  const servicesData = [
    {
      title: 'Desenvolvimento Web',
      description: 'Manutenção e desenvolvimento contínuo do website institucional.',
      status: 'ACTIVE',
      features: ['Hospedagem inclusa', 'Suporte 24/7', 'Updates semanais']
    },
    {
      title: 'Marketing Digital',
      description: 'Gestão de redes sociais e campanhas de tráfego pago.',
      status: 'ACTIVE',
      features: ['3 Posts semanais', 'Relatório mensal', 'Gestão de Ads']
    },
    {
      title: 'SEO Otimização',
      description: 'Otimização para motores de busca.',
      status: 'PAUSED',
      features: ['Análise de keywords', 'Otimização On-page']
    }
  ];

  // Limpar dados antigos relacionados para evitar duplicação em seeds subsequentes se não for reset total
  await prisma.invoice.deleteMany({ where: { userId: client.id } });
  await prisma.ticket.deleteMany({ where: { userId: client.id } });
  await prisma.service.deleteMany({ where: { userId: client.id } });

  for (const service of servicesData) {
    await prisma.service.create({
      data: {
        ...service,
        status: service.status as any,
        userId: client.id
      }
    });
  }
  console.log(`✅ Serviços criados para ${client.slug}`);

  // 4. Criar Faturas
  const webService = await prisma.service.findFirst({ where: { title: 'Desenvolvimento Web', userId: client.id }});
  
  const invoicesData = [
    {
      amount: 1250.00,
      status: 'PENDING',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // +5 dias
      serviceName: 'Desenvolvimento Web' 
    },
    {
      amount: 1250.00,
      status: 'PAID',
      dueDate: new Date(new Date().setDate(new Date().getDate() - 30)), // -30 dias
      paidDate: new Date(new Date().setDate(new Date().getDate() - 28)),
      serviceName: 'Desenvolvimento Web'
    }
  ];

  for (const invoice of invoicesData) {
    await prisma.invoice.create({
      data: {
        amount: invoice.amount,
        status: invoice.status as any,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        userId: client.id,
        serviceId: webService?.id
      }
    });
  }
  console.log(`✅ Faturas criadas para ${client.slug}`);

  // 5. Criar Tickets
  const ticketsData = [
    {
      subject: 'Problema no formulário de contato',
      message: 'O formulário não está enviando emails.',
      status: 'OPEN',
      priority: 'HIGH'
    },
    {
      subject: 'Dúvida sobre relatório',
      message: 'Como exportar o relatório em PDF?',
      status: 'CLOSED',
      priority: 'LOW'
    }
  ];

  for (const ticket of ticketsData) {
    await prisma.ticket.create({
      data: {
        ...ticket,
        status: ticket.status as any,
        priority: ticket.priority as any,
        userId: client.id
      }
    });
  }
  console.log(`✅ Tickets criados para ${client.slug}`);

  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
