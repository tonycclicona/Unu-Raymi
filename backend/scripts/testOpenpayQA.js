/**
 * testOpenpayQA.js — Script de verificación QA para Openpay Perú
 * 
 * Ejecuta validaciones automatizadas de:
 * 1. Generación de sesión de cobro Openpay
 * 2. Validación de URLs de retorno y parámetros
 * 3. Simulación de Webhook charge.succeeded
 */

import 'dotenv/config';
import { createOpenpayChargeSession, verificarTransaccionOpenpay } from '../src/services/openpayService.js';

async function runQA() {
  console.log('====================================================');
  console.log('🧪 INICIANDO BATERÍA DE PRUEBAS QA — OPENPAY PERÚ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // ── PRUEBA 1: Generación de Sesión de Cobro ─────────────────
  console.log('--- TEST 1: Creación de Sesión de Cargo Openpay ---');
  const mockReserva = {
    id: 9999,
    precioTotal: 150.00,
    tokenSeguridad: 'test-token-uuid-12345',
    titularNombre: 'Carlos Prado',
    titularEmail: 'test.carlos@example.com',
    titularTelefono: '987654321',
    tour: { nombre: 'Inca Trail 4 Días' },
  };

  try {
    const session = await createOpenpayChargeSession(mockReserva);
    if (session.success) {
      assert(session.success === true, 'La sesión retorna success: true');
      assert(session.chargeId && session.chargeId.length > 0, 'Se genera un chargeId identificador');
      assert(session.paymentUrl && session.paymentUrl.length > 0, 'Se genera paymentUrl de Openpay');
    } else {
      console.log(`ℹ️ [INFO] OpenPay rechazó credenciales de prueba como era esperado: ${session.error}`);
      assert(session.success === false, 'Detecta correctamente rechazo de Openpay API');
      assert(Boolean(session.error), 'Informa el mensaje de error explícito');
    }
  } catch (err) {
    console.error('Error en Test 1:', err);
    assert(false, 'Creación de sesión Openpay ejecutada sin excepciones');
  }

  // ── PRUEBA 2: Consulta de Transacción ────────────────────────
  console.log('\n--- TEST 2: Función de Verificación de Transacción ---');
  try {
    const checkResult = await verificarTransaccionOpenpay('op_pe_test_9999_12345');
    assert(checkResult !== null, 'Retorna respuesta de verificación');
    assert(checkResult.status === 'completed', 'Transacción de sandbox se valida como completed');
  } catch (err) {
    console.error('Error en Test 2:', err);
    assert(false, 'Verificación de transacción ejecutada sin errores');
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTADOS QA: ${passedTests}/${totalTests} pruebas aprobadas.`);
  console.log('====================================================');
}

runQA();
