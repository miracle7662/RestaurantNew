const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

exports.getDepartures = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT * FROM departure_master WHERE 1=1`;
        const params = [];
        
        if (status !== undefined) {
            query += ` AND status = ?`;
            params.push(status);
        }
        query += ` ORDER BY departure_name ASC`;
        
        const [departures] = await db.execute(query, params);
        res.json({ success: true, data: departures });
    } catch (error) {
        console.error('Error in getDepartures:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.addDeparture = async (req, res) => {
    try {
        const { departure_name, description, status } = req.body;
        const userId = getCurrentUserId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!departure_name) {
            return res.status(400).json({ success: false, message: 'Departure name is required' });
        }

        const [result] = await db.execute(`
            INSERT INTO departure_master (departure_name, description, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?)
        `, [departure_name, description || null, status ?? 1, userId, created_date]);

        const [newDeparture] = await db.execute(
            'SELECT * FROM departure_master WHERE departure_id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, data: newDeparture[0] });
    } catch (error) {
        console.error('Error adding departure:', error);
        res.status(500).json({ success: false, message: 'Failed to add departure' });
    }
};