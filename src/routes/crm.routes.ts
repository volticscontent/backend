import { Router } from 'express';
import { CrmController } from '../controllers/CrmController';
import { ensureClient } from '../middlewares/authMiddleware';

const router = Router();
const crmController = new CrmController();

// Todas as rotas de CRM requerem autenticação de cliente
router.use(ensureClient);

// Contacts
router.get('/contacts', crmController.getContacts);
router.post('/contacts', crmController.createContact);

// Deals
router.get('/deals', crmController.getDeals);

// Stats (para Dashboard)
router.get('/stats', crmController.getStats);

export default router;
