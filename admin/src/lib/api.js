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

  // Intento 1: Servidor configurado (api.unu-raymi.com)
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Intento 2: Fallback redundante a unu-raymi.com/api si api.unu-raymi.com tiene intermitencias
  if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
    try {
      const fallbackRes = await fetch(`https://unu-raymi.com/api${url}`, { headers });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch (e) {}
  }

  // Si falló, realizar petición final para capturar el mensaje de error original
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
  
  // Función auxiliar de petición
  const executeFetch = async (baseUrl) => {
    const res = await fetch(`${baseUrl}${url}`, options);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (text.trim().startsWith('<') || text.includes('<html')) {
        throw new Error('El servidor devolvió una página HTML en lugar de JSON. Verifique que la API de Node.js esté activa.');
      }
      throw new Error('Respuesta inválida del servidor.');
    }

    if (res.ok) return data;
    
    // Si la sesión expiró o el token es inválido
    if (res.status === 401 || res.status === 403) {
      if (typeof document !== 'undefined') {
        document.cookie = 'session_token=; path=/; max-age=0';
      }
      throw new Error(data.error || 'Credenciales incorrectas o sesión inválida.');
    }
    
    throw new Error(data.error || `Error en la petición: ${res.status}`);
  };

  try {
    return await executeFetch(API_BASE_URL);
  } catch (err) {
    // Fallback redundante a unu-raymi.com/api si falló api.unu-raymi.com
    if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
      try {
        return await executeFetch('https://unu-raymi.com/api');
      } catch (fallbackErr) {}
    }
    throw err;
  }
}

export async function uploadApi(url, formData) {
  const headers = {};
  const token = getCookie('session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const executeUpload = async (baseUrl) => {
    const res = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error en la subida: ${res.status}`);
    }
    return data;
  };

  try {
    return await executeUpload(API_BASE_URL);
  } catch (err) {
    // Fallback redundante a unu-raymi.com/api si falló api.unu-raymi.com
    if (typeof window !== 'undefined' && window.location.hostname.includes('unu-raymi.com') && API_BASE_URL.includes('api.unu-raymi.com')) {
      try {
        return await executeUpload('https://unu-raymi.com/api');
      } catch (fallbackErr) {}
    }
    throw err;
  }
}
