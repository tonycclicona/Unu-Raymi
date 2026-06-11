// ============================================================
// reservaSchema.js — Esquemas Zod para el modelo Reserva
// Valida el payload del endpoint POST /api/reservas/checkout
// ============================================================

import { z } from "zod";

// ── Schema de un Pasajero individual ────────────────────────
const pasajeroSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del pasajero es obligatorio." })
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(150),

  apellido: z
    .string({ required_error: "El apellido del pasajero es obligatorio." })
    .min(2, "El apellido debe tener al menos 2 caracteres.")
    .max(150),

  dni: z
    .string()
    .max(20)
    .nullable()
    .optional(),

  tipo: z.enum(["adulto", "nino"], {
    errorMap: () => ({ message: "El tipo de pasajero debe ser 'adulto' o 'nino'." }),
  }),
});

// ── Schema principal del Checkout ───────────────────────────
export const checkoutReservaSchema = z
  .object({
    tourId: z
      .number({ required_error: "El ID del tour es obligatorio." })
      .int()
      .positive("El ID del tour debe ser un número entero positivo."),

    fechaViaje: z
      .string({ required_error: "La fecha del viaje es obligatoria." })
      .refine(
        (val) => !isNaN(Date.parse(val)),
        { message: "La fecha del viaje no tiene un formato válido (ISO 8601)." }
      )
      .refine(
        (val) => new Date(val) > new Date(),
        { message: "La fecha del viaje debe ser una fecha futura." }
      ),

    cantAdultos: z
      .number({ required_error: "La cantidad de adultos es obligatoria." })
      .int()
      .min(1, "Debe haber al menos 1 adulto en la reserva."),

    cantNinos: z
      .number({ required_error: "La cantidad de niños es obligatoria." })
      .int()
      .min(0, "La cantidad de niños no puede ser negativa."),

    duracion_dias: z
      .number()
      .int()
      .min(1)
      .optional(),

    // ── Datos del Titular (OBLIGATORIOS) ──
    titularNombre: z
      .string({ required_error: "El nombre del titular es obligatorio." })
      .min(2, "El nombre del titular debe tener al menos 2 caracteres.")
      .max(255),

    titularEmail: z
      .string({ required_error: "El correo del titular es obligatorio." })
      .email("El correo electrónico del titular no es válido."),

    titularTelefono: z
      .string()
      .max(50)
      .optional(),

    // ── Lista de pasajeros ──
    pasajeros: z
      .array(pasajeroSchema)
      .min(1, "Debe incluir al menos 1 pasajero en la reserva."),
  })
  // Regla de negocio: cantidad de pasajeros === cantAdultos + cantNinos
  .refine(
    (data) => data.pasajeros.length === data.cantAdultos + data.cantNinos,
    {
      message:
        "La cantidad total de pasajeros no coincide con la suma de adultos y niños declarados.",
      path: ["pasajeros"],
    }
  )
  // Regla de negocio: pasajeros de tipo 'adulto' === cantAdultos
  .refine(
    (data) =>
      data.pasajeros.filter((p) => p.tipo === "adulto").length === data.cantAdultos,
    {
      message:
        "La cantidad de pasajeros de tipo 'adulto' no coincide con 'cantAdultos'.",
      path: ["pasajeros"],
    }
  )
  // Regla de negocio: pasajeros de tipo 'nino' === cantNinos
  .refine(
    (data) =>
      data.pasajeros.filter((p) => p.tipo === "nino").length === data.cantNinos,
    {
      message:
        "La cantidad de pasajeros de tipo 'nino' no coincide con 'cantNinos'.",
      path: ["pasajeros"],
    }
  );
