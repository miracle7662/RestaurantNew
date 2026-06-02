// controllers/reservationBookedByController.js
const db = require('../../../config/db');

exports.getReservationBookedBy = async (req, res) => {
    try {
        const { reservation_id } = req.query;
        
        if (!reservation_id) {
            return res.status(400).json({ success: false, message: "reservation_id required" });
        }

        const [links] = await db.execute(`
            SELECT rbb.*, bbc.name as booked_by_name, bbc.mobile1, bbc.email
            FROM reservation_booked_by rbb
            JOIN booked_by_contacts bbc ON rbb.booked_by_id = bbc.booked_by_id
            WHERE rbb.reservation_id = ?
        `, [reservation_id]);
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: links 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.addReservationBookedBy = async (req, res) => {
    try {
        const { reservation_id, booked_by_id } = req.body;
        
        if (!reservation_id || !booked_by_id) {
            return res.status(400).json({ 
                success: false, 
                message: "reservation_id and booked_by_id required" 
            });
        }

        const [result] = await db.execute(`
            INSERT INTO reservation_booked_by (reservation_id, booked_by_id)
            VALUES (?, ?)
        `, [reservation_id, booked_by_id]);

        res.status(201).json({
            success: true,
            message: "Link added successfully",
            data: { id: result.insertId, reservation_id, booked_by_id }
        });
    } catch (error) {
        console.error("Error adding link:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add link", 
            error: error.message 
        });
    }
};

exports.deleteReservationBookedBy = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute(
            'SELECT id FROM reservation_booked_by WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        const [result] = await db.execute(
            'DELETE FROM reservation_booked_by WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        res.json({ 
            success: true, 
            message: "Link deleted successfully", 
            data: { id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting link:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete link", 
            error: error.message 
        });
    }
};