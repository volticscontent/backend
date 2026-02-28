import { Router } from 'express';
import { StripeService } from '../services/StripeService';
import { StripeController } from '../controllers/StripeController';

const router = Router();
const stripeService = new StripeService();
const stripeController = new StripeController(stripeService);

// Global callback route for Stripe Connect
// URL: /api/stripe/callback
router.get('/callback', stripeController.connectCallback);

export default router;
