// ============================================================
// rateLimiter.js — Limitador de Peticiones en Memoria (Zero-Deps)
// Protege endpoints críticos contra fuerza bruta y spam.
// ============================================================

/**
 * Crea un middleware de limitación de tasa por dirección IP.
 * @param {Object} options
 * @param {number} options.windowMs - Ventana de tiempo en milisegundos (ej: 15 * 60 * 1000)
 * @param {number} options.max - Número máximo de peticiones permitidas en la ventana
 * @param {string} [options.message] - Mensaje devuelto cuando se excede el límite
 * @returns {Function} Express middleware
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutos por defecto
  max = 100,
  message = "Demasiadas peticiones desde esta IP. Por favor intente más tarde."
} = {}) {
  // Mapa en memoria: ip -> { count: number, resetTime: number }
  const hits = new Map();

  // Limpieza periódica para evitar fugas de memoria
  const cleanupInterval = Math.max(windowMs, 60000);
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of hits.entries()) {
      if (now > data.resetTime) {
        hits.delete(ip);
      }
    }
  }, cleanupInterval);

  if (timer.unref) {
    timer.unref(); // No retener el proceso Node.js activo solo por el timer
  }

  return (req, res, next) => {
    // Determinar IP del cliente respetando trust proxy
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress) || "unknown";

    const now = Date.now();
    let clientData = hits.get(ip);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, clientData);
    } else {
      clientData.count += 1;
    }

    const remaining = Math.max(0, max - clientData.count);
    const retryAfterSeconds = Math.ceil((clientData.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(clientData.resetTime / 1000));

    if (clientData.count > max) {
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// ── Perfiles preconfigurados para la aplicación ──────────────

// 1. Autenticación (Login admin): 5 intentos por 15 minutos
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Demasiados intentos de inicio de sesión fallidos. Bloqueado temporalmente por 15 minutos."
});

// 2. Checkout / Reservas: 15 reservas por 15 minutos por IP
export const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Has realizado demasiadas solicitudes de reserva en poco tiempo. Por favor espera unos minutos."
});

// 3. Libro de Reclamaciones: 5 registros por 15 minutos por IP
export const reclamacionesLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Límite de envíos alcanzado para el Libro de Reclamaciones. Intenta más tarde."
});

// 4. Servicio de Traducción: 40 peticiones por minuto por IP
export const translationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: "Límite de solicitudes de traducción excedido. Por favor intenta en un minuto."
});
