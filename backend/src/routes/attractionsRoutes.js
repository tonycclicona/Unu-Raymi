import { Router } from 'express';
import {
  createAttractionAdmin,
  getAttractionsAdmin,
  getAttractionByIdAdmin,
  updateAttractionAdmin,
  deleteAttractionAdmin,
  getAttractionsPublic,
} from '../controllers/attractionsController.js';

const router = Router();

// Endpoints Admin (/api/admin/attractions y /api/attractions)
router.post(['/admin/attractions', '/attractions'], createAttractionAdmin);
router.get(['/admin/attractions', '/attractions'], getAttractionsAdmin);
router.get(['/admin/attractions/:id', '/attractions/:id'], getAttractionByIdAdmin);
router.put(['/admin/attractions/:id', '/attractions/:id'], updateAttractionAdmin);
router.delete(['/admin/attractions/:id', '/attractions/:id'], deleteAttractionAdmin);

// Endpoint Público v1 (/api/v1/attractions y /api/attractions/public)
router.get(['/v1/attractions', '/attractions/public'], getAttractionsPublic);

export default router;
