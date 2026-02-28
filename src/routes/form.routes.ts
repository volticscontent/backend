import { Router } from 'express';
import { FormController } from '../controllers/FormController';
import { ensureClient } from '../middlewares/authMiddleware';

const router = Router();
const formController = new FormController();

// Public routes (for rendering and submission)
router.get('/:id/public', formController.showPublic); // Fetch form schema for rendering
router.post('/:id/submit', formController.submit); // Submit form data

// Dashboard routes (Protected)
router.use(ensureClient);
router.post('/', formController.create);
router.get('/', formController.index);
router.get('/:id', formController.show); // Dashboard view (could be same as public but maybe with stats)
router.get('/:id/submissions', formController.submissions);
router.put('/:id', formController.update);
router.delete('/:id', formController.delete);

export { router as formRoutes };
