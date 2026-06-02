// controllers/reservationRoomsController.js
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

exports.getReservationRooms = async (req, res) => {
    try {
        const { reservation_id } = req.query;
        
        if (!reservation_id) {
            return res.status(400).json({ success: false, message: "reservation_id required" });
        }

        const [rooms] = await db.execute(`
            SELECT rr.*, 
                   rc.category_name as room_category_name,
                   rc2.category_name as converted_category_name
            FROM reservation_rooms rr
            LEFT JOIN room_category rc ON rr.room_category_id = rc.room_category_id
            LEFT JOIN room_category rc2 ON rr.converted_category_id = rc2.room_category_id
            WHERE rr.reservation_id = ?
            ORDER BY rr.room_row_id
        `, [reservation_id]);
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: rooms 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.getReservationRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rooms] = await db.execute(
            `SELECT * FROM reservation_rooms WHERE room_row_id = ?`,
            [id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: "Room row not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: rooms[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.addReservationRoom = async (req, res) => {
    try {
        const {
            reservation_id, room_category_id, converted_category_id, total_rooms, pax_count, pax_price,
            pax_tax, ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
            child_count, child_price, child_tax, child_tax_percent, child_total,
            driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
            discount_percent, discount_amount, total_amount
        } = req.body;

        if (!reservation_id) {
            return res.status(400).json({ success: false, message: "reservation_id required" });
        }

        const [result] = await db.execute(`
            INSERT INTO reservation_rooms (
                reservation_id, room_category_id, converted_category_id, total_rooms, pax_count, pax_price,
                pax_tax, ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                child_count, child_price, child_tax, child_tax_percent, child_total,
                driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                discount_percent, discount_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            reservation_id, room_category_id, converted_category_id, total_rooms ?? 1, pax_count, pax_price,
            pax_tax, ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
            child_count, child_price, child_tax, child_tax_percent, child_total,
            driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
            discount_percent, discount_amount, total_amount
        ]);

        res.status(201).json({
            success: true,
            message: "Reservation room added successfully",
            data: { room_row_id: result.insertId, ...req.body }
        });
    } catch (error) {
        console.error("Error adding reservation room:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add reservation room", 
            error: error.message 
        });
    }
};

exports.updateReservationRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const [existing] = await db.execute(
            'SELECT room_row_id FROM reservation_rooms WHERE room_row_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Room row not found" });
        }

        const allowedFields = [
            'total_rooms', 'room_category_id', 'converted_category_id', 'pax_count', 'pax_price',
            'pax_tax', 'ex_pax_count', 'ex_pax_price', 'ex_pax_tax', 'ex_pax_tax_percent', 'ex_pax_total',
            'child_count', 'child_price', 'child_tax', 'child_tax_percent', 'child_total',
            'driver_count', 'driver_price', 'driver_tax', 'driver_tax_percent', 'driver_total',
            'discount_percent', 'discount_amount', 'total_amount'
        ];

        const updates = [];
        const values = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        values.push(id);
        const query = `UPDATE reservation_rooms SET ${updates.join(', ')} WHERE room_row_id = ?`;
        
        const [result] = await db.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room row not found or no changes" });
        }

        res.json({ 
            success: true, 
            message: "Reservation room updated successfully", 
            data: { room_row_id: parseInt(id), ...updateData } 
        });
    } catch (error) {
        console.error("Error updating reservation room:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update reservation room", 
            error: error.message 
        });
    }
};

exports.deleteReservationRoom = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute(
            'SELECT room_row_id FROM reservation_rooms WHERE room_row_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Room row not found" });
        }

        const [result] = await db.execute(
            'DELETE FROM reservation_rooms WHERE room_row_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room row not found" });
        }

        res.json({ 
            success: true, 
            message: "Reservation room deleted successfully", 
            data: { room_row_id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting reservation room:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete reservation room", 
            error: error.message 
        });
    }
};