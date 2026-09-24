import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acceso denegado. No se proporcionó un token de autenticación.',
    });
  }

  const token = authHeader.split(' ')[1];
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET || (!isProduction ? 'unu_raymi_super_secret_key_2026' : null);

  if (!jwtSecret) {
    console.error('[AuthMiddleware] Error crítico: JWT_SECRET no configurado en entorno de producción.');
    return res.status(500).json({
      success: false,
      error: 'Configuración de seguridad del servidor inválida.',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado.',
    });
  }
};
