import { Router } from 'express';
import {
  createAttractionAdmin,
  getAttractionsAdmin,
  deleteAttractionAdmin,
  getAttractionsPublic,
} from '../controllers/attractionsController.js';

const router = Router();

// Endpoints Admin (/api/admin/attractions)
router.post('/admin/attractions', createAttractionAdmin);
router.get('/admin/attractions', getAttractionsAdmin);
router.delete('/admin/attractions/:id', deleteAttractionAdmin);

// Endpoint Público v1 (/api/v1/attractions)
router.get('/v1/attractions', getAttractionsPublic);

export default router;
