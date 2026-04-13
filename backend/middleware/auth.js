const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Set user info on req object
    req.userid = decoded.userid;
    req.hotelid = decoded.hotelid;
    req.outletid = decoded.outletid;
    req.role_level = decoded.role_level;
    req.brand_id = decoded.brand_id;

    next();
  });
};

const enforceHotelIsolation = (req, res, next) => {
  try {
    const { role_level, hotelid: tokenHotelId } = req;
    
    // Skip for superadmin (sees all)
    if (role_level === 'superadmin') {
      req.effectiveHotelId = null; // Allow all
      return next();
    }
    
    // For hotel_admin, enforce req.hotelid (e.g. 3) - no override allowed
    if (role_level === 'hotel_admin') {
      if (!tokenHotelId) {
        return res.status(400).json({ 
          message: 'hotelid missing from token for hotel_admin',
          role_level 
        });
      }
      
      // Reject explicit override attempts
      if (req.query.hotelid && req.query.hotelid != tokenHotelId) {
        console.warn(`🚫 Hotel override blocked: hotel_admin(${tokenHotelId}) tried hotelid=${req.query.hotelid}`);
        return res.status(403).json({ 
          message: `Access denied. hotelid must be ${tokenHotelId}`,
          expected: tokenHotelId,
          requested: req.query.hotelid
        });
      }
      
      req.effectiveHotelId = tokenHotelId;
      console.log(`🔒 Hotel isolation enforced: hotel_admin → hotelid=${tokenHotelId}`);
      return next();
    }
    
    // Default: allow query params for other roles
    req.effectiveHotelId = req.query.hotelid || tokenHotelId;
    next();
    
  } catch (error) {
    console.error('Hotel isolation error:', error);
    res.status(500).json({ message: 'Isolation check failed' });
  }
};

module.exports = { 
  authenticateToken, 
  enforceHotelIsolation 
};
