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
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(name);
  }
  return null;
}

export async function fetcher(url) {
  const headers = {};
  const token = getCookie('session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = url.startsWith('/') ? url : `/${url}`;
  const candidates = [
    `${API_BASE_URL}${endpoint}`,
    `https://unu-raymi.com/api${endpoint}`
  ];

  let lastError = null;
  for (const targetUrl of candidates) {
    try {
      const res = await fetch(targetUrl, { headers });
      if (res.ok) {
        return await res.json();
      }
      const errorData = await res.json().catch(() => ({}));
      lastError = new Error(errorData.error || `Error ${res.status}`);
      lastError.status = res.status;
      if (res.status === 401 || res.status === 403) throw lastError;
    } catch (e) {
      lastError = e;
      if (e.status === 401 || e.status === 403) throw e;
    }
  }
  throw lastError || new Error('No se pudo conectar con el servidor.');
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

  const endpoint = url.startsWith('/') ? url : `/${url}`;
  const candidates = [
    `${API_BASE_URL}${endpoint}`,
    `https://unu-raymi.com/api${endpoint}`
  ];

  let lastError = null;
  for (const targetUrl of candidates) {
    try {
      const res = await fetch(targetUrl, options);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.status === 'starting') {
          throw new Error('El servidor de la API está iniciando. Por favor espera unos segundos y reintenta.');
        }
        return data;
      }

      // Si las credenciales son incorrectas o la sesión expiró
      if (res.status === 401 || res.status === 403) {
        if (typeof document !== 'undefined') {
          document.cookie = 'session_token=; path=/; max-age=0';
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('session_token');
        }
        throw new Error(data.error || 'Credenciales incorrectas o sesión expirada.');
      }

      lastError = new Error(data.error || `Error en la petición: ${res.status}`);
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('Credenciales') || err.message.includes('iniciando') || err.status === 401 || err.status === 403)) {
        throw err;
      }
    }
  }

  throw lastError || new Error('No se pudo conectar con el servidor de la API.');
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
