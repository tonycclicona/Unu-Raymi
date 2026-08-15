export const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com')
  ? 'https://unu-raymi.com/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

export const API_ASSETS_URL = 'https://unu-raymi.com';

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
    if (res.status === 401 || res.status === 400) {
      throw new Error(data.error || 'Credenciales incorrectas');
    }
  } catch (err) {
    if (err.message === 'Credenciales incorrectas') throw err;
    
    // Intento 2: Fallback vía Gateway Principal https://unu-raymi.com/api
    try {
      const fallbackUrl = `https://unu-raymi.com/api${url}`;
      const resFallback = await fetch(fallbackUrl, options);
      const dataFallback = await resFallback.json().catch(() => ({}));
      if (resFallback.ok) return dataFallback;
      throw new Error(dataFallback.error || 'Credenciales incorrectas');
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
