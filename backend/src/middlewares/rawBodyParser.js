// ============================================================
// rawBodyParser.js — Middleware de Body Crudo para Webhooks
//
// CRÍTICO: Stripe firma el body en bytes RAW. Si Express parsea
// el JSON antes, la firma HMAC-SHA256 no coincidirá y todos
// los webhooks serán rechazados con 400.
//
// Uso en server.js:
//   app.use('/api/webhooks', rawBodyParser, webhookRoutes)
//   app.use(express.json())  ← DESPUÉS de montar el webhook
// ============================================================

import express from "express";

/**
 * Middleware que lee el body de la petición como un Buffer crudo
 * y lo guarda en req.rawBody para la verificación de firma de Stripe.
 */
const rawBodyParser = express.raw({ type: "application/json" });

export default rawBodyParser;
