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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/seo', seoRoutes);

// 1. Prioridade: Rotas Master (/api/master)
app.use('/api/master', masterRoutes);

// 2. Fallback: Rotas de Cliente (/api/:clientSlug)
// Onde :clientSlug será o identificador do usuário/cliente
app.use('/api/:clientSlug', clientRoutes);

export default app;
