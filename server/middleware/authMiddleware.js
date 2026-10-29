import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT
const protect = async (req, res, next) => {
  let token = null;

  // 1. Try cookie first (same-domain)
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // 2. Try Authorization header (cross-domain: Vercel -> Render)
  if (!token && req.headers.authorization) {
    const authHeader = String(req.headers.authorization).trim();
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      token = match[1].trim();
    }
  }

  // 3. Try x-auth-token header as fallback
  if (!token && req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // Emergency admin bypass
      if (decoded.userId === 'admin_emergency_id') {
        req.user = {
          _id: 'admin_emergency_id',
          name: 'Admin Controller',
          email: 'admin@campus.edu',
          role: 'admin',
          isReferee: false
        };
        return next();
      }

      req.user = await User.findById(decoded.userId).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('JWT verify error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }

    const userRole = req.user.role;
    const isReferee = Boolean(req.user.isReferee || userRole === 'referee');
    const isAdmin = userRole === 'admin';

    const isAuthorized = isAdmin ||
      roles.includes(userRole) ||
      (roles.includes('referee') && isReferee);

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: `User role '${userRole}' is not authorized to access this route`
      });
    }

    // Check referee time validity
    if ((userRole === 'referee' || isReferee) && !isAdmin) {
      if (req.user.refereeExpiresAt && Date.now() > new Date(req.user.refereeExpiresAt).getTime()) {
        return res.status(403).json({
          message: 'Referee officiating privileges have expired for your account.'
        });
      }
    }
    next();
  };
};

export { protect, authorize };
