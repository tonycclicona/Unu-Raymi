// ============================================================
// webhookRoutes.js — Rutas para Webhooks de Pasarelas (Stripe & OpenPay)
// ============================================================

import { Router } from "express";
import rawBodyParser from "../middlewares/rawBodyParser.js";
import {
  procesarWebhookStripe,
  procesarWebhookOpenpay,
  verificarEstadoOpenpay,
} from "../controllers/webhookController.js";
import express from "express";

const router = Router();

// POST /api/webhooks/pago
// rawBodyParser preserva el body crudo como Buffer (obligatorio para Stripe)
router.post("/pago", rawBodyParser, procesarWebhookStripe);

// Webhook de OpenPay Perú
// GET: Diagnóstico y consulta del último código de verificación
// POST: Recepción de eventos (verificación y confirmación de pago)
router.get("/openpay", verificarEstadoOpenpay);
router.post("/openpay", express.json(), procesarWebhookOpenpay);

export default router;

