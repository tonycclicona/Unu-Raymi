// ============================================================
// uploadController.js — Pipeline de Subida y Optimización de Imágenes
// Procesa imágenes usando Multer (en memoria) y Sharp (.webp + 80% de calidad).
// ============================================================

import multer from "multer";
import sharp from "sharp";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, "..", "..", "storage", "uploads");

// Configurar multer en memoria para obtener el buffer del archivo
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen."), false);
    }
  },
});

/**
 * Procesa la imagen del buffer, la convierte a .webp al 80% de calidad
 * y la guarda en la carpeta storage/uploads/
 */
export const subirImagen = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se ha subido ningún archivo o el formato no es válido.",
      });
    }

    // Asegurar que la carpeta de destino exista
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Generar un nombre único para la imagen
    const uniqueId = randomUUID();
    const originalNameClean = req.file.originalname
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const outputFilename = `${originalNameClean}-${uniqueId}.webp`;
    const outputPath = join(UPLOADS_DIR, outputFilename);

    // Procesar la imagen con sharp
    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Ruta de acceso estática que se retornará al frontend
    const fileUrl = `/uploads/${outputFilename}`;

    return res.status(200).json({
      success: true,
      message: "Imagen procesada y subida exitosamente.",
      data: {
        url: fileUrl,
        filename: outputFilename,
      },
    });
  } catch (error) {
    next(error);
  }
};
