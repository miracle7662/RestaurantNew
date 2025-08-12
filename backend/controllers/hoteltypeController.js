const db = require('../config/db');

// Get all hotel types with optional filtering
exports.gethoteltype = (req, res) => {
    try {
        const { status, search } = req.query;
        let query = 'SELECT * FROM msthoteltype WHERE 1=1';
        let params = [];

        if (status !== undefined) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND hotel_type LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY hotel_type ASC';

        // Fix: Ensure proper JSON formatting by returning array of objects
        const hoteltype = db.prepare(query).all(...params);

        // Manually fix any malformed data if needed (example placeholder)
        // Here assuming db.prepare().all() returns proper array of objects

        res.json(hoteltype);
    } catch (error) {
        console.error('Error fetching hotel types:', error);
        res.status(500).json({ error: 'Failed to fetch hotel types' });
    }
};

// Add new hotel type
exports.addhoteltype = (req, res) => {
    try {
        const { hotel_type, status, created_by_id, created_date } = req.body;
        
        if (!hotel_type || status === undefined) {
            return res.status(400).json({ error: 'Hotel type and status are required' });
        }

        const stmt = db.prepare('INSERT INTO msthoteltype (hotel_type, status, created_by_id, created_date) VALUES (?, ?, ?, ?)');
        const result = stmt.run(hotel_type, status, created_by_id || 1, created_date || new Date().toISOString());
        
        const newHoteltype = {
            hoteltypeid: result.lastInsertRowid,
            hotel_type,
            status,
            created_by_id: created_by_id || 1,
            created_date: created_date || new Date().toISOString(),
            updated_by_id: null,
            updated_date: null
        };
        
        res.status(201).json(newHoteltype);
    } catch (error) {
        console.error('Error adding hotel type:', error);
        res.status(500).json({ error: 'Failed to add hotel type' });
    }
};

// Update hotel type
exports.updatehoteltype = (req, res) => {
    try {
        const { id } = req.params;
        const { hotel_type, status, updated_by_id, updated_date } = req.body;
        
        if (!hotel_type || status === undefined) {
            return res.status(400).json({ error: 'Hotel type and status are required' });
        }

        const stmt = db.prepare('UPDATE msthoteltype SET hotel_type = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE hoteltypeid = ?');
        const result = stmt.run(hotel_type, status, updated_by_id || 2, updated_date || new Date().toISOString(), id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Hotel type not found' });
        }
        
        const updatedHoteltype = {
            hoteltypeid: id,
            hotel_type,
            status,
            updated_by_id: updated_by_id || 2,
            updated_date: updated_date || new Date().toISOString()
        };
        
        res.json(updatedHoteltype);
    } catch (error) {
        console.error('Error updating hotel type:', error);
        res.status(500).json({ error: 'Failed to update hotel type' });
    }
};

// Delete hotel type
exports.deletehoteltype = (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM msthoteltype WHERE hoteltypeid = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Hotel type not found' });
        }
        
        res.json({ message: 'Hotel type deleted successfully' });
    } catch (error) {
        console.error('Error deleting hotel type:', error);
        res.status(500).json({ error: 'Failed to delete hotel type' });
    }
};

// Get hotel type by ID
exports.gethoteltypeById = (req, res) => {
    try {
        const { id } = req.params;
        const hoteltype = db.prepare('SELECT * FROM msthoteltype WHERE hoteltypeid = ?').get(id);
        
        if (!hoteltype) {
            return res.status(404).json({ error: 'Hotel type not found' });
        }
        
        res.json(hoteltype);
    } catch (error) {
        console.error('Error fetching hotel type:', error);
        res.status(500).json({ error: 'Failed to fetch hotel type' });
    }
};

// Get hotel types count
exports.gethoteltypeCount = (req, res) => {
    try {
        const count = db.prepare('SELECT COUNT(*) as count FROM msthoteltype').get();
        res.json(count);
    } catch (error) {
        console.error('Error fetching hotel type count:', error);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
};
