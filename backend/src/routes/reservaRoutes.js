// ============================================================
// reservaRoutes.js — Rutas para el recurso Reserva
// El endpoint de checkout pasa por validación Zod obligatoria.
// ============================================================

import { Router } from "express";
import { checkout, obtenerReserva, descargarInvoice, obtenerReservas } from "../controllers/reservaController.js";
import validateRequest from "../middlewares/validateRequest.js";
import { checkoutReservaSchema } from "../schemas/reservaSchema.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// ── GET /api/reservas ──────────────────────────────────────────
// Lista todas las reservas (sólo administrador autenticado)
router.get("/", requireAuth, obtenerReservas);

// ── POST /api/reservas/checkout ──────────────────────────────────
// Valida el payload con Zod → Procesa checkout → Crea reserva PENDING
router.post("/checkout", validateRequest(checkoutReservaSchema), checkout);

// ── GET /api/reservas/:id/invoice?token=xxx ───────────────────
// Descarga del PDF del invoice (protegida por tokenSeguridad, sin login)
// IMPORTANTE: esta ruta debe ir ANTES de GET /:id para no ser capturada por ella
router.get("/:id/invoice", descargarInvoice);

// ── GET /api/reservas/:id?token=xxx ───────────────────────────
// Consulta protegida por tokenSeguridad (sin login de usuario)
router.get("/:id", obtenerReserva);

export default router;
