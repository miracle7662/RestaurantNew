const db = require('../config/db');

exports.getUserPermissions = async (req, res) => {
    try {
        const { userid } = req.params;

        const [rows] = await db.query(`
      SELECT
    mup.permissionid,
    mup.userid,
    mup.module_name,
    mup.can_view,
    mup.can_create,
    mup.can_edit,
    mup.can_delete,
    mup.created_by_id,
    mup.created_date
FROM mst_user_permissions mup
LEFT JOIN mst_users mu ON mu.userid = mup.userid
WHERE mu.userid = ?
ORDER BY mup.permissionid;
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