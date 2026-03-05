/**
 * Admin Authentication Middleware
 */

const { AppError } = require('./errorHandler');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.warn('⚠️ WARNING: ADMIN_PASSWORD not set in environment variables');
}

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Authorization header missing or invalid. Expected: Bearer <token>', 401)
    );
  }

  const token = authHeader.substring(7);

  if (token !== ADMIN_PASSWORD) {
    console.warn(`[Admin Auth] Failed authentication attempt from ${req.ip}`);
    return next(new AppError('Unauthorized. Invalid token.', 403));
  }

  next();
};

module.exports = { adminAuth };
