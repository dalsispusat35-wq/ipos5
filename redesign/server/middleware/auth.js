import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipos5_super_secret_jwt_key_2026';
const AUTH_DISABLED = process.env.DISABLE_AUTH === 'true';

export const requireAuth = (req, res, next) => {
  if (AUTH_DISABLED) {
    req.user = { username: 'dev', role: 'SUPER_ADMIN', name: 'Dev Account (Auth Disabled)' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login telah kadaluarsa atau tidak valid. Silakan login kembali.'
    });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (AUTH_DISABLED) return next();

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('[SECURITY ALERT] User ' + req.user.username + ' (Role: ' + req.user.role + ') mencoba mengakses endpoint restricted: ' + req.originalUrl);
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak (403 Forbidden). Fitur ini khusus untuk role: ' + allowedRoles.join(', ') + '.'
      });
    }

    next();
  };
};
