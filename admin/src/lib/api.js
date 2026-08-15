export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') 
    ? 'https://api.unu-raymi.com/api' 
    : 'http://localhost:4000/api');

export const API_ASSETS_URL = process.env.NEXT_PUBLIC_API_ASSETS_URL || 
  API_BASE_URL.replace(/\/api$/, '');

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export async function fetcher(url) {
  const headers = {};
  const token = getCookie('session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Ocurrió un error al consultar la API');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function mutateApi(url, { method = 'POST', body } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getCookie('session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  // Intento 1: API Directa
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    
    // Si no es ok, lanzamos error para que no retorne undefined
    throw new Error(data.error || `Error en la petición: ${res.status}`);
  } catch (err) {
    if (err.message && (err.message.includes('Credenciales incorrectas') || err.message.includes('Error en la petición'))) {
      throw err;
    }
    
    // Intento 2: Fallback vía Gateway Principal https://api.unu-raymi.com/api
    try {
      const fallbackUrl = `https://api.unu-raymi.com/api${url}`;
      const resFallback = await fetch(fallbackUrl, options);
      const dataFallback = await resFallback.json().catch(() => ({}));
      if (resFallback.ok) return dataFallback;
      throw new Error(dataFallback.error || `Error en la petición: ${resFallback.status}`);
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  }
}

export async function uploadApi(url, formData) {
  const headers = {};
  const token = getCookie('session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error en la subida: ${res.status}`);
  }
  return data;
}
