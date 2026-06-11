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

  // Log del error en consola (evitar en producción usar console.error puro)
  console.error(`[ErrorHandler] ${req.method} ${req.path} → ${statusCode}:`, err.message);

  return res.status(statusCode).json({
    success: false,
    error: err.message || "Error interno del servidor. Por favor, inténtalo más tarde.",
  });
};

export default errorHandler;
