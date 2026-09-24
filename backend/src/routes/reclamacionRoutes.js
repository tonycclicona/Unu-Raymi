// ============================================================
// reclamacionRoutes.js — Rutas del Libro de Reclamaciones
// ============================================================

import { Router } from "express";
import {
  crearReclamo,
  listarReclamos,
  obtenerReclamo,
  responderReclamo,
} from "../controllers/reclamacionController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { reclamacionesLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// POST /api/reclamaciones - Crear reclamo (publico con rate limiting)
router.post("/", reclamacionesLimiter, crearReclamo);

// GET /api/reclamaciones - Listar reclamos (admin)
router.get("/", requireAuth, listarReclamos);

// GET /api/reclamaciones/:id - Detalle de un reclamo (admin)
router.get("/:id", requireAuth, obtenerReclamo);

// POST /api/reclamaciones/:id/responder - Responder reclamo (admin)
router.post("/:id/responder", requireAuth, responderReclamo);

export default router;