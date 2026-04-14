const db = require('../config/db');

exports.getmarkets = async (req, res) => {
    try {
        console.log("👉 GET /markets API HIT");

        const query = `
            SELECT 
                marketid, market_name, status, 
                created_by_id, created_date, 
                updated_by_id, updated_date
            FROM mstmarkets
        `;

        console.log("🧾 SQL Query:", query);

        const [markets] = await db.query(query);

        console.log("✅ Data Fetched:", markets);

        res.json({
            success: true,
            data: markets
        });

    } catch (error) {
        console.error("❌ ERROR in getmarkets:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch markets",
            error: error.message
        });
    }
};
exports.getmarketsById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT marketid, market_name, status, created_by_id, created_date,
                    updated_by_id, updated_date
             FROM mstmarkets 
             WHERE marketid = ? AND status = 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Market not found' 
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch market",
            error: error.message
        });
    }
};

exports.addmarkets = async (req, res) => {
    try {
        const {
            market_name, status, created_by_id, created_date
        } = req.body;

        if (!market_name || status === undefined || !created_by_id) {
            return res.status(400).json({ 
                success: false,
                message: 'market_name, status, and created_by_id are required' 
            });
        }

        const [result] = await db.query(
            `INSERT INTO mstmarkets 
             (market_name, status, created_by_id, created_date, updated_by_id, updated_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                market_name, 
                parseInt(status), 
                parseInt(created_by_id),
                created_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
                parseInt(created_by_id),
                new Date().toISOString().slice(0, 19).replace('T', ' ')
            ]
        );

        const newMarketId = result.insertId;

        const [newMarket] = await db.query(
            `SELECT marketid, market_name, status, created_by_id, created_date,
                    updated_by_id, updated_date 
             FROM mstmarkets WHERE marketid = ?`,
            [newMarketId]
        );

        res.status(201).json({
            success: true,
            data: newMarket[0],
            message: 'Market created successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create market",
            error: error.message
        });
    }
};

exports.updatemarkets = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            market_name, status, updated_by_id, updated_date
        } = req.body;

        if (!market_name || status === undefined || !updated_by_id) {
            return res.status(400).json({ 
                success: false,
                message: 'market_name, status, and updated_by_id are required' 
            });
        }

        const [result] = await db.query(
            `UPDATE mstmarkets 
             SET market_name = ?, status = ?, updated_by_id = ?, updated_date = ?
             WHERE marketid = ? AND status = 1`,
            [
                market_name,
                parseInt(status),
                parseInt(updated_by_id),
                updated_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
                parseInt(id)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Market not found" 
            });
        }

        const [updatedMarket] = await db.query(
            `SELECT marketid, market_name, status, created_by_id, created_date,
                    updated_by_id, updated_date
             FROM mstmarkets WHERE marketid = ?`,
            [id]
        );

        res.json({
            success: true,
            data: updatedMarket[0],
            message: 'Market updated successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update market",
            error: error.message
        });
    }
};

exports.deletemarkets = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM mstmarkets WHERE marketid = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Market not found'
            });
        }

        res.json({
            success: true,
            message: 'Deleted successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Delete failed',
            error: error.message
        });
    }
};

