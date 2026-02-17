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

module.exports = { authenticateToken };