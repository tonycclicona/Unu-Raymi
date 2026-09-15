export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') 
    ? 'https://api.unu-raymi.com/api' 
    : 'http://localhost:4000/api');

export const API_ASSETS_URL = process.env.NEXT_PUBLIC_API_ASSETS_URL || 
  API_BASE_URL.replace(/\/api$/, '');

export async function fetcher(url) {
  // Intento 1: Servidor configurado (api.unu-raymi.com)
  try {
    const res = await fetch(`${API_BASE_URL}${url}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Intento 2: Fallback redundante a unu-raymi.com/api si api.unu-raymi.com tiene intermitencias
  if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
    try {
      const fallbackRes = await fetch(`https://unu-raymi.com/api${url}`);
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch (e) {}
  }

  // Petición de reporte de error
  const res = await fetch(`${API_BASE_URL}${url}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Ocurrió un error al consultar la API');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function mutateApi(url, { method = 'POST', body } = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    throw new Error(data.error || `Error en la petición: ${res.status}`);
  } catch (err) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
      try {
        const fallbackRes = await fetch(`https://unu-raymi.com/api${url}`, options);
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok) return fallbackData;
      } catch (e) {}
    }
    throw err;
  }
}

/**
 * Normaliza y devuelve la URL absoluta para cualquier imagen
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_ASSETS_URL}${clean}`;
}

/**
 * Manejador de evento onError para etiquetas img con conmutación automática de host
 */
export function handleImageFallback(e, path) {
  if (!path || !e?.target || e.target.dataset.triedFallback) return;
  e.target.dataset.triedFallback = '1';
  const clean = path.startsWith('/') ? path : `/${path}`;
  e.target.src = `https://unu-raymi.com${clean}`;
}
