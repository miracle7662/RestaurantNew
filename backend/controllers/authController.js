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

        // Verify JWT token to get current user
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get current user details (for logging purposes)
        const [currentUserRows] = await db.query(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `, [decoded.userid]);

        const currentUser = currentUserRows[0];

        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Current user not found' });
        }

        // Find the transaction and get the UserId (which is the creator)
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

        // Get the bill creator's details
        const [billCreatorRows] = await db.query(`
            SELECT u.*, b.hotel_name as brand_name, h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN msthotelmasters h ON uom.outletid = h.hotelid
            WHERE u.userid = ? AND u.status = 0
        `, [transaction.UserId]);

        const billCreator = billCreatorRows[0];

        if (!billCreator) {
            return res.status(404).json({ success: false, message: 'Bill creator not found' });
        }

        // If the current user is an admin, try their password first.
        if (currentUser.role_level === 'hotel_admin' || currentUser.role_level === 'superadmin') {
            const isAdminPasswordValid = await bcrypt.compare(password, currentUser.password);
            if (isAdminPasswordValid) {
                return res.json({ success: true, message: 'Admin password verified successfully.' });
            }
        }

        // If the current user is not an admin or their password was incorrect,
        // check the password of the user who created the bill.
        const isValidPassword = await bcrypt.compare(password, billCreator.password);
        if (!isValidPassword) {
            // If that fails, check the password of the admin who created the bill creator.
            if (billCreator.created_by_id) {
                const [creatorAdminRows] = await db.query(
                    'SELECT password FROM mst_users WHERE userid = ?',
                    [billCreator.created_by_id]
                );
                const creatorAdmin = creatorAdminRows[0];
                if (creatorAdmin) {
                    const isCreatorAdminPasswordValid = await bcrypt.compare(password, creatorAdmin.password);
                    if (isCreatorAdminPasswordValid) {
                        return res.json({ success: true, message: 'Creator admin password verified successfully.' });
                    }
                }
            }
            return res.status(401).json({ success: false, message: 'Invalid Password' });
        }

        // console.log('🔐 Bill Creator Password Verification:');
        // console.log('   Current User ID:', currentUser.userid);
        // console.log('   Current Username:', currentUser.username);
        // console.log('   Bill Creator ID:', billCreator.userid);
        // console.log('   Bill Creator Username:', billCreator.username);
        // console.log('   Transaction ID:', txnId);
        // console.log('   Verification Time:', new Date().toISOString());
        // console.log('   ---');

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
        // console.error('Bill creator password verification error:', error);
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

        // Get current user's full details
        const [currentUserRows] = await db.query(
            'SELECT userid, password, role_level, created_by_id FROM mst_users WHERE userid = ?',
            [decoded.userid]
        );

        const currentUserInfo = currentUserRows[0];

        if (!currentUserInfo) {
            return res.status(404).json({ success: false, message: 'Current user not found.' });
        }

        // 1. First, try to verify against the current user's own password.
        // This allows any user (including outlet users) to use their own password.
        const isCurrentUserPasswordValid = await bcrypt.compare(password, currentUserInfo.password);
        if (isCurrentUserPasswordValid) {
            return res.json({ success: true, message: 'Password verified successfully.' });
        }

        // 2. If the current user's password fails, and they are an admin, we can stop here
        // because we already checked their password. If they aren't an admin, we proceed
        // to check their creator's password as a fallback.
        if (currentUserInfo.role_level === 'hotel_admin' || currentUserInfo.role_level === 'superadmin') {
            return res.status(401).json({ success: false, message: 'Invalid Password' });
        }

        // 3. As a fallback for non-admin users, check the creator's password.
        if (!currentUserInfo.created_by_id) {
            return res.status(404).json({ success: false, message: 'Creator (Hotel Admin) not found for this user.' });
        }

        // Get the creator's (Hotel Admin's) details, specifically the password hash
        const [creatorRows] = await db.query(
            "SELECT password, role_level FROM mst_users WHERE userid = ? AND role_level IN ('hotel_admin', 'brand_admin', 'superadmin')",
            [currentUserInfo.created_by_id]
        );

        const creator = creatorRows[0];

        if (!creator) {
            return res.status(404).json({ success: false, message: 'Creator user record not found or is not an authorized admin.' });
        }

        // Verify the provided password against the creator's hashed password
        const isValidPassword = await bcrypt.compare(password, creator.password);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid user or admin password' });
        }

        // If password is valid
        res.json({ success: true, message: 'Admin password verified successfully' });

    } catch (error) {
        // console.error('Creator password verification error:', error);
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
                'orders':    { view: 1, create: 1, edit: 1, delete: 1 },
                'customers': { view: 1, create: 1, edit: 1, delete: 1 },
                'menu':      { view: 1, create: 1, edit: 1, delete: 1 },
                'reports':   { view: 1, create: 1, edit: 1, delete: 1 },
                'users':     { view: 1, create: 1, edit: 1, delete: 1 },
                'settings':  { view: 1, create: 1, edit: 1, delete: 1 }
            };

            for (const [module, perms] of Object.entries(defaultPermissions)) {
                await db.query(`
                    INSERT INTO mst_user_permissions (
                        userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    newUserId,
                    module,
                    perms.view    ? 1 : 0,
                    perms.create  ? 1 : 0,
                    perms.edit    ? 1 : 0,
                    perms.delete  ? 1 : 0,
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