/**
 * OpenPay Perú Service - Integration Engine
 * Maneja la generación de transacciones de pago con redirección a la pasarela segura
 * de OpenPay Perú (Tarjetas Visa/Mastercard/Amex, PagoEfectivo y QR Yape).
 */

/**
 * Genera un enlace o sesión de cobro segura para OpenPay Perú
 * 
 * @param {Object} reserva Datos de la reserva a pagar
 * @returns {Object} { success, chargeId, paymentUrl, data, error }
 */
export async function createOpenpayChargeSession(reserva) {
  // Lectura dinámica de variables de entorno en cada invocación
  const merchantId = (process.env.OPENPAY_MERCHANT_ID || '').trim();
  const privateKey = (process.env.OPENPAY_PRIVATE_KEY || '').trim();
  const baseUrl = (process.env.OPENPAY_BASE_URL || 'https://sandbox-api.openpay.pe/v1').trim().replace(/\/+$/, '');
  const frontendUrl = (process.env.FRONTEND_URL || 'https://unu-raymi.com').trim().replace(/\/+$/, '');
  const defaultCurrency = (process.env.OPENPAY_CURRENCY || 'USD').trim().toUpperCase();

  if (!merchantId || !privateKey) {
    console.error('❌ [OpenPay Service] Credenciales no configuradas: OPENPAY_MERCHANT_ID o OPENPAY_PRIVATE_KEY están vacías.');
    return {
      success: false,
      error: 'Credenciales de OpenPay Perú no configuradas en el servidor. Por favor verifica OPENPAY_MERCHANT_ID y OPENPAY_PRIVATE_KEY en las variables de entorno.',
    };
  }

  // 1. Desglosar nombre y apellido (OpenPay exige obligatoriamente name y last_name)
  const nombreCompleto = (reserva.titularNombre || 'Cliente Unuraymi').trim();
  const partes = nombreCompleto.split(/\s+/);
  const firstName = partes[0] || 'Cliente';
  const lastName = partes.slice(1).join(' ') || (partes.length === 1 ? 'Cliente' : 'Unuraymi');

  // 2. Limpiar teléfono (solo dígitos, mínimo 7 caracteres)
  let phoneClean = (reserva.titularTelefono || '999999999').replace(/[^0-9]/g, '');
  if (phoneClean.length < 7) {
    phoneClean = '999999999';
  }

  const emailFinal = (reserva.titularEmail || 'contacto@unu-raymi.com').trim();
  const amount = parseFloat(Number(reserva.precioTotal).toFixed(2));
  const orderId = `UNU-${reserva.id}-${Date.now().toString().slice(-6)}`;
  const redirectUrl = `${frontendUrl}/reserva-confirmada?token=${reserva.tokenSeguridad}&order_id=${orderId}&openpay=success`;

  // 3. Payload estricto según especificación de OpenPay para cobros con redirección
  const chargePayload = {
    method: 'card',
    amount: amount,
    currency: defaultCurrency,
    description: `Reserva Unuraymi Tour: ${reserva.tour?.nombre || 'Trek & Aventura'}`.slice(0, 240),
    order_id: orderId,
    customer: {
      name: firstName.slice(0, 90),
      last_name: lastName.slice(0, 90),
      email: emailFinal,
      phone_number: phoneClean.slice(-15),
    },
    confirm: false,
    send_email: false,
    redirect_url: redirectUrl,
  };

  const authHeader = Buffer.from(`${privateKey}:`).toString('base64');
  console.log(`[OpenPay Service] 🚀 Creando cargo en OpenPay Perú:`, {
    merchantId: merchantId.slice(0, 6) + '***',
    amount: chargePayload.amount,
    currency: chargePayload.currency,
    orderId: chargePayload.order_id,
    customer: `${chargePayload.customer.name} ${chargePayload.customer.last_name}`,
  });

  try {
    let res = await fetch(`${baseUrl}/${merchantId}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(chargePayload),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    // Si la cuenta del comercio solo admite PEN o solo USD (error_code 1003)
    if (!res.ok && (data.error_code === 1003 || /currency/i.test(data.description || ''))) {
      const altCurrency = defaultCurrency === 'USD' ? 'PEN' : 'USD';
      // Si convertimos USD -> PEN tipo de cambio referencial 3.80
      const altAmount = defaultCurrency === 'USD'
        ? parseFloat((amount * 3.8).toFixed(2))
        : parseFloat((amount / 3.8).toFixed(2));

      console.warn(`[OpenPay Service] ⚠️ Moneda ${defaultCurrency} no soportada por el comercio. Reintentando con ${altCurrency} ($${altAmount})...`);
      chargePayload.currency = altCurrency;
      chargePayload.amount = altAmount;

      res = await fetch(`${baseUrl}/${merchantId}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(chargePayload),
      });

      try {
        data = await res.json();
      } catch {
        data = {};
      }
    }

    if (res.ok && data.payment_method?.url) {
      console.log(`✅ [OpenPay Service] Sesión de pago generada exitosamente! ID: ${data.id}`);
      return {
        success: true,
        chargeId: data.id,
        paymentUrl: data.payment_method.url,
        data,
      };
    }

    // Si OpenPay respondió con error
    console.error(`❌ [OpenPay Service Error HTTP ${res.status}]:`, data);
    return {
      success: false,
      error: data.description || data.message || `Error ${res.status} de pasarela OpenPay Perú`,
      details: data,
    };
  } catch (error) {
    console.error('❌ [OpenPay Service Exception]:', error.message);
    return {
      success: false,
      error: `Error de conexión con OpenPay Perú: ${error.message}`,
    };
  }
}

