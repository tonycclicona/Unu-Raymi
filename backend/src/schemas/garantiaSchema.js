import { z } from "zod";

export const crearGarantiaSchema = z.object({
  titulo: z
    .string({ required_error: "El título es obligatorio." })
    .min(2, "El título debe tener al menos 2 caracteres.")
    .max(255, "El título no puede superar 255 caracteres."),
  descripcion: z
    .string({ required_error: "La descripción es obligatoria." })
    .min(10, "La descripción debe tener al menos 10 caracteres."),
  icono: z
    .string({ required_error: "El icono es obligatorio." })
    .min(2)
    .max(100),
  color: z
    .string({ required_error: "El color es obligatorio." })
    .min(2)
    .max(100),
  imagenUrl: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional().default(true),
  orden: z.number().int().optional().default(0),
});

export const actualizarGarantiaSchema = crearGarantiaSchema.partial();
