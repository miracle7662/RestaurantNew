const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

exports.getPurposes = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT * FROM purpose_master WHERE 1=1`;
        const params = [];
        
        if (status !== undefined) {
            query += ` AND status = ?`;
            params.push(status);
        }
        query += ` ORDER BY purpose_name ASC`;
        
        const [purposes] = await db.execute(query, params);
        res.json({ success: true, data: purposes });
    } catch (error) {
        console.error('Error in getPurposes:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.addPurpose = async (req, res) => {
    try {
        const { purpose_name, description, status } = req.body;
        const userId = getCurrentUserId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!purpose_name) {
            return res.status(400).json({ success: false, message: 'Purpose name is required' });
        }

        const [result] = await db.execute(`
            INSERT INTO purpose_master (purpose_name, description, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?)
        `, [purpose_name, description || null, status ?? 1, userId, created_date]);

        const [newPurpose] = await db.execute(
            'SELECT * FROM purpose_master WHERE purpose_id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, data: newPurpose[0] });
    } catch (error) {
        console.error('Error adding purpose:', error);
        res.status(500).json({ success: false, message: 'Failed to add purpose' });
    }
};