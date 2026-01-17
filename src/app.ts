import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import masterRoutes from './routes/master.routes';
import clientRoutes from './routes/client.routes';
import authRoutes from './routes/auth.routes';

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
// 1. Prioridade: Rotas Master (/api/master)
app.use('/api/master', masterRoutes);

// 2. Fallback: Rotas de Cliente (/api/:clientSlug)
// Onde :clientSlug será o identificador do usuário/cliente
app.use('/api/:clientSlug', clientRoutes);

export default app;
