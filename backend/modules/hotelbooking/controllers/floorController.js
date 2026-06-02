const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => {
    return req.user?.id || null;
};

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => {
    return req.user?.hotel_id || null;
};

exports.getFloors = async (req, res) => {
    try {
        // Accept hotel_id from query param - fallback to user's hotel ID
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        
        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }
        
        // If still no hotelId, try to get from request body
        if (!hotelId && req.body && req.body.hotelid) {
            hotelId = req.body.hotelid;
        }
        
        if (!hotelId) {
            return res.status(400).json({ 
                success: false, 
                message: "Hotel ID not found" 
            });
        }

        const query = `
            SELECT floor_id, floor_name, floor_number, hotelid, status,
                   created_date, updated_date, created_by_id, updated_by_id
            FROM floormaster
            WHERE hotelid = ?
            ORDER BY floor_number ASC
        `;
        
        const [floors] = await db.execute(query, [hotelId]);

        res.json({
            success: true,
            message: "Data fetched successfully",
            data: floors
        });
    } catch (error) {
        console.error('Error in getFloors:', error);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
};

exports.addFloor = async (req, res) => {
    try {
        const { floor_name, floor_number, status, hotelid, created_by_id } = req.body;
        const userId = getCurrentUserId(req);
        
        // Accept hotelid from request body, fallback to user's hotel ID
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!hotelId) {
            return res.status(400).json({ 
                success: false, 
                message: "Hotel ID not found" 
            });
        }

        const query = `
            INSERT INTO floormaster
                (floor_name, floor_number, hotelid, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            floor_name,
            floor_number,
            hotelId,
            status,
            created_by_id || userId,
            created_date
        ]);

        res.status(200).json({
            success: true,
            message: "Floor added successfully",
            data: {
                floor_id: result.insertId,
                floor_name,
                floor_number,
                hotelid: hotelId,
                status,
                created_by_id: created_by_id || userId,
                created_date
            }
        });
    } catch (error) {
        console.error("Error adding floor:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add floor", 
            error: error.message 
        });
    }
};

exports.updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const { floor_name, floor_number, status, hotelid, updated_by_id } = req.body;
        const userId = getCurrentUserId(req);
        
        // Accept hotelid from request body, fallback to user's hotel ID
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const updated_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Get the existing floor
        const [floor] = await db.execute(
            'SELECT hotelid FROM floormaster WHERE floor_id = ?', 
            [id]
        );
        
        if (!floor || floor.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Floor not found" 
            });
        }
        
        // Use the floor's existing hotel_id if no hotelId provided in request
        if (!hotelId) {
            hotelId = floor[0].hotelid;
        }
        
        // Ensure floor belongs to user's hotel
        if (floor[0].hotelid !== hotelId) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied" 
            });
        }

        const query = `
            UPDATE floormaster
            SET floor_name = ?, floor_number = ?, status = ?,
                updated_by_id = ?, updated_date = ?
            WHERE floor_id = ?
        `;
        
        const [result] = await db.execute(query, [
            floor_name,
            floor_number,
            status,
            updated_by_id || userId,
            updated_date,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Floor not found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Floor updated successfully",
            data: {
                floor_id: parseInt(id),
                floor_name,
                floor_number,
                hotelid: hotelId,
                status,
                updated_by_id: updated_by_id || userId,
                updated_date
            }
        });
    } catch (error) {
        console.error("Error updating floor:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update floor", 
            error: error.message 
        });
    }
};

exports.deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const { hotelid } = req.body;
        
        // Accept hotelid from request body, fallback to user's hotel ID
        let hotelId = hotelid || getCurrentUserHotelId(req);

        // Get the existing floor
        const [floor] = await db.execute(
            'SELECT hotelid FROM floormaster WHERE floor_id = ?', 
            [id]
        );
        
        if (!floor || floor.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Floor not found" 
            });
        }
        
        // Use the floor's existing hotel_id if no hotelId provided
        if (!hotelId) {
            hotelId = floor[0].hotelid;
        }
        
        // Ensure floor belongs to user's hotel
        if (floor[0].hotelid !== hotelId) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied" 
            });
        }

        const [result] = await db.execute(
            'DELETE FROM floormaster WHERE floor_id = ?', 
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Floor not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Floor deleted successfully", 
            data: { floor_id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting floor:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete floor", 
            error: error.message 
        });
    }
};