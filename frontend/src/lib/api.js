// ── URL base de la API ─────────────────────────────────────────────────────────
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.unu-raymi.com/api';

// ── URL base para servir assets estáticos (uploads de imágenes) ────────────────
// Removemos el sufijo /api para obtener el origen raíz del servidor
export const API_ASSETS_URL = process.env.NEXT_PUBLIC_API_ASSETS_URL ||
  API_BASE_URL.replace(/\/api$/, '');

// URL canónica del dominio principal (para fallback de assets)
const MAIN_DOMAIN_URL = 'https://unu-raymi.com';

// ── Fetcher SWR con fallback automático ────────────────────────────────────────
export async function fetcher(url) {
  // Intento 1: API configurada (api.unu-raymi.com o localhost)
  try {
    const res = await fetch(`${API_BASE_URL}${url}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Intento 2: Fallback al dominio principal si hay intermitencias en api.unu-raymi.com
  if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
    try {
      const fallbackRes = await fetch(`${MAIN_DOMAIN_URL}/api${url}`);
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch (e) {}
  }

  // Lanzar error con información de la última petición fallida
  const res = await fetch(`${API_BASE_URL}${url}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Ocurrió un error al consultar la API');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// ── Mutación de API (POST, PUT, DELETE, PATCH) con fallback ───────────────────
export async function mutateApi(url, { method = 'POST', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    throw new Error(data.error || `Error en la petición: ${res.status}`);
  } catch (err) {
    // Fallback al dominio principal si la API subdominio falla
    if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
      try {
        const fallbackRes = await fetch(`${MAIN_DOMAIN_URL}/api${url}`, options);
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok) return fallbackData;
      } catch (e) {}
    }
    throw err;
  }
}

/**
 * Construye la URL absoluta canónica para un archivo de upload.
 * Acepta:
 *   - Nombre de archivo simple:  "foto.webp"                → "https://api.unu-raymi.com/uploads/foto.webp"
 *   - Ruta relativa:             "/uploads/foto.webp"        → "https://api.unu-raymi.com/uploads/foto.webp"
 *   - URL absoluta ya formada:   "https://...foto.webp"      → devuelve sin cambios
 *   - data URI o vacío:          devuelve sin cambios o ''
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';

  // Ya es una URL absoluta o data URI → devolverla tal cual
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  // Aseguramos que inicie con /
  const clean = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;

  // Si ya tiene /uploads/ simplemente lo prefijamos con el origen de assets
  if (clean.startsWith('/uploads/')) {
    return `${API_ASSETS_URL}${clean}`;
  }

  // Si es solo el nombre del archivo (sin directorio), asumimos que está en /uploads/
  if (!clean.includes('/')) {
    return `${API_ASSETS_URL}/uploads${clean}`;
  }

  // Cualquier otra ruta relativa: prefijamos con el origen de assets
  return `${API_ASSETS_URL}${clean}`;
}

/**
 * Construye la URL absoluta para un filename de upload (sin ruta).
 * Alias semántico de getImageUrl para mayor claridad en contextos de upload.
 */
export function getUploadUrl(filename) {
  if (!filename) return '';
  const name = filename.startsWith('/') ? filename : `/${filename}`;
  const base = name.startsWith('/uploads/') ? name : `/uploads${name}`;
  return `${API_ASSETS_URL}${base}`;
}

/**
 * Manejador onError para <img> con conmutación automática de hosts.
 * Orden de fallback: api.unu-raymi.com → unu-raymi.com → ruta local relativa
 */
export function handleImageFallback(e, pathOrUrl) {
  if (!pathOrUrl || !e?.target) return;
  const img = e.target;

  // Extraer el nombre del archivo para construir rutas de fallback
  const clean = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const uploadsPath = clean.startsWith('/uploads/') ? clean : `/uploads${clean}`;

  const tried = parseInt(img.dataset.triedFallback || '0', 10);
  img.dataset.triedFallback = String(tried + 1);

  if (tried === 0 && !img.src.includes('api.unu-raymi.com')) {
    img.src = `https://api.unu-raymi.com${uploadsPath}`;
  } else if (tried <= 1 && !img.src.includes('unu-raymi.com')) {
    img.src = `${MAIN_DOMAIN_URL}${uploadsPath}`;
  } else if (tried <= 2) {
    img.src = uploadsPath; // Ruta relativa (sirve si el proxy local la tiene)
  }
  // Después de 3 intentos no seguimos para evitar bucles
}

