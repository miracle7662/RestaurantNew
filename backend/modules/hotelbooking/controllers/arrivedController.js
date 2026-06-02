const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

exports.getArrived = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT * FROM arrived_master WHERE 1=1`;
        const params = [];
        
        if (status !== undefined) {
            query += ` AND status = ?`;
            params.push(status);
        }
        query += ` ORDER BY arrived_name ASC`;
        
        const [arrived] = await db.execute(query, params);
        res.json({ success: true, data: arrived });
    } catch (error) {
        console.error('Error in getArrived:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.addArrived = async (req, res) => {
    try {
        const { arrived_name, description, status } = req.body;
        const userId = getCurrentUserId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!arrived_name) {
            return res.status(400).json({ success: false, message: 'Arrived name is required' });
        }

        const [result] = await db.execute(`
            INSERT INTO arrived_master (arrived_name, description, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?)
        `, [arrived_name, description || null, status ?? 1, userId, created_date]);

        const [newArrived] = await db.execute(
            'SELECT * FROM arrived_master WHERE arrived_id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, data: newArrived[0] });
    } catch (error) {
        console.error('Error adding arrived:', error);
        res.status(500).json({ success: false, message: 'Failed to add arrived' });
    }
};