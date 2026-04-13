const db = require('../config/db');
const bcrypt = require('bcrypt');

const logPrefix = (action) => `[USER_CREATE ${new Date().toISOString()}] ${action}`;

// Get all users based on current user's role and hierarchy
exports.getUsers = (req, res) => {
    try {
        const { currentUserId, roleLevel, brandId, hotelid } = req.query;
        
        let query = `
            SELECT u.*,
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            WHERE u.status = 1
        `;
        
        const params = [];
        
        // Filter based on role hierarchy
        switch(roleLevel) {
            case 'superadmin':
                // SuperAdmin can see all users
                break;
            case 'brand_admin':
                // Brand Admin can see users under their brand
                query += ' AND u.brand_id = ?';
                params.push(brandId);
                break;
            case 'hotel_admin':
                // Hotel Admin can see users under their hotel
                query += ' AND u.hotelid = ?';
                params.push(hotelid);
                break;
            default:
                return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        query += ' ORDER BY u.created_date DESC';
        
        // MySQL: Changed from db.prepare().all() to db.query() for MySQL
        // MySQL: Using callback or promise-based approach
        db.query(query, params, (err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json(users);
        });
    } catch (error) {
        // console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    // console.log(logPrefix('START'), 'req.body:', JSON.stringify(req.body, null, 2));
    // console.log(logPrefix('START'), 'req.headers:', req.headers);
    // console.log(logPrefix('START'), 'req.userid:', req.userid);

    const connection = await db.getConnection();

    try {
        const {
            username,
            email,
            password,
            full_name,
            phone,
            role_level,
            brand_id,
            hotelid,
            parent_user_id,
            created_by_id
        } = req.body;

        if (!username || !email || !password || !full_name || !role_level) {
            // console.log(logPrefix('VALIDATION_FAIL'), 'Missing required fields');
            return res.status(400).json({ message: 'Required fields missing' });
        }

        // console.log(logPrefix('VALIDATION_PASS'), 'Basic fields OK');

        await connection.beginTransaction();

        // console.log(logPrefix('DB_CHECK'), 'Checking existing user for username:', username, 'email:', email);
        const [existingUser] = await connection.query(
            'SELECT userid FROM mst_users WHERE username = ? OR email = ?',
            [username, email]
        );
        // console.log(logPrefix('DB_CHECK'), 'Existing users found:', existingUser.length > 0 ? existingUser.map(u => u.userid) : 'none');

        if (existingUser.length > 0) {
            await connection.rollback();
            // console.log(logPrefix('VALIDATION_FAIL'), 'Duplicate username/email');
            return res.status(400).json({ message: 'Username or email already exists' });
        }

// ✅ Validate hotel (hotel_admin)
        // console.log(logPrefix('ROLE_CHECK'), 'role_level:', role_level, 'hotelid:', hotelid);
        if (role_level === 'hotel_admin' && hotelid) {
            // console.log(logPrefix('DB_CHECK'), 'Validating hotelid:', hotelid);
            const [hotelExists] = await connection.query(
                'SELECT hotelid FROM msthotelmasters WHERE hotelid = ?',
                [hotelid]
            );
            // console.log(logPrefix('DB_CHECK'), 'Hotel exists:', hotelExists.length > 0);

            if (hotelExists.length === 0) {
                await connection.rollback();
                console.log(logPrefix('VALIDATION_FAIL'), 'Hotel not found');
                return res.status(400).json({ message: 'Hotel not found with the provided ID' });
            }
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Parent user
        const [parentRows] = await connection.query(
            'SELECT role_level, brand_id, hotelid FROM mst_users WHERE userid = ?',
            [parent_user_id]
        );

        const parentUser = parentRows[0];

        if (!parentUser) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid parent user' });
        }

        const finalCreatedById = parent_user_id;

        // ✅ Role hierarchy
        const canCreateRole = validateRoleHierarchy(parentUser.role_level, role_level);
        if (!canCreateRole) {
            await connection.rollback();
            return res.status(403).json({ message: 'Cannot create user with this role level' });
        }

        let finalBrandId = brand_id;
        let finalHotelId = hotelid;

        // ✅ brand_admin
        if (role_level === 'brand_admin') {
            if (!brand_id) {
                await connection.rollback();
                return res.status(400).json({ message: 'Brand ID is required for brand_admin role' });
            }

            const [brandExists] = await connection.query(
                'SELECT hotelid FROM msthotelmasters WHERE hotelid = ?',
                [brand_id]
            );

            if (brandExists.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'Brand/Hotel not found with the provided ID' });
            }

            finalBrandId = brand_id;
            finalHotelId = null;
        }

        // ✅ hotel roles
        else if (role_level === 'hotel_admin' || role_level === 'hotel_user') {
            finalBrandId = hotelid || parentUser.hotelid;
            finalHotelId = hotelid || parentUser.hotelid;

            if (finalHotelId) {
                const [hotelExists] = await connection.query(
                    'SELECT hotelid FROM msthotelmasters WHERE hotelid = ?',
                    [finalHotelId]
                );

                if (hotelExists.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'Hotel not found with the provided ID' });
                }
            }
        }

        // ✅ INSERT
        // MySQL: Changed datetime('now') to NOW() for MySQL
        const [result] = await connection.query(`
            INSERT INTO mst_users (
                username, email, password, full_name, phone, role_level,
                parent_user_id, hotelid, brand_id, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            username,
            email,
            hashedPassword,
            full_name,
            phone,
            role_level,
            parent_user_id,
            finalHotelId,
            finalBrandId,
            finalCreatedById
        ]);

        const userId = result.insertId;

        // ✅ Permissions
        try {
            await createDefaultPermissions(userId, role_level, finalCreatedById);
        } catch (permError) {
            console.error('Permission error:', permError);
        }

        await connection.commit();

        res.json({
            userid: userId,
            username,
            email,
            full_name,
            role_level,
            brand_id: finalBrandId,
            hotelid: finalHotelId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const {
            full_name,
            phone,
            role_level,
            is_active,
            updated_by_id
        } = req.body;

        const updateFields = [];
        const params = [];

        if (full_name) {
            updateFields.push('full_name = ?');
            params.push(full_name);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            params.push(phone);
        }
        if (role_level) {
            updateFields.push('role_level = ?');
            params.push(role_level);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            params.push(is_active);
        }

        updateFields.push('updated_by_id = ?');
        // MySQL: Changed datetime('now') to NOW() for MySQL
        updateFields.push('updated_date = NOW()');
        params.push(updated_by_id, userid);

        // MySQL: Changed from db.prepare().run() to db.query() for MySQL
        const query = `UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`;
        await db.query(query, params);

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const { updated_by_id } = req.body;

        // MySQL: Changed from db.prepare().run() to db.query() for MySQL
        // MySQL: Changed datetime('now') to NOW() for MySQL
        const query = 'UPDATE mst_users SET is_active = 0, updated_by_id = ?, updated_date = NOW() WHERE userid = ?';
        await db.query(query, [updated_by_id, userid]);

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user permissions
exports.getUserPermissions = (req, res) => {
    try {
        const { userid } = req.params;
        
        // MySQL: Changed from db.prepare().all() to db.query() for MySQL
        const query = `
            SELECT module_name, can_view, can_create, can_edit, can_delete
            FROM mst_user_permissions
            WHERE userid = ?
        `;
        
        db.query(query, [userid], (err, permissions) => {
            if (err) {
                console.error('Error fetching user permissions:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json(permissions);
        });

    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user permissions
exports.updateUserPermissions = async (req, res) => {
    try {
        const { userid } = req.params;
        const { permissions, updated_by_id } = req.body;

        // MySQL: Changed from db.prepare().run() to db.query() for MySQL
        // Delete existing permissions
        await db.query('DELETE FROM mst_user_permissions WHERE userid = ?', [userid]);

        // MySQL: Changed datetime('now') to NOW() for MySQL
        // Insert new permissions
        const insertQuery = `
            INSERT INTO mst_user_permissions (
                userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        for (const permission of permissions) {
            await db.query(insertQuery, [
                userid,
                permission.module_name,
                permission.can_view ? 1 : 0,
                permission.can_create ? 1 : 0,
                permission.can_edit ? 1 : 0,
                permission.can_delete ? 1 : 0,
                updated_by_id
            ]);
        }

        res.json({ message: 'Permissions updated successfully' });

    } catch (error) {
        console.error('Error updating user permissions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper function to validate role hierarchy
function validateRoleHierarchy(parentRole, childRole) {
    const roleHierarchy = {
        'superadmin': ['brand_admin', 'hotel_admin', 'hotel_user'],
        'brand_admin': ['hotel_admin', 'hotel_user'],
        'hotel_admin': ['hotel_user'],
        'hotel_user': []
    };

    return roleHierarchy[parentRole]?.includes(childRole) || false;
}

// Helper function to create default permissions
function createDefaultPermissions(userid, roleLevel, createdBy) {
    const defaultPermissions = {
        'superadmin': {
            'orders': { view: 1, create: 1, edit: 1, delete: 1 },
            'customers': { view: 1, create: 1, edit: 1, delete: 1 },
            'menu': { view: 1, create: 1, edit: 1, delete: 1 },
            'reports': { view: 1, create: 1, edit: 1, delete: 1 },
            'users': { view: 1, create: 1, edit: 1, delete: 1 },
            'settings': { view: 1, create: 1, edit: 1, delete: 1 }
        },
        'brand_admin': {
            'orders': { view: 1, create: 1, edit: 1, delete: 0 },
            'customers': { view: 1, create: 1, edit: 1, delete: 0 },
            'menu': { view: 1, create: 1, edit: 1, delete: 0 },
            'reports': { view: 1, create: 0, edit: 0, delete: 0 },
            'users': { view: 1, create: 1, edit: 1, delete: 0 },
            'settings': { view: 1, create: 0, edit: 1, delete: 0 }
        },
        'hotel_admin': {
            'orders': { view: 1, create: 1, edit: 1, delete: 0 },
            'customers': { view: 1, create: 1, edit: 1, delete: 0 },
            'menu': { view: 1, create: 1, edit: 1, delete: 0 },
            'reports': { view: 1, create: 0, edit: 0, delete: 0 },
            'users': { view: 1, create: 1, edit: 1, delete: 0 },
            'settings': { view: 1, create: 0, edit: 1, delete: 0 }
        },
        'hotel_user': {
            'orders': { view: 1, create: 1, edit: 0, delete: 0 },
            'customers': { view: 1, create: 1, edit: 0, delete: 0 },
            'menu': { view: 1, create: 0, edit: 0, delete: 0 },
            'reports': { view: 1, create: 0, edit: 0, delete: 0 },
            'users': { view: 0, create: 0, edit: 0, delete: 0 },
            'settings': { view: 0, create: 0, edit: 0, delete: 0 }
        }
    };

    const permissions = defaultPermissions[roleLevel] || {};
    // MySQL: Changed from db.prepare() to direct query
    // MySQL: Changed datetime('now') to NOW() for MySQL
    const insertQuery = `
        INSERT INTO mst_user_permissions (
            userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    Object.entries(permissions).forEach(([module, perms]) => {
        db.query(insertQuery, [
            userid,
            module,
            perms.view ? 1 : 0,
            perms.create ? 1 : 0,
            perms.edit ? 1 : 0,
            perms.delete ? 1 : 0,
            createdBy
        ]).catch(err => console.error('Error inserting permission:', err));
    });
}