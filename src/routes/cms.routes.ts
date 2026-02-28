import { Router } from 'express';
import { CmsController } from '../controllers/CmsController';
import { ensureClient } from '../middlewares/authMiddleware';

export const cmsRoutes = Router();
const cmsController = new CmsController();

// Log requests to CMS routes
cmsRoutes.use((req, res, next) => {
  console.log(`[CmsRoutes] ${req.method} ${req.url}`);
  next();
});

// Public / SDK Routes
cmsRoutes.get('/public/:clientSlug/:typeSlug', cmsController.getPublicContent);
cmsRoutes.get('/public/:clientSlug/:typeSlug/:entrySlug', cmsController.getPublicContent);

// Management Routes (Protected)
// All routes below this line require authentication
cmsRoutes.use(ensureClient);

// Content Types
cmsRoutes.post('/types', cmsController.createType);
cmsRoutes.get('/types', cmsController.listTypes);
cmsRoutes.get('/types/:id', cmsController.getType);
cmsRoutes.put('/types/:id', cmsController.updateType);
cmsRoutes.delete('/types/:id', cmsController.deleteType);

// Content Entries
cmsRoutes.post('/entries/:typeId', cmsController.createEntry);
cmsRoutes.post('/write/:typeSlug', cmsController.createEntryBySlug);
cmsRoutes.get('/entries/:typeId', cmsController.listEntries);
cmsRoutes.put('/entries/:entryId', cmsController.updateEntry);
cmsRoutes.delete('/entries/:entryId', cmsController.deleteEntry);
