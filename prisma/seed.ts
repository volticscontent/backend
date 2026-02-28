import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';

// ─── Helpers ────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main Seed ──────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando Seed Completa...\n');

  const salt = await bcrypt.genSalt(10);
  const hash = (pw: string) => bcrypt.hashSync(pw, salt);

  // ═══════════════════════════════════════════════════════════
  // 1. ADMINS
  // ═══════════════════════════════════════════════════════════
  const master = await prisma.admin.upsert({
    where: { email: 'master@agency.com' },
    update: {},
    create: {
      name: 'Gustavo Master',
      email: 'master@agency.com',
      password: hash('admin123'),
      role: 'MASTER',
    },
  });

  const dev = await prisma.admin.upsert({
    where: { email: 'dev@agency.com' },
    update: {},
    create: {
      name: 'Lucas Dev',
      email: 'dev@agency.com',
      password: hash('admin123'),
      role: 'DEV',
    },
  });

  const colab = await prisma.admin.upsert({
    where: { email: 'ana@agency.com' },
    update: {},
    create: {
      name: 'Ana Colaboradora',
      email: 'ana@agency.com',
      password: hash('admin123'),
      role: 'COLABORADOR',
    },
  });

  console.log('✅ Admins criados: master, dev, colaboradora');

  // ═══════════════════════════════════════════════════════════
  // 2. CLIENT (User)
  // ═══════════════════════════════════════════════════════════
  const client = await prisma.user.upsert({
    where: { slug: 'demo-client' },
    update: {},
    create: {
      name: 'TechStore Brasil LTDA',
      email: 'contato@techstore.com.br',
      slug: 'demo-client',
      password: hash('admin123'),
      document: '45.123.456/0001-99',
      phone: '(11) 99999-1234',
      plan: 'PRO',
      address: 'Rua Augusta, 1200',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304-001',
    },
  });

  console.log(`✅ Cliente criado: ${client.slug} (senha: admin123)`);

  // Clean existing data for reseeding
  await prisma.trackingEventDelivery.deleteMany({});
  await prisma.trackingEvent.deleteMany({});
  await prisma.trackingSource.deleteMany({});
  await prisma.trackingDestination.deleteMany({});
  await prisma.trackingDataset.deleteMany({});
  await prisma.formSubmission.deleteMany({});
  await prisma.form.deleteMany({ where: { userId: client.id } });
  await prisma.cmsContentEntry.deleteMany({});
  await prisma.cmsContentType.deleteMany({ where: { userId: client.id } });
  await prisma.campaign.deleteMany({ where: { userId: client.id } });
  await prisma.crmDeal.deleteMany({ where: { userId: client.id } });
  await prisma.crmContact.deleteMany({ where: { userId: client.id } });
  await prisma.crmStage.deleteMany({});
  await prisma.crmPipeline.deleteMany({ where: { userId: client.id } });
  await prisma.product.deleteMany({ where: { userId: client.id } });
  await prisma.dataSource.deleteMany({ where: { userId: client.id } });
  await prisma.invoice.deleteMany({ where: { userId: client.id } });
  await prisma.ticket.deleteMany({ where: { userId: client.id } });
  await prisma.checkoutSettings.deleteMany({});
  await prisma.serviceModule.deleteMany({});
  await prisma.service.deleteMany({ where: { userId: client.id } });
  await prisma.credential.deleteMany({ where: { userId: client.id } });
  await prisma.marketingSettings.deleteMany({ where: { userId: client.id } });
  await prisma.seoSettings.deleteMany({ where: { userId: client.id } });

  // ═══════════════════════════════════════════════════════════
  // 3. SERVICES + MODULES
  // ═══════════════════════════════════════════════════════════
  const svcMarketing = await prisma.service.create({
    data: {
      title: 'Gestão de Tráfego',
      description: 'Campanhas de tráfego pago em Meta Ads e Google Ads',
      status: 'ACTIVE',
      sector: 'Marketing',
      features: ['TRACKING', 'CAMPAIGNS'],
      userId: client.id,
      headId: master.id,
      collaborators: { connect: [{ id: colab.id }] },
      modules: {
        create: [
          { key: 'TRACKING', name: 'Rastreamento', status: 'ACTIVE' },
          { key: 'CAMPAIGNS', name: 'Gestão de Campanhas', status: 'ACTIVE' },
        ],
      },
    },
  });

  const svcWebDev = await prisma.service.create({
    data: {
      title: 'Desenvolvimento Web',
      description: 'Landing pages, formulários e sistema de conteúdo',
      status: 'ACTIVE',
      sector: 'Desenvolvimento',
      features: ['CMS', 'FORMS', 'CHECKOUT', 'SEO'],
      userId: client.id,
      headId: dev.id,
      collaborators: { connect: [{ id: dev.id }] },
      modules: {
        create: [
          { key: 'CMS', name: 'CMS', status: 'ACTIVE' },
          { key: 'FORMS', name: 'Formulários', status: 'ACTIVE' },
          { key: 'CHECKOUT', name: 'Checkout', status: 'ACTIVE' },
          { key: 'SEO', name: 'SEO', status: 'ACTIVE' },
        ],
      },
    },
  });

  console.log('✅ 2 Serviços criados com módulos e features');

  // ═══════════════════════════════════════════════════════════
  // 4. CHECKOUT SETTINGS
  // ═══════════════════════════════════════════════════════════
  await prisma.checkoutSettings.create({
    data: {
      serviceId: svcWebDev.id,
      facebookPixelId: '1234567890',
      googlePixelId: 'AW-9876543210',
      collectPhone: true,
      collectAddress: true,
      onePageCheckout: true,
    },
  });

  console.log('✅ CheckoutSettings criado para Web Dev');

  // ═══════════════════════════════════════════════════════════
  // 5. CREDENTIALS
  // ═══════════════════════════════════════════════════════════
  await prisma.credential.create({
    data: {
      userId: client.id,
      serviceName: 'STRIPE',
      apiKey: 'pk_test_demo123456789',
      apiSecret: 'sk_test_demo987654321',
      meta: { mode: 'direct', connected: true },
    },
  });

  await prisma.credential.create({
    data: {
      userId: client.id,
      serviceName: 'API_KEY',
      apiKey: 'rds_api_demo_key_2024',
      meta: { description: 'Chave de API principal' },
    },
  });

  console.log('✅ Credenciais criadas (Stripe + API Key)');

  // ═══════════════════════════════════════════════════════════
  // 6. MARKETING SETTINGS + SEO SETTINGS
  // ═══════════════════════════════════════════════════════════
  await prisma.marketingSettings.create({
    data: {
      userId: client.id,
      metaPixelId: '1234567890123456',
      metaApiToken: 'EAADemo...',
      metaAdAccountId: 'act_123456789',
      tiktokPixelId: 'C00DEMO123',
      googleConversionId: 'AW-987654321',
      googleConversionLabel: 'abcDEF123',
    },
  });

  await prisma.seoSettings.create({
    data: {
      userId: client.id,
      globalTitle: 'TechStore Brasil - Tecnologia Acessível',
      globalDescription: 'Loja de tecnologia com os melhores preços e entrega rápida em todo o Brasil.',
      googleAnalyticsId: 'G-DEMO123456',
      targetKeywords: ['tecnologia', 'smartphones', 'notebooks', 'acessórios', 'loja online', 'tech store'],
    },
  });

  console.log('✅ MarketingSettings + SeoSettings criados');

  // ═══════════════════════════════════════════════════════════
  // 7. PRODUCTS (3 origens: Manual, CMS, Stripe)
  // ═══════════════════════════════════════════════════════════
  const products = await Promise.all([
    // Manual products
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Notebook Gamer Pro X',
        description: 'Notebook para gamers com RTX 4060, 16GB RAM',
        price: 5499.99,
        currency: 'BRL',
        sku: 'NBGPX-001',
        image: 'https://placehold.co/400x300/1a1a2e/e94560?text=Notebook',
        active: true,
        source: null,
        tags: [],
      },
    }),
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Fone Bluetooth ANC',
        description: 'Fone com cancelamento de ruído ativo',
        price: 349.90,
        currency: 'BRL',
        sku: 'FBT-ANC-01',
        image: 'https://placehold.co/400x300/16213e/0f3460?text=Fone',
        active: true,
        source: null,
        tags: [],
      },
    }),
    // Stripe products
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Plano Premium Mensal',
        description: 'Acesso completo à plataforma',
        price: 97.00,
        currency: 'BRL',
        active: true,
        source: 'STRIPE',
        tags: ['stripe'],
        variants: {
          stripeProductId: 'prod_demo_premium',
          stripePriceId: 'price_demo_premium_monthly',
        },
      },
    }),
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Plano Enterprise Anual',
        description: 'Plano corporativo com suporte dedicado',
        price: 997.00,
        currency: 'BRL',
        active: true,
        source: 'STRIPE',
        tags: ['stripe'],
        variants: {
          stripeProductId: 'prod_demo_enterprise',
          stripePriceId: 'price_demo_enterprise_annual',
        },
      },
    }),
    // CMS products
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Camiseta TechStore',
        description: 'Camiseta oficial da marca',
        price: 79.90,
        currency: 'BRL',
        sku: 'CMTS-001',
        image: 'https://placehold.co/400x300/533483/e94560?text=Camiseta',
        active: true,
        source: 'CMS',
        tags: ['cms', 'cms:entry-demo-1'],
        variants: { sizes: ['P', 'M', 'G', 'GG'], colors: ['Preto', 'Branco'] },
      },
    }),
    prisma.product.create({
      data: {
        userId: client.id,
        name: 'Mouse Ergonômico',
        description: 'Mouse vertical ergonômico sem fio',
        price: 189.90,
        currency: 'BRL',
        sku: 'MSE-ERG-01',
        image: 'https://placehold.co/400x300/0f3460/16213e?text=Mouse',
        active: true,
        source: 'CMS',
        tags: ['cms', 'cms:entry-demo-2'],
      },
    }),
  ]);

  console.log(`✅ ${products.length} Produtos criados (Manual, Stripe, CMS)`);

  // ═══════════════════════════════════════════════════════════
  // 8. DATA SOURCES
  // ═══════════════════════════════════════════════════════════
  await Promise.all([
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Produtos (Interno)', type: 'PRODUCT', status: 'ACTIVE' },
    }),
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Stripe Payments', type: 'STRIPE', status: 'ACTIVE', integrationId: 'cred-stripe' },
    }),
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Tracking Principal', type: 'TRACKING', status: 'ACTIVE' },
    }),
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Formulário de Contato', type: 'FORM', status: 'ACTIVE' },
    }),
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Blog Posts', type: 'CMS', status: 'ACTIVE' },
    }),
    prisma.dataSource.create({
      data: { userId: client.id, name: 'Catálogo de Produtos', type: 'CMS', status: 'ACTIVE' },
    }),
  ]);

  console.log('✅ 6 DataSources criados');

  // ═══════════════════════════════════════════════════════════
  // 9. CMS CONTENT TYPES + ENTRIES
  // ═══════════════════════════════════════════════════════════
  const blogType = await prisma.cmsContentType.create({
    data: {
      userId: client.id,
      name: 'Blog Post',
      slug: 'blog-posts',
      description: 'Posts do blog institucional',
      resolver: 'standard',
      fields: [
        { key: 'title', type: 'text', label: 'Título', required: true },
        { key: 'body', type: 'richtext', label: 'Conteúdo', required: true },
        { key: 'cover', type: 'image', label: 'Imagem de Capa', required: false },
        { key: 'author', type: 'text', label: 'Autor', required: false },
        { key: 'excerpt', type: 'textarea', label: 'Resumo', required: false },
      ],
    },
  });

  const productType = await prisma.cmsContentType.create({
    data: {
      userId: client.id,
      name: 'Produtos',
      slug: 'products',
      description: 'Catálogo de produtos',
      resolver: 'products',
      fields: [
        { key: 'name', type: 'text', label: 'Nome', required: true },
        { key: 'price', type: 'number', label: 'Preço', required: true },
        { key: 'description', type: 'richtext', label: 'Descrição', required: false },
        { key: 'image', type: 'image', label: 'Imagem', required: false },
        { key: 'sku', type: 'text', label: 'SKU', required: false },
        { key: 'active', type: 'boolean', label: 'Ativo', required: false },
      ],
    },
  });

  // Blog entries
  const blogPosts = [
    { title: '5 Tendências de Tecnologia para 2026', body: '<p>O mercado de tecnologia está em constante evolução...</p>', author: 'Gustavo R.', excerpt: 'Descubra as principais tendências tech', cover: 'https://placehold.co/800x400/1a1a2e/e94560?text=Tech+2026', status: 'PUBLISHED', slug: 'tendencias-tech-2026' },
    { title: 'Como Escolher o Notebook Ideal', body: '<p>Guia completo para encontrar o notebook perfeito...</p>', author: 'Lucas B.', excerpt: 'Guia de compra de notebooks', cover: 'https://placehold.co/800x400/16213e/0f3460?text=Notebooks', status: 'PUBLISHED', slug: 'como-escolher-notebook' },
    { title: 'Setup Home Office Produtivo', body: '<p>Dicas para montar seu setup de home office...</p>', author: 'Ana S.', excerpt: 'Monte seu home office ideal', cover: 'https://placehold.co/800x400/533483/e94560?text=Home+Office', status: 'PUBLISHED', slug: 'setup-home-office' },
    { title: 'Review: Novo iPhone 17', body: '<p>Análise completa do novo iPhone...</p>', author: 'Gustavo R.', excerpt: 'Vale a pena o novo iPhone?', status: 'DRAFT', slug: 'review-iphone-17' },
    { title: 'Guia de Acessórios Gaming', body: '<p>Os melhores acessórios para gamers...</p>', author: 'Lucas B.', excerpt: 'Top acessórios gaming 2026', status: 'DRAFT', slug: 'acessorios-gaming' },
  ];

  for (const post of blogPosts) {
    await prisma.cmsContentEntry.create({
      data: {
        contentTypeId: blogType.id,
        data: { title: post.title, body: post.body, author: post.author, excerpt: post.excerpt, cover: post.cover || null },
        status: post.status,
        slug: post.slug,
      },
    });
  }

  // Product entries (linked to CMS products via tags)
  await prisma.cmsContentEntry.create({
    data: {
      contentTypeId: productType.id,
      data: { name: 'Camiseta TechStore', price: 79.90, description: 'Camiseta oficial', image: 'https://placehold.co/400x300/533483/e94560?text=Camiseta', sku: 'CMTS-001', active: true },
      status: 'PUBLISHED',
      slug: 'camiseta-techstore',
    },
  });

  await prisma.cmsContentEntry.create({
    data: {
      contentTypeId: productType.id,
      data: { name: 'Mouse Ergonômico', price: 189.90, description: 'Mouse vertical', image: 'https://placehold.co/400x300/0f3460/16213e?text=Mouse', sku: 'MSE-ERG-01', active: true },
      status: 'PUBLISHED',
      slug: 'mouse-ergonomico',
    },
  });

  console.log('✅ CMS: 2 ContentTypes + 7 Entries (5 blog + 2 products)');

  // ═══════════════════════════════════════════════════════════
  // 10. FORMS + SUBMISSIONS (dados para gráficos)
  // ═══════════════════════════════════════════════════════════
  const contactForm = await prisma.form.create({
    data: {
      userId: client.id,
      title: 'Formulário de Contato',
      description: 'Formulário principal do site',
      schema: [
        { key: 'name', type: 'text', label: 'Nome Completo', required: true },
        { key: 'email', type: 'email', label: 'E-mail', required: true },
        { key: 'phone', type: 'tel', label: 'Telefone', required: false },
        { key: 'message', type: 'textarea', label: 'Mensagem', required: true },
      ],
      status: 'ACTIVE',
    },
  });

  const leadForm = await prisma.form.create({
    data: {
      userId: client.id,
      title: 'Captura de Leads',
      description: 'Formulário de captura para landing page',
      schema: [
        { key: 'name', type: 'text', label: 'Nome', required: true },
        { key: 'email', type: 'email', label: 'E-mail', required: true },
        { key: 'interest', type: 'select', label: 'Interesse', required: false, options: ['Notebook', 'Smartphone', 'Acessórios'] },
      ],
      status: 'ACTIVE',
      redirectUrl: 'https://techstore.com.br/obrigado',
    },
  });

  // Generate 60 days of submissions for charts
  const names = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Juliana Lima', 'Fernando Alves', 'Camila Rocha', 'Rafael Pereira', 'Bruna Martins', 'Thiago Gomes', 'Letícia Dias', 'Marcos Ribeiro', 'Patrícia Fernandes', 'Lucas Barbosa'];
  const interests = ['Notebook', 'Smartphone', 'Acessórios'];

  for (let day = 0; day < 60; day++) {
    const submissionsPerDay = randomBetween(1, 8);
    for (let i = 0; i < submissionsPerDay; i++) {
      const name = randomItem(names);
      const email = `${name.toLowerCase().replace(/ /g, '.')}${randomBetween(1, 999)}@email.com`;

      // Contact form submissions (weighted towards weekdays)
      if (day % 7 < 5 || Math.random() > 0.6) {
        await prisma.formSubmission.create({
          data: {
            formId: Math.random() > 0.4 ? leadForm.id : contactForm.id,
            data: { name, email, phone: `(11) 9${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}`, message: 'Gostaria de mais informações', interest: randomItem(interests) },
            ip: `189.${randomBetween(1, 254)}.${randomBetween(1, 254)}.${randomBetween(1, 254)}`,
            userAgent: 'Mozilla/5.0',
            referer: randomItem(['https://google.com', 'https://instagram.com', 'https://facebook.com', 'direct']),
            createdAt: daysAgo(day),
          },
        });
      }
    }
  }

  console.log('✅ 2 Forms + ~240 Submissions (60 dias de dados)');

  // ═══════════════════════════════════════════════════════════
  // 11. TRACKING DATASET + SOURCES + DESTINATIONS + EVENTS
  // ═══════════════════════════════════════════════════════════
  const dataset = await prisma.trackingDataset.create({
    data: {
      userId: client.id,
      name: 'Tracking Principal',
      description: 'Dataset principal de rastreamento de conversões',
    },
  });

  const srcStripe = await prisma.trackingSource.create({
    data: {
      datasetId: dataset.id,
      type: 'WEBHOOK',
      provider: 'STRIPE',
      name: 'Stripe Webhooks',
      enabled: true,
      status: 'ACTIVE',
      config: { webhookSecret: 'whsec_demo123' },
    },
  });

  await prisma.trackingSource.create({
    data: {
      datasetId: dataset.id,
      type: 'CRM',
      name: 'CRM Forms',
      enabled: true,
      status: 'ACTIVE',
    },
  });

  await prisma.trackingSource.create({
    data: {
      datasetId: dataset.id,
      type: 'PIXEL_SCRIPT',
      name: 'Pixel do Checkout',
      enabled: true,
      status: 'ACTIVE',
      config: { domain: 'checkout.techstore.com.br' },
    },
  });

  const destMeta = await prisma.trackingDestination.create({
    data: {
      datasetId: dataset.id,
      platform: 'META',
      enabled: true,
      config: { pixelId: '1234567890123456', apiToken: 'EAADemo...' },
    },
  });

  const destGoogle = await prisma.trackingDestination.create({
    data: {
      datasetId: dataset.id,
      platform: 'GOOGLE_ADS',
      enabled: true,
      config: { conversionId: 'AW-987654321', label: 'abcDEF' },
    },
  });

  const destTiktok = await prisma.trackingDestination.create({
    data: {
      datasetId: dataset.id,
      platform: 'TIKTOK',
      enabled: true,
      config: { pixelId: 'C00DEMO123', accessToken: 'tok_demo' },
    },
  });

  // Generate 90 days of tracking events for charts
  const eventNames = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead', 'CompleteRegistration'];
  const eventWeights = [40, 25, 15, 8, 5, 5, 2]; // % chance

  for (let day = 0; day < 90; day++) {
    const eventsPerDay = randomBetween(10, 50);
    for (let i = 0; i < eventsPerDay; i++) {
      // Weighted random event selection
      const rand = Math.random() * 100;
      let cumulative = 0;
      let eventName = 'PageView';
      for (let j = 0; j < eventNames.length; j++) {
        cumulative += eventWeights[j];
        if (rand < cumulative) {
          eventName = eventNames[j];
          break;
        }
      }

      const event = await prisma.trackingEvent.create({
        data: {
          datasetId: dataset.id,
          eventName,
          eventData: {
            value: eventName === 'Purchase' ? randomBetween(50, 5000) : undefined,
            currency: 'BRL',
            contentName: randomItem(products).name,
          },
          url: `https://techstore.com.br/${randomItem(['', 'produtos', 'checkout', 'carrinho'])}`,
          ip: `189.${randomBetween(1, 254)}.${randomBetween(1, 254)}.${randomBetween(1, 254)}`,
          status: 'PROCESSED',
          createdAt: daysAgo(day),
        },
      });

      // ~80% of events get deliveries
      if (Math.random() < 0.8) {
        const destinations = [destMeta, destGoogle, destTiktok];
        for (const dest of destinations) {
          if (Math.random() < 0.7) {
            await prisma.trackingEventDelivery.create({
              data: {
                eventId: event.id,
                destinationId: dest.id,
                datasetId: dataset.id,
                status: Math.random() < 0.92 ? 'SUCCESS' : 'FAILED',
                responseCode: Math.random() < 0.92 ? 200 : randomItem([500, 502, 429]),
                attemptCount: 1,
              },
            });
          }
        }
      }
    }
  }

  console.log('✅ Tracking: 1 Dataset + 3 Sources + 3 Destinations + ~2700 Events');

  // ═══════════════════════════════════════════════════════════
  // 12. CAMPAIGNS
  // ═══════════════════════════════════════════════════════════
  const campaignsData = [
    { name: 'Black Friday 2025', description: 'Campanha BF com foco em notebooks', status: 'ACTIVE', serviceId: svcMarketing.id },
    { name: 'Lançamento Linha Pro', description: 'Campanha de lançamento da nova linha Pro', status: 'ACTIVE', serviceId: svcMarketing.id },
    { name: 'Remarketing Carrinho', description: 'Retargeting de abandono de carrinho', status: 'ACTIVE', serviceId: svcMarketing.id },
    { name: 'Instagram Orgânico', description: 'Conteúdo orgânico no Instagram', status: 'ACTIVE', serviceId: svcMarketing.id },
    { name: 'Natal 2025', description: 'Promoção de natal', status: 'PAUSED', serviceId: svcMarketing.id },
  ];

  for (const c of campaignsData) {
    await prisma.campaign.create({
      data: { ...c, userId: client.id },
    });
  }

  console.log('✅ 5 Campanhas criadas');

  // ═══════════════════════════════════════════════════════════
  // 13. CRM: PIPELINE + STAGES + CONTACTS + DEALS
  // ═══════════════════════════════════════════════════════════
  const pipeline = await prisma.crmPipeline.create({
    data: {
      name: 'Vendas B2B',
      isDefault: true,
      userId: client.id,
    },
  });

  const stages = await Promise.all([
    prisma.crmStage.create({ data: { name: 'Novo Lead', color: '#6366f1', order: 0, pipelineId: pipeline.id } }),
    prisma.crmStage.create({ data: { name: 'Qualificação', color: '#f59e0b', order: 1, pipelineId: pipeline.id } }),
    prisma.crmStage.create({ data: { name: 'Proposta', color: '#3b82f6', order: 2, pipelineId: pipeline.id } }),
    prisma.crmStage.create({ data: { name: 'Negociação', color: '#8b5cf6', order: 3, pipelineId: pipeline.id } }),
    prisma.crmStage.create({ data: { name: 'Fechamento', color: '#10b981', order: 4, pipelineId: pipeline.id } }),
  ]);

  const contacts = await Promise.all([
    prisma.crmContact.create({ data: { userId: client.id, name: 'Roberto Mendes', email: 'roberto@empresa.com', phone: '(11) 98765-4321', company: 'Mendes Corp', jobTitle: 'CEO', type: 'LEAD', source: 'Google Ads', tags: ['b2b', 'enterprise'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Fernanda Vieira', email: 'fernanda@startup.io', phone: '(21) 99876-5432', company: 'StartupIO', jobTitle: 'CTO', type: 'LEAD', source: 'Instagram', tags: ['startup', 'tech'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Marcos Goulart', email: 'marcos@retail.com', phone: '(31) 97654-3210', company: 'Retail Plus', jobTitle: 'Diretor Compras', type: 'CUSTOMER', source: 'Indicação', tags: ['retail', 'recorrente'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Patrícia Lima', email: 'patricia@agencia.com', company: 'Agência Digital', jobTitle: 'Gerente de Projetos', type: 'LEAD', source: 'Site', tags: ['agência'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'André Santos', email: 'andre@tech.com', company: 'TechSolutions', type: 'LEAD', source: 'Facebook Ads', tags: ['saas'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Camila Rodrigues', email: 'camila@ecommerce.com', company: 'E-Commerce BR', jobTitle: 'CMO', type: 'LEAD', source: 'Google Ads', tags: ['ecommerce', 'enterprise'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Thiago Borges', email: 'thiago@logistica.com', company: 'LogExpress', type: 'LEAD', source: 'Evento', tags: ['logística'] } }),
    prisma.crmContact.create({ data: { userId: client.id, name: 'Isabella Nunes', email: 'isabella@school.edu', company: 'EduTech', jobTitle: 'Diretora', type: 'CUSTOMER', source: 'Indicação', tags: ['educação', 'recorrente'] } }),
  ]);

  const dealData = [
    { title: 'Plataforma E-commerce Mendes Corp', value: 45000, status: 'OPEN', stageIdx: 3, contactIdx: 0 },
    { title: 'SaaS Dashboard para StartupIO', value: 12000, status: 'OPEN', stageIdx: 2, contactIdx: 1 },
    { title: 'Renovação Contrato Retail Plus', value: 8500, status: 'WON', stageIdx: 4, contactIdx: 2 },
    { title: 'App Mobile Agência Digital', value: 22000, status: 'OPEN', stageIdx: 1, contactIdx: 3 },
    { title: 'Integração API TechSolutions', value: 6800, status: 'OPEN', stageIdx: 0, contactIdx: 4 },
    { title: 'Migração Plataforma E-Commerce BR', value: 75000, status: 'OPEN', stageIdx: 2, contactIdx: 5 },
    { title: 'Consultoria Digital LogExpress', value: 3500, status: 'LOST', stageIdx: 1, contactIdx: 6 },
    { title: 'Portal Educacional EduTech', value: 18000, status: 'WON', stageIdx: 4, contactIdx: 7 },
    { title: 'Automação Marketing Mendes Corp', value: 15000, status: 'OPEN', stageIdx: 1, contactIdx: 0 },
    { title: 'Landing Page StartupIO', value: 4200, status: 'WON', stageIdx: 4, contactIdx: 1 },
  ];

  for (const deal of dealData) {
    await prisma.crmDeal.create({
      data: {
        title: deal.title,
        value: deal.value,
        status: deal.status,
        stageId: stages[deal.stageIdx].id,
        contactId: contacts[deal.contactIdx].id,
        pipelineId: pipeline.id,
        userId: client.id,
      },
    });
  }

  console.log('✅ CRM: 1 Pipeline + 5 Stages + 8 Contacts + 10 Deals');

  // ═══════════════════════════════════════════════════════════
  // 14. INVOICES (6 meses de histórico para gráficos)
  // ═══════════════════════════════════════════════════════════
  const invoiceServices = [svcMarketing, svcWebDev];
  const invoiceAmounts: Record<string, number> = {};
  invoiceAmounts[svcMarketing.id] = 3500;
  invoiceAmounts[svcWebDev.id] = 2800;

  for (let month = 0; month < 6; month++) {
    for (const svc of invoiceServices) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() - month);
      dueDate.setDate(10); // Due on 10th each month

      const isPast = month > 0;
      const isPaid = isPast && Math.random() > 0.15;
      const isOverdue = isPast && !isPaid && month > 1;

      const paidDate = isPaid ? new Date(dueDate.getTime() + randomBetween(1, 5) * 86400000) : null;

      await prisma.invoice.create({
        data: {
          amount: invoiceAmounts[svc.id],
          status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING',
          dueDate,
          paidDate,
          serviceId: svc.id,
          userId: client.id,
        },
      });
    }
  }

  console.log('✅ ~12 Invoices (6 meses × 2 serviços)');

  // ═══════════════════════════════════════════════════════════
  // 15. TICKETS
  // ═══════════════════════════════════════════════════════════
  const ticketsData = [
    { subject: 'Formulário de contato sem enviar', message: 'O formulário do site parou de enviar emails ontem à noite. Já verificamos que o SMTP está funcionando.', status: 'OPEN', priority: 'HIGH' },
    { subject: 'Atualizar banner da home', message: 'Precisamos trocar o banner principal por um com a promoção de verão.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { subject: 'Relatório de Ads incorreto', message: 'Os números do relatório de fevereiro parecem divergir do Meta Business.', status: 'OPEN', priority: 'HIGH' },
    { subject: 'Novo design do checkout', message: 'Aprovamos o mockup. Podem iniciar a implementação.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { subject: 'Solicitar acesso ao Google Analytics', message: 'Precisamos dar acesso ao novo analista.', status: 'CLOSED', priority: 'LOW' },
    { subject: 'Erro 500 ao acessar /produtos', message: 'A página de produtos está retornando erro 500 intermitente desde hoje.', status: 'OPEN', priority: 'URGENT' },
    { subject: 'Dúvida sobre fatura de janeiro', message: 'O valor da fatura de janeiro está diferente do combinado.', status: 'CLOSED', priority: 'LOW' },
  ];

  for (const ticket of ticketsData) {
    await prisma.ticket.create({
      data: { ...ticket, status: ticket.status as any, priority: ticket.priority as any, userId: client.id },
    });
  }

  console.log('✅ 7 Tickets criados');

  // ═══════════════════════════════════════════════════════════
  // 16. TEAM + MEMBERS
  // ═══════════════════════════════════════════════════════════
  // Note: TeamMember has unique email, so we clean first (already done above)
  await prisma.teamMember.deleteMany({ where: { userId: client.id } });
  await prisma.team.deleteMany({ where: { userId: client.id } });

  const team = await prisma.team.create({
    data: {
      name: 'Equipe TechStore',
      description: 'Time principal da TechStore',
      userId: client.id,
    },
  });

  await Promise.all([
    prisma.teamMember.create({
      data: {
        name: 'João Marketing',
        email: 'joao@techstore.com.br',
        password: hash('member123'),
        role: 'ADMIN',
        userId: client.id,
        teams: { connect: { id: team.id } },
        allowedServices: { connect: [{ id: svcMarketing.id }] },
      },
    }),
    prisma.teamMember.create({
      data: {
        name: 'Maria Dev',
        email: 'maria@techstore.com.br',
        password: hash('member123'),
        role: 'MEMBER',
        userId: client.id,
        teams: { connect: { id: team.id } },
        allowedServices: { connect: [{ id: svcWebDev.id }] },
      },
    }),
    prisma.teamMember.create({
      data: {
        name: 'Pedro Financeiro',
        email: 'pedro@techstore.com.br',
        password: hash('member123'),
        role: 'MEMBER',
        userId: client.id,
        teams: { connect: { id: team.id } },
      },
    }),
  ]);

  console.log('✅ 1 Team + 3 Members');

  // ═══════════════════════════════════════════════════════════
  // 17. SYSTEM LOGS
  // ═══════════════════════════════════════════════════════════
  await prisma.system.createMany({
    data: [
      { adminId: master.id, action: 'CREATE_CLIENT', description: `Criou o cliente ${client.name}` },
      { adminId: master.id, action: 'CREATE_SERVICE', description: `Criou serviço Gestão de Tráfego para ${client.slug}` },
      { adminId: dev.id, action: 'CREATE_SERVICE', description: `Criou serviço Desenvolvimento Web para ${client.slug}` },
      { adminId: colab.id, action: 'UPDATE_SERVICE', description: 'Atualizou módulos do serviço Social Media' },
    ],
  });

  await prisma.userSystem.createMany({
    data: [
      { userId: client.id, action: 'LOGIN', description: 'Login via JWT' },
      { userId: client.id, action: 'CREATE_TICKET', description: 'Criou ticket: Formulário de contato sem enviar' },
      { userId: client.id, action: 'UPDATE_SETTINGS', description: 'Atualizou configurações de marketing' },
    ],
  });

  console.log('✅ System logs criados');

  // ═══════════════════════════════════════════════════════════
  console.log('\n🚀 Seed completa finalizada com sucesso!');
  console.log('─────────────────────────────────────────');
  console.log('Admin:   master@agency.com / admin123');
  console.log('Dev:     dev@agency.com / admin123');
  console.log('Colab:   ana@agency.com / admin123');
  console.log('Client:  contato@techstore.com.br / admin123');
  console.log('Slug:    demo-client');
  console.log('Members: joao/maria/pedro@techstore.com.br / member123');
  console.log('─────────────────────────────────────────');
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
