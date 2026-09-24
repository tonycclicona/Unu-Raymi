import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Comparación segura en tiempo constante usando SHA-256 + timingSafeEqual
 * Previene ataques de canal lateral (timing attacks).
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña son requeridos' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const adminUser = (process.env.ADMIN_USER || process.env.ADMIN_USERNAME || (!isProduction ? 'admin' : '')).trim();
    const adminPass = (process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD || (!isProduction ? 'admin123' : '')).trim();

    if (!adminUser || !adminPass) {
      console.error('[Auth] Error: ADMIN_USER y/o ADMIN_PASS no están configuradas en las variables de entorno.');
      return res.status(500).json({
        success: false,
        error: 'Las credenciales de administrador no están configuradas en el servidor.',
      });
    }

    const inputUser = String(username).trim();
    const inputPass = String(password).trim();

    // Validación en tiempo constante contra credenciales de entorno
    const isUserValid = safeCompare(inputUser, adminUser);
    const isPassValid = safeCompare(inputPass, adminPass);

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const jwtSecret = process.env.JWT_SECRET || (!isProduction ? 'unu_raymi_super_secret_key_2026' : null);
    if (!jwtSecret) {
      console.error('[Auth] Error crítico: JWT_SECRET no está definido en variables de entorno de producción.');
      return res.status(500).json({
        success: false,
        error: 'Configuración de seguridad del servidor incompleta.',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { role: 'admin', user: inputUser },
      jwtSecret,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token,
      message: 'Autenticación exitosa',
    });
  } catch (error) {
    next(error);
  }
};

