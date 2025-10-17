const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Login user
exports.login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        if (!email && !username) {
            return res.status(400).json({ message: 'Email or username is required' });
        }

        // Find user by email or username
        let user;
        if (email) {
            // Login with email (for SuperAdmin)
            user = db.prepare(`
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name,
                   uom.outletid
                  
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.email = ? AND u.status = 0
             
            `).get(email);
        } else {
            // Login with username (for Hotel Admin)
            user = db.prepare(`
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name,
                   uom.outletid                  
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.username = ? AND u.status = 0
              
            `).get(username);
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        db.prepare('UPDATE mst_users SET last_login = datetime(\'now\') WHERE userid = ?').run(user.userid);

        // Create JWT token
        const token = jwt.sign(
            {
                userid: user.userid,
                username: user.username,
                email: user.email,
                role_level: user.role_level,
                brand_id: user.brand_id,
                hotelid: user.hotelid,
                outletid: user.outletid, // Ensure this is included
                created_by_id: user.created_by_id || null // Ensure it’s included, even if null
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data (without password)
        const userResponse = {
            id: user.userid,
            username: user.username,
            email: user.email,
            name: user.full_name,
            role: user.role_level,
            role_level: user.role_level,
            brand_id: user.brand_id,
            hotelid: user.hotelid,
            outletid: user.outletid,
            outlet_name: user.outlet_name, // Adjusted to use outlet_name alias
            brand_name: user.brand_name,
            hotel_name: user.hotel_name,  
            created_by_id: user.created_by_id || null, // Ensure it’s included, even if null
            token: token
        };

        // Log login details based on user role
        if (user.role_level === 'hotel_admin') {
            console.log('🏨 Hotel Admin Login Details:');
            console.log('   Login User ID:', user.userid);
            console.log('   Username:', user.username);
            console.log('   Hotel ID:', user.hotelid);
            console.log('   Brand ID:', user.brand_id);
            console.log('   Hotel Name:', user.hotel_name);
            console.log('   Brand Name:', user.brand_name);
            console.log('   Full Name:', user.full_name);
            console.log('   Email:', user.email);
            console.log('   Phone:', user.phone);
            console.log('   Login Time:', new Date().toISOString());
            console.log('   ---');
        } else if (user.role_level === 'superadmin') {
            console.log('👑 SuperAdmin Login Details:');
            console.log('   Login User ID:', user.userid);
            console.log('   Username:', user.username);
            console.log('   Email:', user.email);
            console.log('   Full Name:', user.full_name);
            console.log('   Login Time:', new Date().toISOString());
            console.log('   ---');
        }

        res.json(userResponse);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = db.prepare(`
            SELECT u.*, 
                  
                   b.hotel_name AS brand_name,
                   h.hotel_name AS hotel_name,
                   uom.outletid
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            LEFT JOIN mst_outlets d ON uom.outletid = d.outletid
            WHERE u.userid = ? AND u.status = 0
           
        `).get(decoded.userid);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const userResponse = {
            id: user.userid,
            username: user.username,
            email: user.email,
            name: user.full_name,
            role: user.role_level,
            role_level: user.role_level,
            brand_id: user.brand_id,
            hotelid: user.hotelid,
            outletid: user.outletid ,
            brand_name: user.brand_name,
            hotel_name: user.hotel_name
        };

        res.json(userResponse);

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Verify password for F8 action on billed tables (current implementation)
exports.verifyF8Password = async (req, res) => {
    try {
        const { password } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user details
        const user = db.prepare(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `).get(decoded.userid);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Allow only admins to perform this action
        if (user.role_level !== 'hotel_admin' && user.role_level !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Permission denied. Only admins can perform this action.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        res.json({ success: true, message: 'Password verified successfully' });

    } catch (error) {
        console.error('F8 password verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify password of the user who created the bill for F8 action on billed tables
exports.verifyBillCreatorPassword = async (req, res) => {
    try {
        const { password, txnId } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        if (!txnId) {
            return res.status(400).json({ success: false, message: 'Transaction ID is required' });
        }

        // Verify JWT token to get current user
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get current user details (for logging purposes)
        const currentUser = db.prepare(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `).get(decoded.userid);

        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Current user not found' });
        }

        // Find the transaction and get the UserId (which is the creator)
        const transaction = db.prepare(`
            SELECT TxnID, UserId
            FROM TAxnTrnbill
            WHERE TxnID = ?
        `).get(txnId);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (!transaction.UserId) {
            return res.status(400).json({ success: false, message: 'Bill creator information not available for this transaction.' });
        }

        // Get the bill creator's details
        const billCreator = db.prepare(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `).get(transaction.UserId);

        if (!billCreator) {
            return res.status(404).json({ success: false, message: 'Bill creator not found' });
        }

        // Verify password against the bill creator
        const isValidPassword = await bcrypt.compare(password, billCreator.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Log the verification attempt
        console.log('🔐 Bill Creator Password Verification:');
        console.log('   Current User ID:', currentUser.userid);
        console.log('   Current Username:', currentUser.username);
        console.log('   Bill Creator ID:', billCreator.userid);
        console.log('   Bill Creator Username:', billCreator.username);
        console.log('   Transaction ID:', txnId);
        console.log('   Verification Time:', new Date().toISOString());
        console.log('   ---');

        res.json({
            success: true,
            message: 'Bill creator password verified successfully',
            billCreator: {
                id: billCreator.userid,
                username: billCreator.username,
                name: billCreator.full_name,
                role_level: billCreator.role_level
            }
        });

    } catch (error) {
        console.error('Bill creator password verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify password for handover access
exports.verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user details
        const user = db.prepare(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `).get(decoded.userid);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        res.json({ success: true, message: 'Password verified successfully' });

    } catch (error) {
        console.error('Password verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify password of the user's creator (e.g., Hotel Admin for an Outlet User)
exports.verifyCreatorPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Verify JWT to get current user's ID
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the current user to get their creator's ID
        const currentUser = db.prepare('SELECT created_by_id FROM mst_users WHERE userid = ?').get(decoded.userid);

        if (!currentUser || !currentUser.created_by_id) {
            return res.status(404).json({ success: false, message: 'Creator (Hotel Admin) not found for this user.' });
        }

        // Get the creator's (Hotel Admin's) details, specifically the password hash
        const creator = db.prepare("SELECT password, role_level FROM mst_users WHERE userid = ? AND role_level IN ('hotel_admin', 'brand_admin', 'superadmin')").get(currentUser.created_by_id);

        if (!creator) {
            return res.status(404).json({ success: false, message: 'Creator user record not found or is not an authorized admin.' });
        }

        // Verify the provided password against the creator's hashed password
        const isValidPassword = await bcrypt.compare(password, creator.password);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // If password is valid
        res.json({ success: true, message: 'Password verified successfully' });

    } catch (error) {
        console.error('Creator password verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create initial SuperAdmin (if not exists)
exports.createInitialSuperAdmin = async () => {
    try {
        // Check if SuperAdmin exists
        const existingSuperAdmin = db.prepare('SELECT userid FROM mst_users WHERE role_level = ?').get('superadmin');
        
        if (!existingSuperAdmin) {
            const hashedPassword = await bcrypt.hash('superadmin123', 10);
            
            const stmt = db.prepare(`
                INSERT INTO mst_users (
                    username, email, password, full_name, role_level, 
                    status, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            
            const result = stmt.run(
                'superadmin',
                'superadmin@miracle.com',
                hashedPassword,
                'Super Administrator',
                'superadmin',
                1
            );

            // Create default permissions for SuperAdmin
            const defaultPermissions = {
                'orders': { view: 1, create: 1, edit: 1, delete: 1 },
                'customers': { view: 1, create: 1, edit: 1, delete: 1 },
                'menu': { view: 1, create: 1, edit: 1, delete: 1 },
                'reports': { view: 1, create: 1, edit: 1, delete: 1 },
                'users': { view: 1, create: 1, edit: 1, delete: 1 },
                'settings': { view: 1, create: 1, edit: 1, delete: 1 }
            };

            const permStmt = db.prepare(`
                INSERT INTO mst_user_permissions (
                    userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);

            Object.entries(defaultPermissions).forEach(([module, perms]) => {
                permStmt.run(
                    result.lastInsertRowid,
                    module,
                    perms.view ? 1 : 0,
                    perms.create ? 1 : 0,
                    perms.edit ? 1 : 0,
                    perms.delete ? 1 : 0,
                    result.lastInsertRowid
                );
            });

            console.log('✅ Initial SuperAdmin created successfully');
            console.log('📧 Email: superadmin@miracle.com');
            console.log('🔑 Password: superadmin123');
        } else {
            console.log('ℹ️ SuperAdmin already exists');
        }
    } catch (error) {
        console.error('❌ Error creating SuperAdmin:', error);
    }
};
