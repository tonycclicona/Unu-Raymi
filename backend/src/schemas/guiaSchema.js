import { z } from "zod";

export const crearGuiaSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(255, "El nombre no puede superar 255 caracteres."),
  rol: z
    .string({ required_error: "El rol/cargo es obligatorio." })
    .min(2)
    .max(255),
  experiencia: z
    .string({ required_error: "La experiencia es obligatoria." })
    .min(2)
    .max(255),
  idiomas: z
    .string({ required_error: "Los idiomas son obligatorios." })
    .min(2)
    .max(255),
  foto: z
    .string({ required_error: "La URL de la foto es obligatoria." })
    .min(2)
    .max(500),
  descripcion: z
    .string({ required_error: "La descripción es obligatoria." })
    .min(10, "La descripción debe tener al menos 10 caracteres."),
  activo: z.boolean().optional().default(true),
  orden: z.number().int().optional().default(0),
});

export const actualizarGuiaSchema = crearGuiaSchema.partial();
