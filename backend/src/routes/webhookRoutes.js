// ============================================================
// webhookRoutes.js — Ruta del Webhook de Stripe
//
// IMPORTANTE: Esta ruta usa rawBodyParser (express.raw) en lugar
// del express.json() global. El body llega como Buffer para
// permitir la verificación de la firma HMAC-SHA256 de Stripe.
// ============================================================

import express, { Router } from "express";
import rawBodyParser from "../middlewares/rawBodyParser.js";
import { procesarWebhookStripe } from "../controllers/webhookController.js";
import { procesarWebhookOpenpay } from "../controllers/openpayWebhookController.js";

const router = Router();

// POST /api/webhooks/pago
// rawBodyParser preserva el body crudo como Buffer (obligatorio para Stripe)
router.post("/pago", rawBodyParser, procesarWebhookStripe);

// POST /api/webhooks/openpay
// express.json() parsea el payload JSON enviado por OpenPay Perú
router.post("/openpay", express.json(), procesarWebhookOpenpay);

export default router;

