// ============================================================
// uploadController.js — Pipeline de Subida y Optimización de Imágenes
// Procesa imágenes usando Multer (en memoria) y Sharp (.webp + 82% de calidad).
// Persiste en storage/uploads y public_html/uploads para entrega inmediata vía LiteSpeed.
// ============================================================

import multer from "multer";
import sharp from "sharp";
import { promises as fs } from "fs";
import fsSync from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// URL pública del API para construir URLs absolutas de uploads
const API_PUBLIC_URL = process.env.API_BASE_URL || 'https://api.unu-raymi.com';

// Obtiene el directorio canónico único para guardar y servir uploads
export function getCentralizedUploadDir() {
  if (process.env.UPLOADS_PATH) {
    return resolve(process.env.UPLOADS_PATH);
  }
  // En producción Hostinger Linux
  const hostingerPublicUploads = "/home/u209525223/domains/unu-raymi.com/public_html/uploads";
  if (process.platform !== 'win32' && fsSync.existsSync("/home/u209525223/domains/unu-raymi.com/public_html")) {
    return hostingerPublicUploads;
  }
  // En desarrollo local
  return resolve(process.cwd(), "public_html/uploads");
}

// Configurar multer en memoria para obtener el buffer del archivo
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // Límite de 8MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir imágenes y archivos PDF
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen o PDFs."), false);
    }
  },
});

/**
 * Procesa la imagen del buffer (la convierte a .webp al 82% de calidad)
 * y la guarda en el directorio centralizado de uploads.
 * Responde con la ruta relativa Y la URL absoluta canónica del archivo subido.
 */
export const subirImagen = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se ha subido ningún archivo o el formato no es válido.",
      });
    }

    const uploadDir = getCentralizedUploadDir();

    // Generar un nombre único para el archivo
    const uniqueId = randomUUID();
    const originalNameClean = req.file.originalname
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .substring(0, 40); // Limitar longitud del nombre

    let outputFilename;
    let fileBuffer;

    if (req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf")) {
      // Validación estricta de Magic Bytes (%PDF- / 0x25 0x50 0x44 0x46 0x2D)
      const isRealPdf = req.file.buffer.length >= 5 && req.file.buffer.subarray(0, 5).toString("ascii") === "%PDF-";
      if (!isRealPdf) {
        return res.status(400).json({
          success: false,
          error: "El archivo subido no es un documento PDF válido.",
        });
      }
      outputFilename = `${originalNameClean}-${uniqueId}.pdf`;
      fileBuffer = req.file.buffer;
    } else {
      try {
        fileBuffer = await sharp(req.file.buffer)
          .webp({ quality: 82 })
          .toBuffer();
        outputFilename = `${originalNameClean}-${uniqueId}.webp`;
      } catch (imgErr) {
        return res.status(400).json({
          success: false,
          error: "El archivo no es una imagen válida o está corrupto.",
        });
      }
    }

    // Escribir el buffer procesado directamente en el directorio centralizado
    await fs.mkdir(uploadDir, { recursive: true });
    const dest = join(uploadDir, outputFilename);
    await fs.writeFile(dest, fileBuffer);

    console.log(`[upload] ✅ Guardado exitosamente en: ${dest}`);

    // Ruta relativa (compatibilidad frontend) y URL absoluta (admin)
    const relativePath = `/uploads/${outputFilename}`;
    const absoluteUrl = `${API_PUBLIC_URL}${relativePath}`;

    return res.status(200).json({
      success: true,
      message: "Archivo procesado y subido exitosamente.",
      data: {
        url: relativePath,
        absoluteUrl: absoluteUrl,
        filename: outputFilename,
        size: fileBuffer.length,
        mimetype: req.file.mimetype === "application/pdf" ? "application/pdf" : "image/webp",
      },
    });
  } catch (error) {
    next(error);
  }
};
