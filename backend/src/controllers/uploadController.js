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

// Obtiene todos los directorios canónicos donde debe guardarse el archivo.
// ORDEN IMPORTANTE: el primero con UPLOADS_PATH tiene prioridad para servir assets.
function getUploadDirectories() {
  const dirs = [];

  // 1. Variable de entorno personalizada (máxima prioridad en Hostinger)
  if (process.env.UPLOADS_PATH) {
    const customPath = resolve(process.env.UPLOADS_PATH);
    if (!dirs.includes(customPath)) dirs.push(customPath);
  }

  // 2. Carpeta de uploads del dominio api.unu-raymi.com en Hostinger
  const hostingerApiStorage = "/home/u209525223/domains/api.unu-raymi.com/storage/uploads";
  if (fsSync.existsSync("/home/u209525223/domains/api.unu-raymi.com")) {
    if (!dirs.includes(hostingerApiStorage)) dirs.push(hostingerApiStorage);
  }

  // 3. Carpeta canónica de Hostinger public_html (unu-raymi.com)
  const hostingerPublicUploads = "/home/u209525223/domains/unu-raymi.com/public_html/uploads";
  if (fsSync.existsSync("/home/u209525223/domains/unu-raymi.com/public_html")) {
    if (!dirs.includes(hostingerPublicUploads)) dirs.push(hostingerPublicUploads);
  }

  // 4. Carpeta de subdominio api de Hostinger en public_html si existe
  const hostingerApiUploads = "/home/u209525223/domains/unu-raymi.com/public_html/api/uploads";
  if (fsSync.existsSync("/home/u209525223/domains/unu-raymi.com/public_html/api")) {
    if (!dirs.includes(hostingerApiUploads)) dirs.push(hostingerApiUploads);
  }

  // 5. Carpeta de uploads local (repositorio) — siempre presente como fallback
  const localStorage = resolve(__dirname, "../../storage/uploads");
  if (!dirs.includes(localStorage)) dirs.push(localStorage);

  // 6. Carpeta de respaldo local public_html
  const localPublicHtml = resolve(__dirname, "../../../public_html/uploads");
  if (!dirs.includes(localPublicHtml)) dirs.push(localPublicHtml);

  return dirs;
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
 * y la guarda en todos los directorios de persistencia (storage y public_html).
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

    const uploadDirs = getUploadDirectories();

    // Generar un nombre único para el archivo
    const uniqueId = randomUUID();
    const originalNameClean = req.file.originalname
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .substring(0, 40); // Limitar longitud del nombre

    let outputFilename;
    let fileBuffer;

    if (req.file.mimetype === "application/pdf") {
      outputFilename = `${originalNameClean}-${uniqueId}.pdf`;
      fileBuffer = req.file.buffer;
    } else {
      outputFilename = `${originalNameClean}-${uniqueId}.webp`;
      fileBuffer = await sharp(req.file.buffer)
        .webp({ quality: 82 })
        .toBuffer();
    }

    // Escribir el buffer procesado en todos los directorios de almacenamiento
    let savedCount = 0;
    const savedPaths = [];

    await Promise.all(
      uploadDirs.map(async (dir) => {
        try {
          await fs.mkdir(dir, { recursive: true });
          const dest = join(dir, outputFilename);
          await fs.writeFile(dest, fileBuffer);
          savedCount++;
          savedPaths.push(dest);
        } catch (err) {
          console.warn(`[upload] Advertencia guardando en ${dir}:`, err.message);
        }
      })
    );

    if (savedCount === 0) {
      console.error("[upload] Error: No se pudo guardar el archivo en ningún directorio.");
      return res.status(500).json({
        success: false,
        error: "No se pudo persistir el archivo subido. Contacta al administrador.",
      });
    }

    console.log(`[upload] ✅ Guardado en ${savedCount}/${uploadDirs.length} directorios: ${outputFilename}`);

    // Ruta relativa (compatibilidad con frontend actual) y URL absoluta (preferida en admin)
    const relativePath = `/uploads/${outputFilename}`;
    const absoluteUrl = `${API_PUBLIC_URL}${relativePath}`;

    return res.status(200).json({
      success: true,
      message: "Archivo procesado y subido exitosamente.",
      data: {
        url: relativePath,         // Ruta relativa — compatible con el frontend actual
        absoluteUrl: absoluteUrl,  // URL absoluta — usar preferiblemente en el admin
        filename: outputFilename,
        savedInDirs: savedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
