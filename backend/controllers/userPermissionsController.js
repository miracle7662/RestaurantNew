const db = require('../config/db');

exports.getUserPermissions = async (req, res) => {
    try {
        const { userid } = req.params;

        const [rows] = await db.query(`
            SELECT
                permissionid,
                userid,
                module_name,
                can_view,
                can_create,
                can_edit,
                can_delete,
                hotel_type,
                created_by_id,
                created_date
            FROM mst_user_permissions
            WHERE userid = ?
            ORDER BY permissionid
        `, [userid]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Get User Permissions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};