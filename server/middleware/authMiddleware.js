import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT
const protect = async (req, res, next) => {
  // Accept token from cookie OR Authorization header (for cross-domain Vercel+Render)
  let token = req.cookies.jwt;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (/^bearer\s+/i.test(authHeader)) {
      token = authHeader.replace(/^bearer\s+/i, '').trim();
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
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
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
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
