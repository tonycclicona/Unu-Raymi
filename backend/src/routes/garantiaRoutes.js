import { Router } from "express";
import {
  obtenerGarantias,
  obtenerGarantiaPorId,
  crearGarantia,
  actualizarGarantia,
  eliminarGarantia,
} from "../controllers/garantiaController.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  crearGarantiaSchema,
  actualizarGarantiaSchema,
} from "../schemas/garantiaSchema.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Rutas públicas
router.get("/", obtenerGarantias);
router.get("/:id", obtenerGarantiaPorId);

// Rutas protegidas (solo administrador)
router.post("/", requireAuth, validateRequest(crearGarantiaSchema), crearGarantia);
router.put("/:id", requireAuth, validateRequest(actualizarGarantiaSchema), actualizarGarantia);
router.delete("/:id", requireAuth, eliminarGarantia);

export default router;
