export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const API_ASSETS_URL = process.env.NEXT_PUBLIC_API_ASSETS_URL || 
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : 'http://localhost:4000');

export async function fetcher(url) {
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
  
  const res = await fetch(`${API_BASE_URL}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error en la petición: ${res.status}`);
  }
  return data;
}
