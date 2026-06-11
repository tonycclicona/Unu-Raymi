import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'unu_raymi_super_secret_key_2026';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acceso denegado. No se proporcionó un token de autenticación.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado.',
    });
  }
};
