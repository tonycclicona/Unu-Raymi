// ============================================================
// tourSchema.js — Esquemas Zod para el modelo Tour
// Valida los payloads de creación y actualización de tours.
// ============================================================

import { z } from "zod";

// ── Schema base del Tour ─────────────────────────────────────
export const crearTourSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del tour es obligatorio." })
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(255, "El nombre no puede superar 255 caracteres."),

  slug: z
    .string({ required_error: "El slug es obligatorio." })
    .min(3)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede contener letras minúsculas, números y guiones."),

  descripcion: z
    .string({ required_error: "La descripción es obligatoria." })
    .min(20, "La descripción debe tener al menos 20 caracteres."),

  itinerario: z.string().optional(),

  precio_adulto: z
    .number({ required_error: "El precio adulto es obligatorio." })
    .positive("El precio adulto debe ser un valor positivo."),

  precio_nino: z
    .number({ required_error: "El precio niño es obligatorio." })
    .min(0, "El precio niño no puede ser negativo."),

  duracion_dias: z
    .number({ required_error: "La duración es obligatoria." })
    .int("La duración debe ser un número entero.")
    .min(1, "La duración mínima es 1 día."),

  cupos_disponibles: z
    .number({ required_error: "Los cupos disponibles son obligatorios." })
    .int()
    .min(1, "Debe haber al menos 1 cupo disponible."),

  // Arrays de servicios categorizados
  servicios_incluidos: z
    .array(z.string().min(1))
    .min(1, "Debe incluir al menos un servicio en la categoría 'Incluidos'."),

  servicios_excluidos: z
    .array(z.string().min(1))
    .default([]),

  que_llevar: z
    .array(z.string().min(1))
    .default([]),

  imagenes: z
    .array(
      z.object({
        url: z.string().url("La URL de la imagen no es válida."),
        altText: z.string().optional(),
        orden: z.number().int().min(0).default(0),
      })
    )
    .optional()
    .default([]),

  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  pais: z
    .string({ required_error: "El país es obligatorio." })
    .min(2, "El país debe tener al menos 2 caracteres.")
    .max(50, "El país no puede superar los 50 caracteres.")
    .default("Perú"),
  categoria: z
    .string({ required_error: "La categoría es obligatoria." })
    .min(2, "La categoría debe tener al menos 2 caracteres.")
    .max(50, "La categoría no puede superar los 50 caracteres.")
    .default("Trekking"),
  ciudad: z
    .string({ required_error: "La ciudad es obligatoria." })
    .min(2, "La ciudad debe tener al menos 2 caracteres.")
    .max(50, "La ciudad no puede superar los 50 caracteres.")
    .default("Cusco"),
  fechas_disponibles: z
    .array(z.string())
    .default([]),
  variantes: z
    .array(
      z.object({
        duracion_dias: z.number({ required_error: "La duración en días es obligatoria." }).int().min(1),
        precio_adulto: z.number({ required_error: "El precio adulto es obligatorio." }).positive(),
        precio_nino: z.number({ required_error: "El precio niño es obligatorio." }).min(0),
        cupos_disponibles: z.number({ required_error: "Los cupos disponibles son obligatorios." }).int().min(1),
        itinerario: z.string().optional().nullable(),
        servicios_incluidos: z.any().optional().nullable(),
        servicios_excluidos: z.array(z.string()).optional().nullable(),
        fechas_disponibles: z.array(z.string()).optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

// ── Schema para actualización parcial ───────────────────────
export const actualizarTourSchema = crearTourSchema.partial();
