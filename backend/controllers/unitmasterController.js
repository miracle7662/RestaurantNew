const db = require('../config/db');

// Get All
exports.getunitmaster = (req, res) => {
    try {
        const unitmaster = db.prepare('SELECT * FROM mstunitmaster').all();

        res.status(200).json({
            success: true,
            message: "Unit master fetched successfully",
            data: unitmaster,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch unit master",
            data: null,
            error: error.message
        });
    }
};


// Add
exports.addunitmaster = (req, res) => {
    try {
        const { unit_name, status, created_by_id, created_date, hotelid, client_code } = req.body;

        const stmt = db.prepare(`
            INSERT INTO mstunitmaster 
            (unit_name, status, created_by_id, created_date, hotelid, client_code) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            unit_name, 
            status, 
            created_by_id, 
            created_date, 
            hotelid, 
            client_code
        );

        res.status(201).json({
            success: true,
            message: "Unit master created successfully",
            data: {
                unitid: result.lastInsertRowid,
                unit_name,
                status,
                created_by_id,
                created_date,
                hotelid,
                client_code
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create unit master",
            data: null,
            error: error.message
        });
    }
};


// Update
exports.updateunitmaster = (req, res) => {
    try {
        const { id } = req.params;
        const { unit_name, status, updated_by_id, updated_date, hotelid, client_code } = req.body;

        const stmt = db.prepare(`
            UPDATE mstunitmaster 
            SET unit_name = ?, 
                status = ?, 
                updated_by_id = ?, 
                updated_date = ?, 
                hotelid = ?, 
                client_code = ?
            WHERE unitid = ?
        `);

        stmt.run(
            unit_name, 
            status, 
            updated_by_id, 
            updated_date, 
            hotelid, 
            client_code, 
            id
        );

        res.status(200).json({
            success: true,
            message: "Unit master updated successfully",
            data: {
                unitid: id,
                unit_name,
                status,
                updated_by_id,
                updated_date,
                hotelid,
                client_code
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update unit master",
            data: null,
            error: error.message
        });
    }
};


// Delete
exports.deleteunitmaster = (req, res) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare('DELETE FROM mstunitmaster WHERE unitid = ?');
        stmt.run(id);

        res.status(200).json({
            success: true,
            message: "Unit master deleted successfully",
            data: null,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete unit master",
            data: null,
            error: error.message
        });
    }
};