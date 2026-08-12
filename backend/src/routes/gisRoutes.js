import { Router } from 'express';
import {
  getGisSchemaData,
  getAttractionBySlug,
  searchGisDestinations,
} from '../controllers/gisController.js';

const router = Router();

// Rutas Públicas para MapaSudamerica
router.get('/schema-data', getGisSchemaData);
router.get('/attraction/:slug', getAttractionBySlug);
router.get('/search', searchGisDestinations);

export default router;
