// ============================================================
// tourRoutes.js — Rutas CRUD para el recurso Tour
// Todas las rutas POST y PUT pasan por validación Zod.
// ============================================================

import { Router } from "express";
import {
  obtenerTours,
  obtenerTourPorId,
  obtenerTourPorSlug,
  crearTour,
  actualizarTour,
  eliminarTour,
} from "../controllers/tourController.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  crearTourSchema,
  actualizarTourSchema,
} from "../schemas/tourSchema.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Rutas públicas (consulta)
router.get("/", obtenerTours);
router.get("/slug/:slug", obtenerTourPorSlug);
router.get("/:id", obtenerTourPorId);

// Rutas protegidas (solo administrador)
router.post("/", requireAuth, validateRequest(crearTourSchema), crearTour);
router.put("/:id", requireAuth, validateRequest(actualizarTourSchema), actualizarTour);
router.delete("/:id", requireAuth, eliminarTour);

export default router;
