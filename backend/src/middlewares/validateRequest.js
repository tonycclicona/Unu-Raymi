// ============================================================
// validateRequest.js — Middleware de Validación con Zod
// Toda petición POST/PUT de la API debe pasar por este
// middleware antes de llegar a los controladores.
// Uso: router.post('/ruta', validateRequest(miSchema), controller)
// ============================================================

/**
 * Genera un middleware de Express que valida el body
 * de la petición contra el schema Zod proporcionado.
 *
 * @param {import('zod').ZodSchema} schema - Schema Zod a validar.
 * @returns {import('express').RequestHandler}
 */
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join(".")} — ${e.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      error: `Datos de entrada inválidos: ${errorMessages}`,
    });
  }

  // Reemplazar req.body con los datos parseados y saneados por Zod
  req.body = result.data;
  next();
};

export default validateRequest;
