// ============================================================
// tourSchema.js — Esquemas Zod para el modelo Tour
// Valida los payloads de creación y actualización de tours.
// Los campos de precio/duración/cupos ahora viven en variantes.
// ============================================================

import { z } from "zod";

// ── Schema de una variante completa ──────────────────────────
const varianteSchema = z.object({
  duracion_dias: z
    .number({ required_error: "La duración en días es obligatoria." })
    .int("La duración debe ser un número entero.")
    .min(1, "La duración mínima es 1 día."),

  precio_adulto: z
    .number({ required_error: "El precio adulto es obligatorio." })
    .min(0, "El precio adulto no puede ser negativo."),

  precio_nino: z
    .number({ required_error: "El precio niño es obligatorio." })
    .min(0, "El precio niño no puede ser negativo."),

  cupos_disponibles: z
    .number({ required_error: "Los cupos disponibles son obligatorios." })
    .int()
    .min(1, "Debe haber al menos 1 cupo disponible."),

  itinerario: z.string().optional().nullable(),

  // servicios_incluidos puede ser un objeto categorizado { guia: [], ... }
  // o un array simple — aceptamos cualquier forma con z.any()
  servicios_incluidos: z.any().optional().nullable(),

  servicios_excluidos: z.array(z.string()).optional().nullable().default([]),

  fechas_disponibles: z.array(z.string()).optional().nullable().default([]),
});

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
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minúsculas, números y guiones."
    ),

  descripcion: z
    .string({ required_error: "La descripción es obligatoria." })
    .min(10, "La descripción debe tener al menos 10 caracteres."),

  // Itinerario global del tour (opcional — puede vivir en cada variante)
  itinerario: z.string().optional().nullable(),

  // Precio/duración/cupos a nivel tour (ahora opcionales — viven en variantes)
  precio_adulto: z.number().min(0).optional().nullable(),
  precio_nino: z.number().min(0).optional().nullable(),
  duracion_dias: z.number().int().min(1).optional().nullable(),
  cupos_disponibles: z.number().int().min(1).optional().nullable(),

  // Servicios a nivel tour (opcionales — ahora viven en cada variante)
  servicios_incluidos: z.any().optional().nullable(),
  servicios_excluidos: z.array(z.string()).optional().nullable().default([]),
  que_llevar: z.array(z.string()).optional().nullable().default([]),
  fechas_disponibles: z.array(z.string()).optional().nullable().default([]),

  // Imágenes de la galería
  imagenes: z
    .array(
      z.object({
        url: z.string().min(1, "La URL de la imagen no puede estar vacía."),
        altText: z.string().optional().nullable(),
        orden: z.number().int().min(0).default(0),
      })
    )
    .optional()
    .default([]),

  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),

  pais: z
    .string({ required_error: "El país es obligatorio." })
    .min(2)
    .max(50)
    .default("Perú"),

  categoria: z
    .string({ required_error: "La categoría es obligatoria." })
    .min(2)
    .max(50)
    .default("Trekking"),

  ciudad: z
    .string({ required_error: "La ciudad es obligatoria." })
    .min(2)
    .max(50)
    .default("Cusco"),

  // Variantes — al menos 1 requerida (validado en el controller)
  variantes: z.array(varianteSchema).optional().default([]),
});

// ── Schema para actualización parcial ───────────────────────
export const actualizarTourSchema = crearTourSchema.partial();
