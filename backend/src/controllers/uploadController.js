// ============================================================
// uploadController.js — Pipeline de Subida y Optimización de Imágenes
// Procesa imágenes usando Multer (en memoria) y Sharp (.webp + 80% de calidad).
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

const CANONICAL_HOSTINGER_API_UPLOADS = "/home/u209525223/domains/unu-raymi.com/public_html/api/uploads";
const CANONICAL_HOSTINGER_PUB_UPLOADS = "/home/u209525223/domains/unu-raymi.com/public_html/uploads";

// Obtiene todos los directorios canónicos donde debe guardarse el archivo
function getUploadDirectories() {
  const dirs = new Set();

  // 1. Destino Maestro Canónico de Hostinger (api/uploads)
  if (fsSync.existsSync("/home/u209525223/domains/unu-raymi.com/public_html/api")) {
    dirs.add(CANONICAL_HOSTINGER_API_UPLOADS);
  }

  // 2. Destino de acceso directo para frontend (public_html/uploads)
  if (fsSync.existsSync("/home/u209525223/domains/unu-raymi.com/public_html")) {
    dirs.add(CANONICAL_HOSTINGER_PUB_UPLOADS);
  }

  // 3. Variable de entorno personalizada si existe
  if (process.env.UPLOADS_PATH) {
    dirs.add(resolve(process.env.UPLOADS_PATH));
  }

  // 4. Fallback local / entorno de desarrollo
  dirs.add(resolve(__dirname, "../../storage/uploads"));
  dirs.add(resolve(__dirname, "../../../storage/uploads"));

  return Array.from(dirs);
}

// Configurar multer en memoria para obtener el buffer del archivo
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
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
 * Procesa la imagen del buffer (la convierte a .webp al 80% de calidad)
 * y la guarda en todos los directorios de persistencia (storage y public_html)
 */
export const subirImagen = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se ha subido ningún archivo o el formato no es válido.",
      });
    }

    const uploadDirs = getUploadDirectories();

    // Generar un nombre único para el archivo
    const uniqueId = randomUUID();
    const originalNameClean = req.file.originalname
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");

    let outputFilename;
    let fileBuffer;

    if (req.file.mimetype === "application/pdf") {
      outputFilename = `${originalNameClean}-${uniqueId}.pdf`;
      fileBuffer = req.file.buffer;
    } else {
      outputFilename = `${originalNameClean}-${uniqueId}.webp`;
      fileBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();
    }

    // Escribir el buffer procesado en todos los directorios de almacenamiento
    await Promise.all(
      uploadDirs.map(async (dir) => {
        try {
          await fs.mkdir(dir, { recursive: true });
          const dest = join(dir, outputFilename);
          await fs.writeFile(dest, fileBuffer);
        } catch (err) {
          console.warn(`[upload] Advertencia guardando en ${dir}:`, err.message);
        }
      })
    );

    // Ruta de acceso estática que se retornará al frontend
    const fileUrl = `/uploads/${outputFilename}`;

    return res.status(200).json({
      success: true,
      message: "Archivo procesado y subido exitosamente.",
      data: {
        url: fileUrl,
        filename: outputFilename,
      },
    });
  } catch (error) {
    next(error);
  }
};
