// controllers/reservationController.js
// Single-API controller: every request here handles hotel_reservations
// together with its child rows in reservation_rooms and reservation_booked_by
// inside one DB transaction — mirrors checkInController.js, where
// checkin_master + checkin_detail_master + checkin_guest_room_charges +
// checkin_guest_folio_master are all driven from one endpoint.
const db = require('../../../config/db');


const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

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

const getValueOrNull = (value) => (value !== undefined && value !== null && value !== '' ? value : null);

const roomAllowedFields = [
    'room_category_id', 'converted_category_id', 'total_rooms', 'pax_count', 'pax_price',
    'pax_tax', 'ex_pax_count', 'ex_pax_price', 'ex_pax_tax', 'ex_pax_tax_percent', 'ex_pax_total',
    'child_count', 'child_price', 'child_tax', 'child_tax_percent', 'child_total',
    'driver_count', 'driver_price', 'driver_tax', 'driver_tax_percent', 'driver_total',
    'discount_percent', 'discount_amount', 'total_amount'
];

// Inserts every row of body.rooms into reservation_rooms for the given
// reservation_id, inside the supplied connection/transaction.
const insertReservationRooms = async (connection, reservationId, rooms) => {
    if (!rooms || !rooms.length) return;

    for (const room of rooms) {
        const cols = ['reservation_id'];
        const vals = [reservationId];

        roomAllowedFields.forEach((field) => {
            if (room[field] !== undefined) {
                cols.push(field);
                vals.push(room[field]);
            }
        });

        if (!cols.includes('total_rooms')) {
            cols.push('total_rooms');
            vals.push(1);
        }

        await connection.execute(
            `INSERT INTO reservation_rooms (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
            vals
        );
    }
};

// Inserts the single reservation_booked_by link row, if booked_by_id given.
const insertBookedByLink = async (connection, reservationId, bookedById) => {
    if (!bookedById) return;
    await connection.execute(
        `INSERT INTO reservation_booked_by (reservation_id, booked_by_id) VALUES (?, ?)`,
        [reservationId, bookedById]
    );
};

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




// ----------------------------------------------------------------------
// GET /reservations – list reservations (master rows only)
// ----------------------------------------------------------------------
exports.getReservations = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId && req.body?.hotelid) hotelId = req.body.hotelid;
        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const { q } = req.query;

        let sql = `
            SELECT
                hr.*,
                gm.name as guest_name,
                cm.company_name as company_name
            FROM hotel_reservations hr
            LEFT JOIN guest_master gm ON hr.guest_id = gm.guest_id
            LEFT JOIN company_master cm ON hr.company_id = cm.company_id
            WHERE hr.hotelid = ?
        `;
        const params = [hotelId];

        if (q) {
            sql += ` AND (gm.name LIKE ? OR hr.reservation_no LIKE ? OR hr.phone1 LIKE ?)`;
            const like = `%${q}%`;
            params.push(like, like, like);
        }

        sql += ` ORDER BY hr.created_at DESC`;

        const [reservations] = await db.execute(sql, params);

        const formattedReservations = reservations.map(r => ({
            ...r,
            created_at: formatDateTime(r.created_at),
            updated_at: formatDateTime(r.updated_at),
            reservation_date: formatDateOnly(r.reservation_date),
            arrival_date: formatDateOnly(r.arrival_date),
            departure_date: formatDateOnly(r.departure_date)
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

/// ----------------------------------------------------------------------
// GET /reservations/today-guests
// Today's reservation guests for Check-In
// ----------------------------------------------------------------------
exports.getTodayReservationGuests = async (req, res) => {
    try {
        let hotelId =
            req.query.hotelid ||
            req.query.mst_hotelid ||
            getCurrentUserHotelId(req);

        if (!hotelId && req.body?.hotelid) {
            hotelId = req.body.hotelid;
        }

        if (!hotelId) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID not found"
            });
        }

        const sql = `
            SELECT
                hr.reservation_id,
                hr.reservation_no,

                hr.guest_id,
                gm.name AS guest_name,

                hr.title,
                hr.reservation_name,

                hr.phone1,
                hr.phone2,
                hr.email,

                hr.address,

                hr.country_id,
                hr.state_id,
                hr.city_id,

                hr.company_id,
                cm.company_name,

                hr.gst,

                hr.reservation_date,

                hr.arrival_date,
                hr.arrival_time,

                hr.departure_date,
                hr.departure_time,

                hr.nights,

                hr.guest_type,

                hr.billing_instructions,
                hr.special_instructions,

                hr.booking_taken_by,
                hr.reservation_mode,
                hr.confirmation_mode,

                hr.pickup,
                hr.drop_location,

                hr.status,
                hr.hotelid,

                hr.created_by_id

            FROM hotel_reservations hr

            LEFT JOIN guest_master gm
                ON hr.guest_id = gm.guest_id

            LEFT JOIN company_master cm
                ON hr.company_id = cm.company_id

            WHERE hr.hotelid = ?

              AND DATE(hr.arrival_date) = CURDATE()

              AND LOWER(hr.status) = 'reserved'

            ORDER BY
                hr.arrival_time ASC,
                hr.reservation_id ASC
        `;

        const [reservations] = await db.execute(
            sql,
            [hotelId]
        );

        return res.status(200).json({
            success: true,

            message:
                reservations.length > 0
                    ? "Today's reservation guests fetched successfully"
                    : "No today's reservation guests found",

            count: reservations.length,

            data: reservations
        });

    } catch (error) {

        console.error(
            "GET TODAY RESERVATION GUESTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch today's reservation guests",
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------
// GET /reservations/:id – master + rooms + booked-by, single response
// ----------------------------------------------------------------------
exports.getReservationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [reservations] = await db.execute(
            `SELECT * FROM hotel_reservations WHERE reservation_id = ?`,
            [id]
        );

        if (reservations.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        const reservation = reservations[0];

        const [rooms] = await db.execute(
            `SELECT rr.*,
                    rc.category_name as room_category_name,
                    rc2.category_name as converted_category_name
             FROM reservation_rooms rr
             LEFT JOIN room_category rc ON rr.room_category_id = rc.room_category_id
             LEFT JOIN room_category rc2 ON rr.converted_category_id = rc2.room_category_id
             WHERE rr.reservation_id = ?
             ORDER BY rr.room_row_id`,
            [id]
        );

        const [bookedByLinks] = await db.execute(
            `SELECT rbb.*, bbc.name as booked_by_name, bbc.mobile1, bbc.email
             FROM reservation_booked_by rbb
             JOIN booked_by_contacts bbc ON rbb.booked_by_id = bbc.booked_by_id
             WHERE rbb.reservation_id = ?
             LIMIT 1`,
            [id]
        );

        const formattedReservation = {
            ...reservation,
            created_at: formatDateTime(reservation.created_at),
            updated_at: formatDateTime(reservation.updated_at),
            reservation_date: formatDateOnly(reservation.reservation_date),
            arrival_date: formatDateOnly(reservation.arrival_date),
            departure_date: formatDateOnly(reservation.departure_date),
            rooms,
            booked_by: bookedByLinks[0] || null
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

// ----------------------------------------------------------------------
// POST /reservations – single API: master + rooms + booked-by in one txn
// ----------------------------------------------------------------------
exports.addReservation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

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
            group_name,
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
            created_by_id,
            rooms,
            booked_by_id
        } = req.body;

        const userId = created_by_id || getCurrentUserId(req);
        let finalHotelId = hotelid || getCurrentUserHotelId(req);

        if (!finalHotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        // ========== 1. RESOLVE RESERVATION NUMBER ==========
        let finalReservationNo = reservation_no;

        if (finalReservationNo) {
            const [existing] = await connection.execute(
                'SELECT reservation_id FROM hotel_reservations WHERE reservation_no = ? AND hotelid = ?',
                [finalReservationNo, finalHotelId]
            );

            if (existing.length > 0) {
                const [rows] = await connection.execute(
                    'SELECT MAX(CAST(reservation_no AS UNSIGNED)) as max_num FROM hotel_reservations WHERE hotelid = ?',
                    [finalHotelId]
                );
                const nextNumber = (rows[0].max_num || 0) + 1;
                finalReservationNo = nextNumber.toString().padStart(4, '0');
            }
        } else {
            const [rows] = await connection.execute(
                'SELECT MAX(CAST(reservation_no AS UNSIGNED)) as max_num FROM hotel_reservations WHERE hotelid = ?',
                [finalHotelId]
            );
            const nextNumber = (rows[0].max_num || 0) + 1;
            finalReservationNo = nextNumber.toString().padStart(4, '0');
        }

        // ========== 2. INSERT MASTER ROW ==========
        const [result] = await connection.execute(`
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

        // ========== 3. INSERT ROOMS ==========
        await insertReservationRooms(connection, reservationId, rooms);

        // ========== 4. INSERT BOOKED-BY LINK ==========
        await insertBookedByLink(connection, reservationId, getValueOrNull(booked_by_id));

        await connection.commit();

        const [masterRow] = await db.execute(
            'SELECT * FROM hotel_reservations WHERE reservation_id = ?',
            [reservationId]
        );

        res.status(201).json({
            success: true,
            message: "Reservation added successfully",
            data: {
                ...masterRow[0],
                reservation_date: formatDateOnly(masterRow[0].reservation_date),
                arrival_date: formatDateOnly(masterRow[0].arrival_date),
                departure_date: formatDateOnly(masterRow[0].departure_date)
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error("RESERVATION ADD ERROR:", {
            body: req.body,
            error: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: "Failed to add reservation",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// PUT /reservations/:id – single API: master update + rooms/booked-by
// replace (delete old rows, insert the rows sent in this request), all
// inside one transaction — same approach checkIn uses for its child tables.
// ----------------------------------------------------------------------
exports.updateReservation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const updateData = req.body;
        console.log('UPDATE: Received data for id', id);

        const [existing] = await connection.execute(
            'SELECT reservation_id FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        const allowedFields = [
            'reservation_no', 'guest_id', 'title', 'reservation_name', 'phone1', 'phone2', 'email',
            'address', 'country_id', 'state_id', 'city_id',
            'company_id', 'gst', // 'group_name' removed
            'reservation_date', 'arrival_date',
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

        if (updates.length > 0) {
            values.push(id); // only id for WHERE clause
            const query = `UPDATE hotel_reservations SET ${updates.join(', ')} WHERE reservation_id = ?`;
            console.log('UPDATE: Executing query:', query);
            await connection.execute(query, values);
            console.log('UPDATE: Master row updated');
        }

        // ========== REPLACE ROOMS ==========
        if (Array.isArray(updateData.rooms)) {
            console.log('UPDATE: Deleting old rooms...');
            await connection.execute('DELETE FROM reservation_rooms WHERE reservation_id = ?', [id]);
            console.log('UPDATE: Inserting new rooms...');
            await insertReservationRooms(connection, id, updateData.rooms);
            console.log('UPDATE: Rooms replaced');
        }

        // ========== REPLACE BOOKED-BY LINK ==========
        if (Object.prototype.hasOwnProperty.call(updateData, 'booked_by_id')) {
            console.log('UPDATE: Replacing booked-by...');
            await connection.execute('DELETE FROM reservation_booked_by WHERE reservation_id = ?', [id]);
            await insertBookedByLink(connection, id, getValueOrNull(updateData.booked_by_id));
            console.log('UPDATE: Booked-by replaced');
        }

        await connection.commit();
        console.log('UPDATE: Transaction committed');

        const [masterRow] = await db.execute(
            'SELECT * FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: "Reservation updated successfully",
            data: {
                ...masterRow[0],
                reservation_date: formatDateOnly(masterRow[0].reservation_date),
                arrival_date: formatDateOnly(masterRow[0].arrival_date),
                departure_date: formatDateOnly(masterRow[0].departure_date)
            }
        });
    } catch (error) {
        await connection.rollback();
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
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// DELETE /reservations/:id – removes master + rooms + booked-by link
// (reservation_rooms / reservation_booked_by have ON DELETE CASCADE, but we
// delete explicitly first too so this works even without the FK cascade).
// ----------------------------------------------------------------------
exports.deleteReservation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        const [existing] = await connection.execute(
            'SELECT reservation_id FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        await connection.execute('DELETE FROM reservation_booked_by WHERE reservation_id = ?', [id]);
        await connection.execute('DELETE FROM reservation_rooms WHERE reservation_id = ?', [id]);

        const [result] = await connection.execute(
            'DELETE FROM hotel_reservations WHERE reservation_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Reservation deleted successfully",
            data: { reservation_id: parseInt(id) }
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting reservation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete reservation",
            error: error.message
        });
    } finally {
        connection.release();
    }
};