import { Router } from 'express';
import { DataSourceController } from '../controllers/DataSourceController';

const router = Router({ mergeParams: true });
const controller = new DataSourceController();

// Routes prefixed with /api/:clientSlug/datasources

router.get('/', controller.getDataSources);
router.post('/', controller.createDataSource);
router.put('/:id', controller.updateDataSource);
router.delete('/:id', controller.deleteDataSource);
router.post('/:id/sync', controller.syncDataSource);
router.get('/:id/data', controller.getData);

export default router;
