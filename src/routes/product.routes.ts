import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { ensureClient } from '../middlewares/authMiddleware';

const router = Router();
const controller = new ProductController();

router.use(ensureClient);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
