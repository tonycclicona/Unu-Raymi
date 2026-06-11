// ============================================================
// uploadRoutes.js — Rutas para el servicio de subida de archivos
// Requiere autenticación de administrador (requireAuth).
// ============================================================

import { Router } from "express";
import { upload, subirImagen } from "../controllers/uploadController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Endpoint POST /api/upload
// Recibe un archivo en el campo "file"
router.post("/", requireAuth, upload.single("file"), subirImagen);

export default router;
