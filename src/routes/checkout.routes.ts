import { Router } from 'express';
import { CheckoutSettingsController } from '../controllers/CheckoutSettingsController';
import { ensureClient } from '../middlewares/authMiddleware';

const router = Router();
const controller = new CheckoutSettingsController();

// Routes for checkout settings
// Mounted at /api
router.get('/services/:serviceId/checkout/settings', ensureClient, (req, res) => controller.getSettings(req, res));
router.put('/services/:serviceId/checkout/settings', ensureClient, (req, res) => controller.updateSettings(req, res));

export { router as checkoutRoutes };
