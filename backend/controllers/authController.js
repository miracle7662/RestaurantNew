const db = require('../config/db'); // should export a mysql2/promise pool
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Login user
exports.login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        console.log('🔐 === LOGIN REQUEST START ===');
        console.log('🔐 LOGIN ENTRY: email=', email, 'username=', username, 'password-provided=', !!password);

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        if (!email && !username) {
            return res.status(400).json({ message: 'Email or username is required' });
        }

        // Find user by email or username
        let user;
        if (email) {
            console.log('🔍 Querying user by EMAIL:', email);
            // Login with email (for SuperAdmin)
            const [rows] = await db.query(`
                SELECT u.*, h.trn_gstno, h.address AS address,
                       b.hotel_name as brand_name,
                       h.hotel_name as hotel_name,
                       u.outletid
                FROM mst_users u
                LEFT JOIN mst_outlets d ON u.outletid = d.outletid
                LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
                LEFT JOIN msthotelmasters b ON b.hotelid = h.hotelid
                WHERE u.email = ? AND u.status = 0
            `, [email]);
            user = rows[0];
        } else {
            console.log('🔍 Querying user by USERNAME:', username);
            // Login with username (for Hotel Admin)
            const [rows] = await db.query(`
                SELECT u.*, h.trn_gstno,
                       b.hotel_name as brand_name,
                       h.hotel_name as hotel_name,
                       u.outletid
                FROM mst_users u
                LEFT JOIN mst_outlets d ON u.outletid = d.outletid
                LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
                LEFT JOIN msthotelmasters b ON b.hotelid = h.hotelid
                WHERE u.username = ? AND u.status = 0
            `, [username]);
            user = rows[0];
        }

        if (!user) {
            console.log('❌ NO USER FOUND');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        console.log('✅ USER FOUND: ID=', user.userid, 'role=', user.role_level, 'hotel=', user.hotelid);

        // Check password
        console.log('🔐 Checking password for user:', user.username);
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ PASSWORD INVALID');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        console.log('✅ PASSWORD VALIDATED');

        // Update last login
        await db.query(
            'UPDATE mst_users SET last_login = NOW() WHERE userid = ?',
            [user.userid]
        );

        // Create JWT token
        const token = jwt.sign(
            {
                userid: user.userid,
                username: user.username,
                email: user.email,
                role_level: user.role_level,
                trn_gstno: user.trn_gstno,
                brand_id: user.brand_id,
                hotelid: user.hotelid,
                outletid: user.outletid,
                created_by_id: user.created_by_id || null
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
            trn_gstno: user.trn_gstno,
            brand_id: user.brand_id,
            hotelid: user.hotelid,
            outletid: user.outletid,
            outlet_name: user.outlet_name,
            brand_name: user.brand_name,
            hotel_name: user.hotel_name,
            address: user.address,
            created_by_id: user.created_by_id || null,
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
        console.error('💥 LOGIN ERROR:', error.message || error);
        console.error('💥 Full error:', error);
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

        const [rows] = await db.query(`
            SELECT u.*, h.trn_gstno, h.address AS address,
                   b.hotel_name AS brand_name,
                   h.hotel_name AS hotel_name,
                   u.outletid
            FROM mst_users u
            LEFT JOIN mst_outlets d ON u.outletid = d.outletid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            LEFT JOIN msthotelmasters b ON b.hotelid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `, [decoded.userid]);

        const user = rows[0];

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
            trn_gstno: user.trn_gstno,
            address: user.address,
            brand_id: user.brand_id,
            hotelid: user.hotelid,
            outletid: user.outletid,
            brand_name: user.brand_name,
            hotel_name: user.hotel_name
        };

        res.json(userResponse);

    } catch (error) {
        // console.error('Get current user error:', error);
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
        const [rows] = await db.query(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `, [decoded.userid]);

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Allow only admins to perform this action
        // ✅ Instead of checking logged-in user role,
        // check if entered password belongs to ANY admin

        const [admins] = await db.query(`
    SELECT password FROM mst_users
    WHERE role_level IN ('hotel_admin', 'superadmin')
      AND status = 0
`);

        let isValidPassword = false;

        for (const admin of admins) {
            const match = await bcrypt.compare(password, admin.password);
            if (match) {
                isValidPassword = true;
                break;
            }
        }

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password'
            });
        }

        // ✅ IMPORTANT (this was missing)
        return res.json({
            success: true,
            verified: true,
            message: 'Admin verified successfully'
        });

        // Verify password
        // const isValidPassword = await bcrypt.compare(password, user.password);
        // if (!isValidPassword) {
        //     return res.status(401).json({ success: false, message: 'Invalid password' });
        // }

        // res.json({ success: true, message: 'Password verified successfully' });

    } catch (error) {
        // console.error('F8 password verification error:', error);
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

        // Verify JWT token to get current user (for logging only)
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get current user details (for logging purposes only - no password verification)
        const [currentUserRows] = await db.query(`
            SELECT u.userid, u.username, u.full_name, u.role_level
            FROM mst_users u
            WHERE u.userid = ? AND u.status = 0
        `, [decoded.userid]);

        const currentUser = currentUserRows[0];

        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Current user not found' });
        }

        // Find the transaction (for logging only)
        const [txnRows] = await db.query(`
            SELECT TxnID, UserId
            FROM TAxnTrnbill
            WHERE TxnID = ?
        `, [txnId]);

        const transaction = txnRows[0];

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (!transaction.UserId) {
            return res.status(400).json({ success: false, message: 'Bill creator information not available for this transaction.' });
        }

        // Get the bill creator's details (for logging only)
        const [billCreatorRows] = await db.query(`
            SELECT u.userid, u.username, u.full_name, u.role_level
            FROM mst_users u
            WHERE u.userid = ? AND u.status = 0
        `, [transaction.UserId]);

        const billCreator = billCreatorRows[0];

        if (!billCreator) {
            return res.status(404).json({ success: false, message: 'Bill creator not found' });
        }

        // ========== ONLY CHECK FOR ADMIN PASSWORDS ==========
        // Check if entered password belongs to ANY hotel_admin or superadmin
        const [admins] = await db.query(`
            SELECT userid, username, full_name, password, role_level 
            FROM mst_users
            WHERE role_level IN ('hotel_admin', 'superadmin')
              AND status = 0
        `);

        if (admins.length === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'No admin users found in the system' 
            });
        }

        let isValidAdminPassword = false;
        let verifiedAdmin = null;

        for (const admin of admins) {
            const match = await bcrypt.compare(password, admin.password);
            if (match) {
                isValidAdminPassword = true;
                verifiedAdmin = admin;
                break;
            }
        }

        // If password doesn't match ANY admin, REJECT immediately
        // This works for ALL scenarios:
        // - Outlet User + Outlet User password = REJECT
        // - Hotel Admin + Outlet User password = REJECT  
        // - Any User + Wrong password = REJECT
        if (!isValidAdminPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password. Only Hotel Admin or Super Admin can perform this action.'
            });
        }

        // ========== SUCCESS: Admin password verified ==========
        // Log the verification details for audit trail
        console.log('🔐 === F8 BILL CREATOR VERIFICATION (ADMIN ONLY) ===');
        console.log('   Current Logged-in User (can be anyone):', {
            id: currentUser.userid,
            username: currentUser.username,
            name: currentUser.full_name,
            role: currentUser.role_level
        });
        console.log('   Verified Admin:', {
            id: verifiedAdmin.userid,
            username: verifiedAdmin.username,
            name: verifiedAdmin.full_name,
            role: verifiedAdmin.role_level
        });
        console.log('   Transaction ID:', txnId);
        console.log('   Bill Creator:', {
            id: billCreator.userid,
            username: billCreator.username,
            name: billCreator.full_name,
            role: billCreator.role_level
        });
        console.log('   Verification Time:', new Date().toISOString());
        console.log('   ---');

        // Return success with admin verification details
        return res.json({
            success: true,
            verified: true,
            message: 'Admin verified successfully for F8 action on billed table',
            verifiedBy: {
                id: verifiedAdmin.userid,
                username: verifiedAdmin.username,
                name: verifiedAdmin.full_name,
                role: verifiedAdmin.role_level
            },
            transaction: {
                id: transaction.TxnID,
                billCreator: {
                    id: billCreator.userid,
                    username: billCreator.username,
                    name: billCreator.full_name
                }
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
        const [rows] = await db.query(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `, [decoded.userid]);

        const user = rows[0];

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
        // console.error('Password verification error:', error);
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

        // Get current user's details (for logging only)
        const [currentUserRows] = await db.query(
            'SELECT userid, username, full_name, password, role_level, created_by_id FROM mst_users WHERE userid = ? AND status = 0',
            [decoded.userid]
        );

        const currentUserInfo = currentUserRows[0];

        if (!currentUserInfo) {
            return res.status(404).json({ success: false, message: 'Current user not found.' });
        }

        // ========== ONLY CHECK FOR ADMIN PASSWORDS ==========
        // Check if entered password belongs to ANY hotel_admin or superadmin
        const [admins] = await db.query(`
            SELECT userid, username, full_name, password, role_level 
            FROM mst_users
            WHERE role_level IN ('hotel_admin', 'superadmin')
              AND status = 0
        `);

        if (admins.length === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'No admin users found in the system' 
            });
        }

        let isValidAdminPassword = false;
        let verifiedAdmin = null;

        for (const admin of admins) {
            const match = await bcrypt.compare(password, admin.password);
            if (match) {
                isValidAdminPassword = true;
                verifiedAdmin = admin;
                break;
            }
        }

        // If password doesn't match ANY admin, REJECT immediately
        // This ensures outlet_user's own password will NOT work
        if (!isValidAdminPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password. Only Hotel Admin or Super Admin can perform this action.'
            });
        }

        // ========== SUCCESS: Admin password verified ==========
        // Log the verification details for audit trail
        console.log('🔐 === CREATOR PASSWORD VERIFICATION (ADMIN ONLY) ===');
        console.log('   Current User (who is performing action):', {
            id: currentUserInfo.userid,
            username: currentUserInfo.username,
            name: currentUserInfo.full_name,
            role: currentUserInfo.role_level,
            created_by: currentUserInfo.created_by_id
        });
        console.log('   Verified Admin:', {
            id: verifiedAdmin.userid,
            username: verifiedAdmin.username,
            name: verifiedAdmin.full_name,
            role: verifiedAdmin.role_level
        });
        console.log('   Verification Time:', new Date().toISOString());
        console.log('   ---');

        res.json({ 
            success: true, 
            message: 'Admin password verified successfully',
            verifiedBy: {
                id: verifiedAdmin.userid,
                username: verifiedAdmin.username,
                name: verifiedAdmin.full_name,
                role: verifiedAdmin.role_level
            }
        });

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
        const [existingRows] = await db.query(
            'SELECT userid FROM mst_users WHERE role_level = ?',
            ['superadmin']
        );

        if (existingRows.length === 0) {
            const hashedPassword = await bcrypt.hash('superadmin123', 10);

            const [result] = await db.query(`
                INSERT INTO mst_users (
                    username, email, password, full_name, role_level,
                    status, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                'superadmin',
                'superadmin@miracle.com',
                hashedPassword,
                'Super Administrator',
                'superadmin',
                1
            ]);

            const newUserId = result.insertId;

            // Create default permissions for SuperAdmin
            const defaultPermissions = {
                'orders': { view: 1, create: 1, edit: 1, delete: 1 },
                'customers': { view: 1, create: 1, edit: 1, delete: 1 },
                'menu': { view: 1, create: 1, edit: 1, delete: 1 },
                'reports': { view: 1, create: 1, edit: 1, delete: 1 },
                'users': { view: 1, create: 1, edit: 1, delete: 1 },
                'settings': { view: 1, create: 1, edit: 1, delete: 1 }
            };

            for (const [module, perms] of Object.entries(defaultPermissions)) {
                await db.query(`
                    INSERT INTO mst_user_permissions (
                        userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    newUserId,
                    module,
                    perms.view ? 1 : 0,
                    perms.create ? 1 : 0,
                    perms.edit ? 1 : 0,
                    perms.delete ? 1 : 0,
                    newUserId
                ]);
            }

            console.log('✅ Initial SuperAdmin created successfully');
            console.log('📧 Email: superadmin@miracle.com');
            console.log('🔑 Password: superadmin123');
        } else {
            // console.log('ℹ️ SuperAdmin already exists');
        }
    } catch (error) {
        // console.error('❌ Error creating SuperAdmin:', error);
    }
};