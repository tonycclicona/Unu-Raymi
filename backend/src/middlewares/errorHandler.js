// ============================================================
// errorHandler.js — Middleware Global de Manejo de Errores
// Captura todos los errores no manejados y responde con un
// formato JSON estandarizado: { success: false, error: "..." }
// ============================================================

/**
 * Middleware de error global de Express.
 * DEBE ser el último middleware registrado en server.js (4 parámetros).
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log detallado en servidor para monitoreo interno
  console.error(`[ErrorHandler] ${req.method} ${req.path} → ${statusCode}:`, err.message);

  // En producción, sanitizar errores 500 para no filtrar detalles internos de BD o rutas
  const safeMessage = (isProduction && statusCode === 500)
    ? "Error interno del servidor. Por favor, inténtalo más tarde."
    : (err.message || "Error interno del servidor. Por favor, inténtalo más tarde.");

  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
  });
};

export default errorHandler;
