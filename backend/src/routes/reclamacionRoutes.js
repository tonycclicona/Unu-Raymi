// ============================================================
// reclamacionRoutes.js — Rutas del Libro de Reclamaciones
// ============================================================

import { Router } from 'express';
import {
  crearReclamo,
  listarReclamos,
  obtenerReclamo,
  responderReclamo,
} from '../controllers/reclamacionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/reclamaciones — Crear reclamo (público)
router.post('/', crearReclamo);

// GET /api/reclamaciones — Listar reclamos (admin)
router.get('/', requireAuth, listarReclamos);

// GET /api/reclamaciones/:id — Detalle de un reclamo (admin)
router.get('/:id', requireAuth, obtenerReclamo);

// POST /api/reclamaciones/:id/responder — Responder reclamo (admin)
router.post('/:id/responder', requireAuth, responderReclamo);

export default router;
