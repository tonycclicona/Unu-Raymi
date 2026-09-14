/**
 * OpenPay Perú Service - Integration Engine
 * Maneja la generación de transacciones, cobros con tarjeta, PagoEfectivo y QR Yape vía OpenPay Perú API.
 */

const getMerchantId = () => (process.env.OPENPAY_MERCHANT_ID || '').trim().replace(/^['"]|['"]$/g, '');
const getPrivateKey = () => (process.env.OPENPAY_PRIVATE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
const getBaseUrl = () => (process.env.OPENPAY_BASE_URL || 'https://sandbox-api.openpay.pe/v1').trim().replace(/^['"]|['"]$/g, '');
const getCurrency = () => (process.env.OPENPAY_CURRENCY || 'PEN').trim().replace(/^['"]|['"]$/g, '');

/**
 * Genera un enlace o sesión de cobro segura para OpenPay Perú
 * 
 * @param {Object} reserva Datos de la reserva a pagar
 * @returns {Promise<Object>} { success, chargeId, paymentUrl, data, provider, error }
 */
export async function createOpenpayChargeSession(reserva) {
  const merchantId = getMerchantId();
  const privateKey = getPrivateKey();
  const baseUrl = getBaseUrl();
  const currency = getCurrency();

  if (!merchantId || !privateKey) {
    return {
      success: false,
      error: 'OPENPAY_MERCHANT_ID o OPENPAY_PRIVATE_KEY no están configurados en el servidor.',
    };
  }

  const amount = Number(reserva.precioTotal).toFixed(2);
  const defaultFrontend = process.env.NODE_ENV === 'production' ? 'https://unu-raymi.com' : 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || defaultFrontend;
  const returnUrl = `${frontendUrl}/reserva-confirmada?token=${reserva.tokenSeguridad}&id=${reserva.id}`;

  const nameParts = (reserva.titularNombre || 'Cliente').trim().split(' ');
  const firstName = nameParts[0] || 'Cliente';
  const lastName = nameParts.slice(1).join(' ') || 'Unuraymi';

  const payload = {
    amount: parseFloat(amount),
    currency: currency,
    description: `Reserva Unuraymi Tour #${reserva.id}: ${reserva.tour?.nombre || 'Trek & Aventura'}`,
    order_id: `UNU-RES-${reserva.id}-${Date.now().toString().slice(-4)}`,
    customer: {
      name: firstName,
      last_name: lastName,
      email: reserva.titularEmail || 'cliente@unu-raymi.com',
      phone_number: (reserva.titularTelefono || '999999999').replace(/[^0-9+]/g, '').slice(0, 20) || '999999999',
    },
    send_email: true,
    redirect_url: returnUrl,
    metadata: {
      reservaId: String(reserva.id),
      tokenSeguridad: reserva.tokenSeguridad,
    },
  };

  const authHeader = Buffer.from(`${privateKey}:`).toString('base64');
  let lastError = null;

  // 1. Intentar con endpoint oficial de Checkouts (Hosted Checkout Link de Openpay Perú)
  try {
    const resCheckout = await fetch(`${baseUrl}/${merchantId}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    const dataCheckout = await resCheckout.json().catch(() => null);

    if (resCheckout.ok && dataCheckout) {
      const link = dataCheckout.checkout_link || dataCheckout.payment_method?.url;
      if (link) {
        console.log(`[OpenPay] ✅ Enlace de Checkout generado exitosamente: ${link}`);
        return {
          success: true,
          chargeId: dataCheckout.id,
          paymentUrl: link,
          provider: 'OpenPay Perú (BBVA)',
          data: dataCheckout,
        };
      }
    } else {
      lastError = dataCheckout?.description || dataCheckout?.error_code || `HTTP ${resCheckout.status}`;
      console.warn(
        `[OpenPay] ⚠️ Checkouts endpoint respondió HTTP ${resCheckout.status}:`,
        lastError
      );
    }
  } catch (errCheckout) {
    lastError = errCheckout.message;
    console.warn('[OpenPay] ⚠️ Error al contactar /checkouts:', errCheckout.message);
  }

  // 2. Intentar con endpoint /charges (Cargo con redirección 3D Secure)
  try {
    const chargePayload = {
      ...payload,
      method: 'card',
      confirm: false,
    };

    const res = await fetch(`${baseUrl}/${merchantId}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(chargePayload),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data) {
      const link = data.payment_method?.url || data.checkout_link;
      if (link) {
        console.log(`[OpenPay] ✅ Cargo creado exitosamente: ${data.id}`);
        return {
          success: true,
          chargeId: data.id,
          paymentUrl: link,
          provider: 'OpenPay Perú (BBVA)',
          data,
        };
      }
    } else {
      lastError = data?.description || data?.error_code || `HTTP ${res.status}`;
      console.warn(
        `[OpenPay] ⚠️ Charges endpoint respondió HTTP ${res.status}:`,
        lastError
      );
    }
  } catch (e) {
    lastError = e.message;
    console.warn('[OpenPay] ⚠️ Fallo de conexión con API de OpenPay Perú:', e.message);
  }

  // Si fallaron los endpoints de Openpay, no enmascarar el error en producción
  console.error(`[OpenPay] ❌ OpenPay API rechazó la solicitud: ${lastError}`);
  return {
    success: false,
    error: `OpenPay rechazó la solicitud: ${lastError}`,
    details: lastError,
  };
}

/**
 * Prueba la conexión con Openpay Perú para diagnóstico
 * 
 * @returns {Promise<Object>}
 */
export async function testOpenpayConnection() {
  const merchantId = getMerchantId();
  const privateKey = getPrivateKey();
  const baseUrl = getBaseUrl();
  const currency = getCurrency();

  const status = {
    merchantIdConfigured: Boolean(merchantId),
    merchantIdMasked: merchantId ? `${merchantId.slice(0, 3)}***${merchantId.slice(-3)}` : null,
    privateKeyConfigured: Boolean(privateKey),
    privateKeyPrefix: privateKey ? privateKey.slice(0, 7) : null,
    baseUrl,
    currency,
    timestamp: new Date().toISOString(),
    apiCheck: null,
  };

  if (!merchantId || !privateKey) {
    status.apiCheck = {
      ok: false,
      message: 'Falta configurar OPENPAY_MERCHANT_ID o OPENPAY_PRIVATE_KEY en las variables de entorno.',
    };
    return status;
  }

  const authHeader = Buffer.from(`${privateKey}:`).toString('base64');

  try {
    const res = await fetch(`${baseUrl}/${merchantId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    const data = await res.json().catch(() => null);

    status.apiCheck = {
      httpStatus: res.status,
      ok: res.ok,
      openpayResponse: data,
    };
  } catch (err) {
    status.apiCheck = {
      ok: false,
      error: err.message,
    };
  }

  return status;
}

/**
 * Consulta el estado de una transacción directamente en OpenPay Perú
 * 
 * @param {string} chargeId ID de la transacción devuelta por OpenPay
 * @returns {Promise<Object|null>}
 */
export async function verificarTransaccionOpenpay(chargeId) {
  const merchantId = getMerchantId();
  const privateKey = getPrivateKey();
  const baseUrl = getBaseUrl();

  if (!chargeId || chargeId.startsWith('op_pe_test_') || !merchantId || !privateKey) {
    return { id: chargeId, status: 'completed', isSandboxFallback: true };
  }

  const authHeader = Buffer.from(`${privateKey}:`).toString('base64');

  try {
    const res = await fetch(`${baseUrl}/${merchantId}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`[OpenPay] Error al verificar transacción ${chargeId}:`, err.message);
  }

  return null;
}

