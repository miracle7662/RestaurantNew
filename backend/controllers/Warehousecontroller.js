const db = require('../config/db');

/* ==============================
   Get All Warehouses
============================== */
exports.getwarehouse = async (req, res) => {
    try {
        const [warehouse] = await db.query('SELECT * FROM mstwarehouse');

        res.status(200).json({
            success: true,
            message: "Warehouses fetched successfully",
            data: warehouse,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouses",
            data: null,
            error: error.message
        });
    }
};

/* ==============================
   Add Warehouse
============================== */
exports.addwarehouse = async (req, res) => {
    try {
        const {
            warehouse_name,
            location,
            status,
            created_by_id,
            created_date,
            hotelid,
            client_code,
            marketid
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO mstwarehouse 
            (warehouse_name, location, total_items, status, created_by_id, created_date, hotelid, client_code, marketid) 
            VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)
        `, [
            warehouse_name,
            location,
            status,
            created_by_id,
            created_date,
            hotelid,
            client_code,
            marketid
        ]);

        res.status(201).json({
            success: true,
            message: "Warehouse created successfully",
            data: {
                warehouseid: result.insertId,
                warehouse_name,
                location,
                status,
                created_by_id,
                created_date,
                hotelid,
                client_code,
                marketid
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create warehouse",
            data: null,
            error: error.message
        });
    }
};

/* ==============================
   Update Warehouse
============================== */
exports.updatewarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            warehouse_name,
            location,
            status,
            updated_by_id,
            updated_date,
            hotelid,
            client_code,
            marketid
        } = req.body;

        const [result] = await db.query(`
            UPDATE mstwarehouse 
            SET warehouse_name = ?, 
                location = ?, 
                status = ?, 
                updated_by_id = ?, 
                updated_date = ?, 
                hotelid = ?, 
                client_code = ?, 
                marketid = ?
            WHERE warehouseid = ?
        `, [
            warehouse_name,
            location,
            status,
            updated_by_id,
            updated_date,
            hotelid,
            client_code,
            marketid,
            id
        ]);

        res.status(200).json({
            success: true,
            message: "Warehouse updated successfully",
            data: {
                warehouseid: Number(id),
                warehouse_name,
                location,
                status,
                updated_by_id,
                updated_date,
                hotelid,
                client_code,
                marketid
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update warehouse",
            data: null,
            error: error.message
        });
    }
};

/* ==============================
   Delete Warehouse
============================== */
exports.deletewarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM mstwarehouse WHERE warehouseid = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Warehouse deleted successfully",
            data: null,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete warehouse",
            data: null,
            error: error.message
        });
    }
};