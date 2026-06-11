// ============================================================
// webhookRoutes.js — Ruta del Webhook de Stripe
//
// IMPORTANTE: Esta ruta usa rawBodyParser (express.raw) en lugar
// del express.json() global. El body llega como Buffer para
// permitir la verificación de la firma HMAC-SHA256 de Stripe.
// ============================================================

import { Router } from "express";
import rawBodyParser from "../middlewares/rawBodyParser.js";
import { procesarWebhookStripe } from "../controllers/webhookController.js";

const router = Router();

// POST /api/webhooks/pago
// rawBodyParser preserva el body crudo como Buffer (obligatorio para Stripe)
router.post("/pago", rawBodyParser, procesarWebhookStripe);

export default router;
