const bcrypt = require('bcryptjs');
const db = require('../../../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  try {
    // ✅ MySQL query (instead of db.prepare)
    const [rows] = await db.query(
      `SELECT userid as user_id, full_name as name, email, password, role_level as role, status as is_active, hotelid as hotel_id
       FROM mst_users 
       WHERE email = ? AND status = 0
       LIMIT 1`,
      [email]
    );

    // ✅ Check user exists
    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const user = rows[0];

    // ✅ Check active
    if (user.is_active != 0) {
      return res.status(403).json({
        message: 'User is inactive',
      });
    }

    // ✅ Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    console.log('user', user);

    // (same as your logic)
    const token = user.role;

    return res.json({
      token,
      user: {
        id: user.user_id,
        username: user.name,
        name: user.name,
        email: user.email,
        role: user.role,
        hotel_id: user.hotel_id,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Login failed',
    });
  }
};

module.exports = {
  login,
};