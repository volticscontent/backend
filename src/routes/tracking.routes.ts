import { Router } from "express";
import { TrackingController } from "../controllers/TrackingController";
import { ensureClient } from "../middlewares/authMiddleware";

const router = Router();
const trackingController = new TrackingController();

// Public Collection Endpoint (No Auth Middleware)
router.post("/collect/:datasetId", (req, res) => trackingController.trackEvent(req, res));

// All other routes require client authentication
router.use(ensureClient);

// Datasets
router.get("/datasets", trackingController.getDatasets);
router.post("/datasets", trackingController.createDataset);
router.get("/datasets/:id", trackingController.getDataset);
router.put("/datasets/:id", trackingController.updateDataset);
router.delete("/datasets/:id", trackingController.deleteDataset);

router.get("/datasets/:datasetId/events", trackingController.getDatasetEvents);
router.get("/datasets/:datasetId/stats", trackingController.getDatasetStats);

// Destinations
router.post("/datasets/:datasetId/destinations", trackingController.addDestination);
router.put("/destinations/:id", trackingController.updateDestination);
router.delete("/destinations/:id", trackingController.deleteDestination);

// Sources
router.post("/datasets/:datasetId/sources", trackingController.addSource);
router.put("/sources/:id", trackingController.updateSource);
router.delete("/sources/:id", trackingController.deleteSource); // Re-adding deleteSource since it was replaced in controller but route still needed

export { router as trackingRoutes };
