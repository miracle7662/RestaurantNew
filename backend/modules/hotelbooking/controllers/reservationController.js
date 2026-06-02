// controllers/reservationController.js
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper to format date WITHOUT timezone conversion
const formatDateOnly = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to format MySQL datetime
const formatDateTime = (date) => date ? new Date(date).toISOString() : null;

exports.getNextReservationNumber = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const [rows] = await db.execute(
            'SELECT MAX(CAST(reservation_no AS UNSIGNED)) as max_num FROM hotel_reservations WHERE hotelid = ?',
            [hotelId]
        );
        
        const nextNumber = (rows[0].max_num || 0) + 1;
        const nextReservationNo = nextNumber.toString().padStart(4, '0');

        res.json({ success: true, data: { reservation_no: nextReservationNo } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.getReservations = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId && req.body?.hotelid) hotelId = req.body.hotelid;
        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const [reservations] = await db.execute(`
            SELECT 
                hr.*,
                gm.name as guest_name,
                cm.company_name as company_name
            FROM hotel_reservations hr
            LEFT JOIN guest_master gm ON hr.guest_id = gm.guest_id
            LEFT JOIN company_master cm ON hr.company_id = cm.company_id
            WHERE hr.hotelid = ?
            ORDER BY hr.created_at DESC
        `, [hotelId]);

        const formattedReservations = reservations.map(res => ({
            ...res,
            created_at: formatDateTime(res.created_at),
            updated_at: formatDateTime(res.updated_at),
            reservation_date: formatDateOnly(res.reservation_date),
            arrival_date: formatDateOnly(res.arrival_date),
            departure_date: formatDateOnly(res.departure_date)
        }));

        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: formattedReservations 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.getReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [reservations] = await db.execute(`
            SELECT * FROM hotel_reservations WHERE reservation_id = ?
        `, [id]);
        
        if (reservations.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }
        
        const reservation = reservations[0];
        
        const formattedReservation = {
            ...reservation,
            created_at: formatDateTime(reservation.created_at),
            updated_at: formatDateTime(reservation.updated_at),
            reservation_date: formatDateOnly(reservation.reservation_date),
            arrival_date: formatDateOnly(reservation.arrival_date),
            departure_date: formatDateOnly(reservation.departure_date)
        };
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: formattedReservation 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.addReservation = async (req, res) => {
    try {
        const {
            reservation_no,
            guest_id,
            title,
            reservation_name,
            phone1,
            phone2,
            email,
            address,
            country_id,
            state_id,
            city_id,
            company_id,
            gst,
            reservation_date,
            arrival_date,
            arrival_time,
            departure_date,
            departure_time,
            nights,
            guest_type,
            billing_instructions,
            special_instructions,
            booking_taken_by,
            reservation_mode,
            confirmation_mode,
            pickup,
            drop_location,
            status = 'reserved',
            hotelid,
            created_by_id
        } = req.body;

        const userId = created_by_id || getCurrentUserId(req);
        let finalHotelId = hotelid || getCurrentUserHotelId(req);
        
        if (!finalHotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        let finalReservationNo = reservation_no;

        if (finalReservationNo) {
            const [existing] = await db.execute(
                'SELECT reservation_id FROM hotel_reservations WHERE reservation_no = ? AND hotelid = ?',
                [finalReservationNo, finalHotelId]
            );
            
            if (existing.length > 0) {
                const [rows] = await db.execute(
                    'SELECT MAX(CAST(reservation_no AS UNSIGNED)) as max_num FROM hotel_reservations WHERE hotelid = ?',
                    [finalHotelId]
                );
                const nextNumber = (rows[0].max_num || 0) + 1;
                finalReservationNo = nextNumber.toString().padStart(4, '0');
            }
        } else {
            const [rows] = await db.execute(
                'SELECT MAX(CAST(reservation_no AS UNSIGNED)) as max_num FROM hotel_reservations WHERE hotelid = ?',
                [finalHotelId]
            );
            const nextNumber = (rows[0].max_num || 0) + 1;
            finalReservationNo = nextNumber.toString().padStart(4, '0');
        }

        const [result] = await db.execute(`
            INSERT INTO hotel_reservations (
                reservation_no, guest_id, title, reservation_name, phone1, phone2, email,
                address, country_id, state_id, city_id,
                company_id, gst, reservation_date, arrival_date, arrival_time,
                departure_date, departure_time, nights, guest_type, billing_instructions,
                special_instructions, booking_taken_by, reservation_mode, confirmation_mode,
                pickup, drop_location, status, hotelid, created_by_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            finalReservationNo || null,
            guest_id || null,
            title || null,
            reservation_name || null,
            phone1 || null,
            phone2 || null,
            email || null,
            address || null,
            country_id || null,
            state_id || null,
            city_id || null,
            company_id || null,
            gst || null,
            reservation_date || null,
            arrival_date || null,
            arrival_time || null,
            departure_date || null,
            departure_time || null,
            nights || null,
            guest_type || null,
            billing_instructions || null,
            special_instructions || null,
            booking_taken_by || null,
            reservation_mode || null,
            confirmation_mode || null,
            pickup || null,
            drop_location || null,
            status || 'reserved',
            finalHotelId,
            userId || null
        ]);

        const reservationId = result.insertId;
        
        res.status(201).json({
            success: true,
            message: "Reservation added successfully",
            data: {
                reservation_id: reservationId,
                reservation_no: finalReservationNo,
                ...req.body,
                hotelid: finalHotelId,
                created_by_id: userId
            }
        });
    } catch (error) {
        console.error("RESERVATION ADD ERROR:", {
            body: req.body,
            hotelId: req.body.hotelid,
            guestId: req.body.guest_id,
            userHotelId: getCurrentUserHotelId(req),
            error: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            success: false, 
            message: "Failed to add reservation", 
            error: error.message 
        });
    }
};

exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = getCurrentUserId(req);
        const updated_at = new Date();

        const [existing] = await db.execute(
            'SELECT reservation_id FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        const allowedFields = [
            'reservation_no', 'guest_id', 'title', 'reservation_name', 'phone1', 'phone2', 'email',
            'address', 'country_id', 'state_id', 'city_id',
            'company_id', 'gst', 'reservation_date', 'arrival_date',
            'arrival_time', 'departure_date', 'departure_time', 'nights', 'guest_type',
            'billing_instructions', 'special_instructions', 'booking_taken_by',
            'reservation_mode', 'confirmation_mode', 'pickup', 'drop_location', 'status'
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

        updates.push('updated_by_id = ?', 'updated_at = ?');
        values.push(userId, updated_at, id);

        const query = `UPDATE hotel_reservations SET ${updates.join(', ')} WHERE reservation_id = ?`;
        const [result] = await db.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found or no changes" });
        }

        res.json({ 
            success: true, 
            message: "Reservation updated successfully", 
            data: { reservation_id: parseInt(id), ...updateData } 
        });
    } catch (error) {
        console.error("RESERVATION UPDATE ERROR:", {
            id: req.params.id,
            body: req.body,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false, 
            message: "Failed to update reservation", 
            error: error.message 
        });
    }
};

exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute(
            'SELECT reservation_id FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        const [result] = await db.execute(
            'DELETE FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        res.json({ 
            success: true, 
            message: "Reservation deleted successfully", 
            data: { reservation_id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete reservation", 
            error: error.message 
        });
    }
};