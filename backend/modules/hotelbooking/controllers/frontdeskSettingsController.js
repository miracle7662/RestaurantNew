const db = require('../../../config/db');

// Create new frontdesk setting
exports.createSetting = async (req, res) => {
    try {
        const {
            hotelid,
            outletid,
            checkout_time_setting,
            fixed_checkout_time,
            created_by_id
        } = req.body;

        // Validation
        if (!hotelid || !outletid || !checkout_time_setting) {
            return res.status(400).json({
                success: false,
                message: 'hotelid, outletid, and checkout_time_setting are required'
            });
        }

        // Check if setting already exists for this hotel and outlet
        const [existing] = await db.query(
            'SELECT frontdesk_setting_id FROM ldg_frontdesk_settings WHERE hotelid = ? AND outletid = ?',
            [hotelid, outletid]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Setting already exists for this hotel and outlet'
            });
        }

        const [result] = await db.query(
            `INSERT INTO ldg_frontdesk_settings 
             (hotelid, outletid, checkout_time_setting, fixed_checkout_time, created_by_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [hotelid, outletid, checkout_time_setting, fixed_checkout_time || null, created_by_id || null]
        );

        const [newSetting] = await db.query(
            'SELECT * FROM ldg_frontdesk_settings WHERE frontdesk_setting_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Frontdesk setting created successfully',
            data: newSetting[0]
        });

    } catch (error) {
        console.error('Error creating frontdesk setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating frontdesk setting',
            error: error.message
        });
    }
};

// Get all settings with optional filters
exports.getAllSettings = async (req, res) => {
    try {
        const { hotelid, outletid } = req.query;
        let query = 'SELECT * FROM ldg_frontdesk_settings';
        const params = [];

        if (hotelid || outletid) {
            const conditions = [];
            if (hotelid) {
                conditions.push('hotelid = ?');
                params.push(hotelid);
            }
            if (outletid) {
                conditions.push('outletid = ?');
                params.push(outletid);
            }
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_date DESC';

        const [settings] = await db.query(query, params);

        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
};

// Get setting by ID

exports.getSettingByOutlet = async (req, res) => {
    try {
        const { outletid } = req.params;
        
        if (!outletid) {
            return res.status(400).json({
                success: false,
                message: 'outletid is required'
            });
        }

        const [settings] = await db.query(
            'SELECT * FROM ldg_frontdesk_settings WHERE outletid = ?',
            [outletid]
        );

        if (settings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No setting found for this outlet'
            });
        }

        res.status(200).json({
            success: true,
            data: settings[0]
        });

    } catch (error) {
        console.error('Error fetching setting by outlet:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching setting',
            error: error.message
        });
    }
};


// Update setting
exports.updateSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            checkout_time_setting,
            fixed_checkout_time,
            updated_by_id
        } = req.body;

        // Check if setting exists
        const [existing] = await db.query(
            'SELECT * FROM ldg_frontdesk_settings WHERE frontdesk_setting_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (checkout_time_setting) {
            updates.push('checkout_time_setting = ?');
            params.push(checkout_time_setting);
        }

        if (fixed_checkout_time !== undefined) {
            updates.push('fixed_checkout_time = ?');
            params.push(fixed_checkout_time);
        }

        if (updated_by_id) {
            updates.push('updated_by_id = ?');
            params.push(updated_by_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);
        const query = `UPDATE ldg_frontdesk_settings SET ${updates.join(', ')} WHERE frontdesk_setting_id = ?`;

        await db.query(query, params);

        const [updated] = await db.query(
            'SELECT * FROM ldg_frontdesk_settings WHERE frontdesk_setting_id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Setting updated successfully',
            data: updated[0]
        });

    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating setting',
            error: error.message
        });
    }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if setting exists
        const [existing] = await db.query(
            'SELECT * FROM ldg_frontdesk_settings WHERE frontdesk_setting_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        await db.query(
            'DELETE FROM ldg_frontdesk_settings WHERE frontdesk_setting_id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Setting deleted successfully',
            data: existing[0]
        });

    } catch (error) {
        console.error('Error deleting setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting setting',
            error: error.message
        });
    }
};