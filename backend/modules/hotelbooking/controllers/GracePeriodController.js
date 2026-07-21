const db = require('../../../config/db');

/**
 * Get Grace Period Settings
 */
exports.getGracePeriodSettings = async (req, res) => {
    try {
        const { hotelid } = req.params;

        if (!hotelid) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID is required."
            });
        }

        const [rows] = await db.execute(
            `SELECT
                grace_period_id,
                hotelid,
                grace_before,
                grace_after,
                created_by,
                updated_by,
                created_at,
                updated_at
            FROM ldg_grace_period_settings
            WHERE hotelid = ?`,
            [hotelid]
        );

        // Return default values if no settings found
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Default grace period settings.",
                data: {
                    grace_period_id: null,
                    hotelid: Number(hotelid),
                    grace_before: 30,
                    grace_after: 30
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Grace period settings fetched successfully.",
            data: rows[0]
        });

    } catch (error) {
        console.error("❌ Error fetching grace period settings:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch grace period settings.",
            error: error.message
        });
    }
};


/**
 * Save / Update Grace Period Settings
 */
exports.saveGracePeriodSettings = async (req, res) => {
    try {
        const {
            hotelid,
            grace_before,
            grace_after,
            userid
        } = req.body;

        if (!hotelid) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID is required."
            });
        }

        if (grace_before == null || grace_after == null) {
            return res.status(400).json({
                success: false,
                message: "Grace periods are required."
            });
        }

        await db.execute(
            `INSERT INTO ldg_grace_period_settings
            (
                hotelid,
                grace_before,
                grace_after,
                created_by,
                updated_by
            )
            VALUES (?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
                grace_before = VALUES(grace_before),
                grace_after = VALUES(grace_after),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP`,
            [
                hotelid,
                grace_before,
                grace_after,
                userid,
                userid
            ]
        );

        const [rows] = await db.execute(
            `SELECT
                grace_period_id,
                hotelid,
                grace_before,
                grace_after,
                created_by,
                updated_by,
                created_at,
                updated_at
            FROM ldg_grace_period_settings
            WHERE hotelid = ?`,
            [hotelid]
        );

        return res.status(200).json({
            success: true,
            message: "Grace period settings saved successfully.",
            data: rows[0]
        });

    } catch (error) {
        console.error("❌ Error saving grace period settings:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save grace period settings.",
            error: error.message
        });
    }
};