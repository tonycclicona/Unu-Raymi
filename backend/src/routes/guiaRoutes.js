import { Router } from "express";
import {
  obtenerGuias,
  obtenerGuiaPorId,
  crearGuia,
  actualizarGuia,
  eliminarGuia,
} from "../controllers/guiaController.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  crearGuiaSchema,
  actualizarGuiaSchema,
} from "../schemas/guiaSchema.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Rutas públicas
router.get("/", obtenerGuias);
router.get("/:id", obtenerGuiaPorId);

// Rutas protegidas (solo administrador)
router.post("/", requireAuth, validateRequest(crearGuiaSchema), crearGuia);
router.put("/:id", requireAuth, validateRequest(actualizarGuiaSchema), actualizarGuia);
router.delete("/:id", requireAuth, eliminarGuia);

export default router;
