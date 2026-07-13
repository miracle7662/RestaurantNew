// controllers/blockController.js
const db = require('../../../config/db');


// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => {
    return req.user?.id || null;
};

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => {
    return req.user?.hotelid || null;
};

// Helper to convert MySQL datetime to ISO string
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
};

exports.getBlocks = async (req, res) => {
    try {
        // Accept hotelid from query param – fallback to user's hotel ID
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }
        // If still no hotelId, try to get from request body (for consistency)
        if (!hotelId && req.body && req.body.hotelid) {
            hotelId = req.body.hotelid;
        }
        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const [blocks] = await db.execute(
            `SELECT 
                block_id, 
                block_name, 
                display_name, 
                hotelid,
                status, 
                created_date, 
                updated_date, 
                created_by_id, 
                updated_by_id
            FROM blockmaster
            WHERE hotelid = ?
            ORDER BY block_name ASC`,
            [hotelId]
        );

        // Format dates for response
        const formattedBlocks = blocks.map(block => ({
            ...block,
            created_date: formatDate(block.created_date),
            updated_date: formatDate(block.updated_date)
        }));

        res.json({
            success: true,
            message: "Data fetched successfully",
            data: formattedBlocks
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
};

exports.addBlock = async (req, res) => {
    try {
        const { block_name, display_name, status, hotelid, created_by_id } = req.body;
        const userId = getCurrentUserId(req);
        // Accept hotelid from request body, fallback to user's hotel ID
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const created_date = new Date();

        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const [result] = await db.execute(
            `INSERT INTO blockmaster 
                (block_name, display_name, hotelid, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                block_name,
                display_name,
                hotelId,
                status !== undefined ? status : 1,
                created_by_id || userId,
                created_date
            ]
        );

        res.status(200).json({
            success: true,
            message: "Block added successfully",
            data: {
                block_id: result.insertId,
                block_name,
                display_name,
                hotelid: hotelId,
                status: status !== undefined ? status : 1,
                created_by_id: created_by_id || userId,
                created_date: created_date.toISOString()
            }
        });
    } catch (error) {
        console.error("Error adding block:", error);
        res.status(500).json({ success: false, message: "Failed to add block", error: error.message });
    }
};

exports.updateBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { block_name, display_name, status, hotelid, updated_by_id } = req.body;
        const userId = getCurrentUserId(req);
        const updated_date = new Date();

        // Get the existing block
        const [blocks] = await db.execute(
            'SELECT hotelid FROM blockmaster WHERE block_id = ?',
            [id]
        );
        
        if (blocks.length === 0) {
            return res.status(404).json({ success: false, message: "Block not found" });
        }
        
        const block = blocks[0];
        
        // Determine which hotel ID to use
        let hotelId = hotelid || getCurrentUserHotelId(req);
        
        // Use the block's existing hotel_id if no hotelId provided
        if (!hotelId) {
            hotelId = block.hotelid;
        }
        
        // Ensure block belongs to user's hotel
        if (block.hotelid !== hotelId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const [result] = await db.execute(
            `UPDATE blockmaster
            SET block_name = ?, 
                display_name = ?, 
                status = ?,
                updated_by_id = ?, 
                updated_date = ?
            WHERE block_id = ?`,
            [
                block_name,
                display_name,
                status,
                updated_by_id || userId,
                updated_date,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Block not found" });
        }

        res.status(200).json({
            success: true,
            message: "Block updated successfully",
            data: {
                block_id: parseInt(id),
                block_name,
                display_name,
                hotelid: hotelId,
                status,
                updated_by_id: updated_by_id || userId,
                updated_date: updated_date.toISOString()
            }
        });
    } catch (error) {
        console.error("Error updating block:", error);
        res.status(500).json({ success: false, message: "Failed to update block", error: error.message });
    }
};

exports.deleteBlock = async (req, res) => {
    try {
            const { id } = req.params;
            const hotelid = req.body?.hotelid;
        // Accept hotelid from request body, fallback to user's hotel ID
        let hotelId = hotelid || getCurrentUserHotelId(req);

        // Get the existing block
        const [blocks] = await db.execute(
            'SELECT hotelid FROM blockmaster WHERE block_id = ?',
            [id]
        );
        
        if (blocks.length === 0) {
            return res.status(404).json({ success: false, message: "Block not found" });
        }
        
        const block = blocks[0];
        
        // Use the block's existing hotel_id if no hotelId provided
        if (!hotelId) {
            hotelId = block.hotelid;
        }
        
        // Ensure block belongs to user's hotel
        if (block.hotelid !== hotelId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const [result] = await db.execute(
            'DELETE FROM blockmaster WHERE block_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Block not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Block deleted successfully", 
            data: { block_id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting block:", error);
        res.status(500).json({ success: false, message: "Failed to delete block", error: error.message });
    }
};