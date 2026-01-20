import { Router } from 'express';
import { CredentialController } from '../controllers/CredentialController';
import { ensureClient } from '../middlewares/authMiddleware';

export const credentialRoutes = Router();
const credentialController = new CredentialController();

// Todas as rotas de gerenciamento de credenciais exigem autenticação de cliente (JWT)
// Não faz sentido criar uma API Key usando outra API Key (por segurança, apenas via painel/sessão user)
credentialRoutes.use(ensureClient);

credentialRoutes.post('/', credentialController.createCredential);
credentialRoutes.get('/', credentialController.listCredentials);
credentialRoutes.delete('/:id', credentialController.deleteCredential);
