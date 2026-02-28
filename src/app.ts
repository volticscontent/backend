import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import masterRoutes from './routes/master.routes';
import clientRoutes from './routes/client.routes';
import authRoutes from './routes/auth.routes';
import { marketingRoutes } from './routes/marketing.routes';
import { trackingRoutes } from './routes/tracking.routes';
import { cmsRoutes } from './routes/cms.routes';
import { credentialRoutes } from './routes/credential.routes';
import { seoRoutes } from './routes/seo.routes';
import { campaignRoutes } from './routes/campaign.routes';
import { checkoutRoutes } from './routes/checkout.routes';
import { formRoutes } from './routes/form.routes';
import stripeRoutes from './routes/stripe.routes';
import stripeGlobalRoutes from './routes/stripe-global.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://frontend-six-mu-79.vercel.app',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-slug']
}));
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  console.log(`[Params]`, req.params);
  console.log(`[Query]`, req.query);
  next();
});

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 1. Prioridade: Rotas Master (/api/master)
app.use('/api/master', masterRoutes);

// 2. Rotas Globais/Específicas (Não usam slug no path)
app.use('/api/auth', authRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/stripe', stripeGlobalRoutes);
app.use('/api', campaignRoutes);
app.use('/api', checkoutRoutes);

// 3. Fallback: Rotas de Cliente (/api/:clientSlug)
// Onde :clientSlug será o identificador do usuário/cliente
app.use('/api/:clientSlug', clientRoutes);

export default app;
