// ============================================================
// uploadRoutes.js — Rutas para el servicio de subida de archivos
// Requiere autenticación de administrador (requireAuth).
// ============================================================

import { Router } from "express";
import { upload, subirImagen } from "../controllers/uploadController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Endpoint POST /api/upload
// Soporta el campo "file" o "imagen" para mayor flexibilidad y compatibilidad
const uploadSingleFile = (req, res, next) => {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "imagen", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    // Normalizar req.file para que el controlador lo reciba de forma transparente
    if (req.files) {
      req.file = req.files.file?.[0] || req.files.imagen?.[0] || req.files.image?.[0];
    }
    next();
  });
};

router.post("/", requireAuth, uploadSingleFile, subirImagen);

export default router;
