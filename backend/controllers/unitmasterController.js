const db = require('../config/db');

// Get All
exports.getunitmaster = async (req, res) => {
    try {
        const hotelid = req.query.hotelid || req.hotelid || 0;

        const [unitmaster] = await db.query(`
            SELECT * FROM mstunitmaster 
            WHERE hotelid = 0 OR hotelid = ?
        `, [hotelid]);

        console.log("DATA:", unitmaster);

        res.status(200).json({
            success: true,
            message: "Unit master fetched successfully",
            data: unitmaster,
            error: null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unit master",
            data: null,
            error: error.message
        });
    }
};


// Add
exports.addunitmaster = async (req, res) => {
    try {
        const { unit_name, status, created_by_id, created_date, hotelid, client_code } = req.body;

        const [result] = await db.query(`
            INSERT INTO mstunitmaster 
            (unit_name, status, created_by_id, created_date, hotelid, client_code) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            unit_name,
            status,
            created_by_id,
            created_date,
            hotelid,
            client_code
        ]);

        res.status(201).json({
            success: true,
            message: "Unit master created successfully",
            data: {
                unitid: result.insertId,
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
exports.updateunitmaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_name, status, updated_by_id, updated_date, hotelid, client_code } = req.body;

        await db.query(`
            UPDATE mstunitmaster 
            SET unit_name = ?, 
                status = ?, 
                updated_by_id = ?, 
                updated_date = ?, 
                hotelid = ?, 
                client_code = ?
            WHERE unitid = ?
        `, [
            unit_name,
            status,
            updated_by_id,
            updated_date,
            hotelid,
            client_code,
            id
        ]);

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
exports.deleteunitmaster = async (req, res) => {
    try {
        const { id } = req.params;
        const hotelid = req.query.hotelid || req.hotelid;

        await db.query(
            'DELETE FROM mstunitmaster WHERE unitid = ? AND hotelid = ?',
            [id, hotelid]
        );

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