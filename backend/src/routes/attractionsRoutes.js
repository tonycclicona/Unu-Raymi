import { Router } from 'express';
import {
  createAttractionAdmin,
  getAttractionsAdmin,
  getAttractionByIdAdmin,
  updateAttractionAdmin,
  deleteAttractionAdmin,
  getAttractionsPublic,
} from '../controllers/attractionsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoints Admin (/api/admin/attractions y /api/attractions) — Protegidos con JWT
router.post(['/admin/attractions', '/attractions'], requireAuth, createAttractionAdmin);
router.get(['/admin/attractions', '/attractions'], requireAuth, getAttractionsAdmin);
router.get(['/admin/attractions/:id', '/attractions/:id'], requireAuth, getAttractionByIdAdmin);
router.put(['/admin/attractions/:id', '/attractions/:id'], requireAuth, updateAttractionAdmin);
router.delete(['/admin/attractions/:id', '/attractions/:id'], requireAuth, deleteAttractionAdmin);

// Endpoint Público v1 (/api/v1/attractions y /api/attractions/public)
router.get(['/v1/attractions', '/attractions/public'], getAttractionsPublic);

export default router;
