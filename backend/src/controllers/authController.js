import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'unu_raymi_super_secret_key_2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña son requeridos' });
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { role: 'admin', user: username },
      JWT_SECRET,
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
