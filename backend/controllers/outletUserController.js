const db = require('../config/db');
const bcrypt = require('bcrypt');

// Get outlet users based on current user's role and hierarchy
exports.getOutletUsers = (req, res) => {
    try {
        const { currentUserId, roleLevel, hotelid, outletid } = req.query;
        
        let query = `
            SELECT u.*, 
                   h.hotel_name as hotel_name,
                   o.outlet_name
            FROM mst_users u
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN mst_outlets o ON uom.outletid = o.outletid
            WHERE u.status = 0 AND (u.role_level = 'outlet_user' OR u.role_level = 'hotel_admin')
        `;
        
        const params = [];
        
        switch(roleLevel) {
            case 'superadmin':
                break;          
            case 'hotel_admin':
                query += ' AND u.hotelid = ?';
                params.push(hotelid);
                break;
            default:
                return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        query += ' ORDER BY CASE WHEN u.role_level = \'hotel_admin\' THEN 0 ELSE 1 END, u.created_date DESC';
        
        const users = db.prepare(query).all(...params);
        res.json(users);
    } catch (error) {
        console.error('Error fetching outlet users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getOutletsForDropdown = (req, res) => {
    try {
        const { roleLevel, brandId, hotelid } = req.query;
        
        let query = `
            SELECT o.outletid, o.outlet_name, o.outlet_code, 
                   b.hotel_name as brand_name
            FROM mst_outlets o
            LEFT JOIN msthotelmasters b ON o.hotelid = b.hotelid
            WHERE o.status = 0
        `;
        
        const params = [];
        
        switch(roleLevel) {
            case 'superadmin':
                break;
            case 'brand_admin':
                query += ' AND o.brand_id = ?';
                params.push(brandId);
                break;
            case 'hotel_admin':
            case 'outlet_user':
                query += ' AND o.hotelid = ?';
                params.push(hotelid);
                break;
            default:
                return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        query += ' ORDER BY o.outlet_name';
        
        const outlets = db.prepare(query).all(...params);
        res.json(outlets);
    } catch (error) {
        console.error('Error fetching outlets for dropdown:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new outlet user
exports.createOutletUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            full_name,
            phone,
            outletids, // Changed from outletid to outletids (array)
            designation,
            user_type,
            shift_time,
            mac_address,
            assign_warehouse,
            language_preference,
            address,
            city,
            sub_locality,
            web_access,
            self_order,
            captain_app,
            kds_app,
            captain_old_kot_access,
            verify_mac_ip,            
            hotelid,
            parent_user_id,
            created_by_id
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !full_name || !outletids || !Array.isArray(outletids) || outletids.length === 0) {
            return res.status(400).json({ message: 'Required fields missing', missing: { username, email, password, full_name, outletids } });
        }

        // Check if username or email already exists
        const existingUser = db.prepare('SELECT userid FROM mst_users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate parent user
        const parentUser = db.prepare('SELECT role_level, hotelid FROM mst_users WHERE userid = ?').get(parent_user_id);
        if (!parentUser) {
            return res.status(400).json({ message: 'Invalid parent user', parent_user_id });
        }

        // Validate outlet IDs
        const outletIds = outletids.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (outletIds.length === 0) {
            return res.status(400).json({ message: 'No valid outlet IDs provided', outletids });
        }

        // Validate outlets exist and are active
        const outlets = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid IN (' + outletIds.map(() => '?').join(',') + ') AND status = 0').all(...outletIds);
        if (outlets.length !== outletIds.length) {
            const foundOutletIds = outlets.map(outlet => outlet.outletid);
            const invalidOutletIds = outletIds.filter(id => !foundOutletIds.includes(id));
            console.error('Invalid or inactive outlet IDs:', invalidOutletIds);
            return res.status(400).json({ message: 'One or more outlet IDs are invalid or inactive', invalidOutletIds });
        }

        // Ensure all outlets belong to the same hotel
        const hotelIds = [...new Set(outlets.map(outlet => outlet.hotelid))];
        if (hotelIds.length > 1) {
            return res.status(400).json({ message: 'Selected outlets must belong to the same hotel', hotelIds });
        }

        const finalHotelId = hotelid || parentUser.hotelid;

        // Verify all outlets belong to the provided or parent hotel
        if (!outlets.every(outlet => outlet.hotelid === finalHotelId)) {
            return res.status(400).json({ message: 'Selected outlets do not belong to the specified hotel', finalHotelId, outletHotelIds: outlets.map(o => o.hotelid) });
        }

        // Insert user into mst_users
        const stmt = db.prepare(`
            INSERT INTO mst_users (
                username, email, password, full_name, phone, role_level,
                parent_user_id, hotelid, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        const result = stmt.run(
            username, email, hashedPassword, full_name, phone, 'outlet_user',
            parent_user_id, finalHotelId, created_by_id
        );

        const userid = result.lastInsertRowid;

        // Insert outlet mappings into user_outlet_mapping
        const insertMapping = db.prepare(`
            INSERT INTO user_outlet_mapping (userid, hotelid, outletid)
            VALUES (?, ?, ?)
        `);
        for (const outletid of outletids) {
            insertMapping.run(userid, finalHotelId, outletid);
        }

        res.json({
            userid,
            username,
            email,
            full_name,
            role_level: 'outlet_user',
            outletids,
            hotelid: finalHotelId
        });

    } catch (error) {
        console.error('Error creating outlet user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update outlet user
exports.updateOutletUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const {
            full_name,
            phone,
            outletids, // Changed from outletid to outletids (array)
            designation,
            user_type,
            shift_time,
            mac_address,
            assign_warehouse,
            language_preference,
            address,
            city,
            sub_locality,
            web_access,
            self_order,
            captain_app,
            kds_app,
            captain_old_kot_access,
            verify_mac_ip,
            status,
            updated_by_id
        } = req.body;

        console.log('Update outlet user request:', { userid, body: req.body });

        const existingUser = db.prepare('SELECT role_level FROM mst_users WHERE userid = ?').get(userid);
        if (!existingUser || existingUser.role_level !== 'outlet_user') {
            return res.status(404).json({ message: 'Outlet user not found' });
        }

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
        if (designation !== undefined) {
            updateFields.push('designation = ?');
            params.push(designation);
        }
        if (user_type !== undefined) {
            updateFields.push('user_type = ?');
            params.push(user_type);
        }
        if (shift_time !== undefined) {
            updateFields.push('shift_time = ?');
            params.push(shift_time);
        }
        if (mac_address !== undefined) {
            updateFields.push('mac_address = ?');
            params.push(mac_address);
        }
        if (assign_warehouse !== undefined) {
            updateFields.push('assign_warehouse = ?');
            params.push(assign_warehouse);
        }
        if (language_preference !== undefined) {
            updateFields.push('language_preference = ?');
            params.push(language_preference);
        }
        if (address !== undefined) {
            updateFields.push('address = ?');
            params.push(address);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            params.push(city);
        }
        if (sub_locality !== undefined) {
            updateFields.push('sub_locality = ?');
            params.push(sub_locality);
        }
        if (web_access !== undefined) {
            updateFields.push('web_access = ?');
            params.push(web_access);
        }
        if (self_order !== undefined) {
            updateFields.push('self_order = ?');
            params.push(self_order);
        }
        if (captain_app !== undefined) {
            updateFields.push('captain_app = ?');
            params.push(captain_app);
        }
        if (kds_app !== undefined) {
            updateFields.push('kds_app = ?');
            params.push(kds_app);
        }
        if (captain_old_kot_access !== undefined) {
            updateFields.push('captain_old_kot_access = ?');
            params.push(captain_old_kot_access);
        }
        if (verify_mac_ip !== undefined) {
            updateFields.push('verify_mac_ip = ?');
            params.push(verify_mac_ip);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }

        updateFields.push('updated_by_id = ?');
        updateFields.push('updated_date = datetime(\'now\')');
        params.push(updated_by_id || 1, userid);

        if (updateFields.length > 2) { // Only update if there are fields to update (excluding updated_by_id and updated_date)
            console.log('Update query:', `UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`);
            console.log('Update params:', params);
            const stmt = db.prepare(`UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`);
            stmt.run(...params);
        }

        // Update outlet mappings if outletids provided
        if (outletids && Array.isArray(outletids)) {
            const outletIds = outletids.map(id => parseInt(id)).filter(id => !isNaN(id));
            if (outletIds.length === 0) {
                return res.status(400).json({ message: 'No valid outlet IDs provided' });
            }

            const outlets = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid IN (' + outletIds.map(() => '?').join(',') + ') AND status = 0').all(...outletIds);
            if (outlets.length !== outletIds.length) {
                const foundOutletIds = outlets.map(outlet => outlet.outletid);
                const invalidOutletIds = outletIds.filter(id => !foundOutletIds.includes(id));
                console.error('Invalid or inactive outlet IDs:', invalidOutletIds);
                return res.status(400).json({ message: 'One or more outlet IDs are invalid or inactive', invalidOutletIds });
            }

            const hotelIds = [...new Set(outlets.map(outlet => outlet.hotelid))];
            if (hotelIds.length > 1) {
                return res.status(400).json({ message: 'Selected outlets must belong to the same hotel', hotelIds });
            }

            const user = db.prepare('SELECT hotelid FROM mst_users WHERE userid = ?').get(userid);
            const finalHotelId = user.hotelid;

            if (!outlets.every(outlet => outlet.hotelid === finalHotelId)) {
                return res.status(400).json({ message: 'Selected outlets do not belong to the user\'s hotel', finalHotelId, outletHotelIds: outlets.map(o => o.hotelid) });
            }

            // Delete existing mappings
            db.prepare('DELETE FROM user_outlet_mapping WHERE userid = ?').run(userid);

            // Insert new mappings
            const insertMapping = db.prepare(`
                INSERT INTO user_outlet_mapping (userid, hotelid, outletid)
                VALUES (?, ?, ?)
            `);
            for (const outletid of outletIds) {
                insertMapping.run(userid, finalHotelId, outletid);
            }
        }

        res.json({ message: 'Outlet user updated successfully' });

    } catch (error) {
        console.error('Error updating outlet user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete outlet user (soft delete)
exports.deleteOutletUser = (req, res) => {
    try {
        const { userid } = req.params;
        const { updated_by_id } = req.body;

        const stmt = db.prepare('UPDATE mst_users SET status = 0, updated_by_id = ?, updated_date = datetime(\'now\') WHERE userid = ?');
        stmt.run(updated_by_id, userid);

        res.json({ message: 'Outlet user deleted successfully' });

    } catch (error) {
        console.error('Error deleting outlet user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get outlet user by ID
exports.getOutletUserById = (req, res) => {
    try {
        const { id } = req.params;
        const user = db.prepare(`
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name,
                   GROUP_CONCAT(o.outlet_name) as outlet_name,
                   GROUP_CONCAT(uom.outletid) as outletids
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN mst_outlets o ON uom.outletid = o.outletid
            WHERE u.userid = ? AND u.role_level = 'outlet_user'
            GROUP BY u.userid
        `).get(id);
        
        if (!user) {
            return res.status(404).json({ error: 'Outlet user not found' });
        }
        
        // Convert outletids to array of numbers
        user.outletids = user.outletids ? user.outletids.split(',').map(Number) : [];
        res.json(user);
    } catch (error) {
        console.error('Error fetching outlet user:', error);
        res.status(500).json({ error: 'Failed to fetch outlet user' });
    }
};

// Get designations for dropdown
exports.getDesignations = (req, res) => {
    try {
        const designations = db.prepare('SELECT designationid, Designation FROM mstdesignation WHERE status = 0 ORDER BY Designation').all();
        res.json(designations);
    } catch (error) {
        console.error('Error fetching designations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user types for dropdown
exports.getUserTypes = (req, res) => {
    try {
        const userTypes = db.prepare('SELECT usertypeid, User_type FROM mstuserType WHERE status = 0 ORDER BY User_type').all();
        res.json(userTypes);
    } catch (error) {
        console.error('Error fetching user types:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get hotel admins specifically
exports.getHotelAdmins = (req, res) => {
    try {
        const { currentUserId, roleLevel, brandId, hotelId } = req.query;
        
        let query = `
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            WHERE u.status = 0 AND u.role_level = 'hotel_admin'
        `;
        
        const params = [];
        
        switch(roleLevel) {
            case 'superadmin':
                break;
            case 'brand_admin':
                query += ' AND u.brand_id = ?';
                params.push(brandId);
                break;
            case 'hotel_admin':
                query += ' AND u.hotelid = ?';
                params.push(hotelId);
                break;
            default:
                return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        query += ' ORDER BY u.created_date DESC';
        
        const hotelAdmins = db.prepare(query).all(...params);
        res.json(hotelAdmins);
    } catch (error) {
        console.error('Error fetching hotel admins:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get hotel admin by ID
exports.getHotelAdminById = (req, res) => {
    try {
        const { id } = req.params;
        const hotelAdmin = db.prepare(`
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            WHERE u.userid = ? AND u.role_level = 'hotel_admin' AND u.status = 0
        `).get(id);
        
        if (!hotelAdmin) {
            return res.status(404).json({ error: 'Hotel admin not found' });
        }
        
        res.json(hotelAdmin);
    } catch (error) {
        console.error('Error fetching hotel admin:', error);
        res.status(500).json({ error: 'Failed to fetch hotel admin' });
    }
};

// Update hotel admin
exports.updateHotelAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name,
            phone,
            status,
            updated_by_id
        } = req.body;

        const existingUser = db.prepare('SELECT role_level FROM mst_users WHERE userid = ?').get(id);
        if (!existingUser || existingUser.role_level !== 'hotel_admin') {
            return res.status(404).json({ message: 'Hotel admin not found' });
        }

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
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }

        updateFields.push('updated_by_id = ?');
        updateFields.push('updated_date = datetime(\'now\')');
        params.push(updated_by_id, id);

        const stmt = db.prepare(`UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`);
        stmt.run(...params);

        res.json({ message: 'Hotel admin updated successfully' });

    } catch (error) {
        console.error('Error updating hotel admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.AllOutletsForHotelUser = (req, res) => {
    try {
        const { currentUserId, roleLevel, hotelid, outletid } = req.query;
        
        let query = `
            SELECT u.*, 
                   h.hotel_name as hotel_name,
                   o.outlet_name
            FROM mst_users u
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            LEFT JOIN user_outlet_mapping uom ON u.userid = uom.userid
            LEFT JOIN mst_outlets o ON uom.outletid = o.outletid
            WHERE u.status = 0 AND (u.role_level = 'outlet_user' OR u.role_level = 'hotel_admin')
        `;
        
        const params = [];
        
        switch(roleLevel) {
            case 'superadmin':
                break;          
            case 'hotel_admin':
                query += ' AND u.hotelid = ?';
                params.push(hotelid);
                break;
                case 'outlet_user':
                query += ' AND u.hotelid = ?';
                params.push(hotelid);
                break;
            default:
                return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        query += ' ORDER BY CASE WHEN u.role_level = \'hotel_admin\' THEN 0 ELSE 1 END, u.created_date DESC';
        
        const users = db.prepare(query).all(...params);
        res.json(users);
    } catch (error) {
        console.error('Error fetching outlet users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};