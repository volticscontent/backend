import { Router } from 'express';
import { StripeService } from '../services/StripeService';
import { StripeController } from '../controllers/StripeController';
import { ensureClient } from '../middlewares/authMiddleware';

const router = Router({ mergeParams: true });
const stripeService = new StripeService();
const stripeController = new StripeController(stripeService);

router.use(ensureClient);

router.post('/settings', stripeController.saveSettings);
router.get('/settings', stripeController.getSettings);
router.post('/sync-cms-product', stripeController.syncCmsProduct);
router.get('/products', stripeController.listProducts);
router.post('/products', stripeController.createProduct);
router.post('/checkout-session', stripeController.createCheckoutSession);
router.get('/preview-session', stripeController.createPreviewSession);

// Templates
router.get('/templates', stripeController.listTemplates);
router.post('/templates', stripeController.saveTemplate);
router.delete('/templates/:templateId', stripeController.deleteTemplate);

router.get('/connect', stripeController.getConnectUrl);
router.get('/callback', stripeController.connectCallback);
router.delete('/disconnect', stripeController.disconnect);

export default router;