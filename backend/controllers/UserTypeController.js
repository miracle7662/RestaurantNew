const db = require('../config/db');

exports.getUserType = (req, res) => {
    try {
        const userTypes = db.prepare('SELECT * FROM mstuserType').all();
        res.json({
            success: true,
            count: userTypes.length,
            data: userTypes
        });
    } catch (error) {
        console.error('Error fetching user types:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user types', data: [] });
    }
};

exports.addUserType = (req, res) => {
    try {
        const { User_type, status, created_by_id, created_date, hotelid } = req.body;
        const stmt = db.prepare('INSERT INTO mstuserType (User_type, status, created_by_id, created_date, hotelid) VALUES (?, ?, ?, ?, ?)');
       const result = stmt.run(User_type, status, created_by_id, created_date, hotelid);

        const newUserType = {
            usertypeid: result.lastInsertRowid,
            User_type,
            status,
            created_by_id: created_by_id || 1,
            created_date: created_date || new Date().toISOString(),
            updated_by_id: null,
            updated_date: null,
            hotelid: hotelid || null
        };

        res.status(201).json({ success: true, data: newUserType });
    } catch (error) {
        console.error('Error adding user type:', error);
        res.status(500).json({ success: false, message: 'Failed to add user type' });
    }
};


exports.updateUserType = (req, res) => {
    const { id } = req.params;
    const {User_type, status,updated_by_id,updated_date, hotelid } = req.body;
    const stmt = db.prepare('UPDATE mstuserType SET User_type = ?, status = ?,updated_by_id =?,updated_date =?, hotelid =? WHERE usertypeid = ?');
    stmt.run(User_type, status,updated_by_id,updated_date, hotelid, id);
    res.json({ id,User_type, status,updated_by_id,updated_date, hotelid });
    const updatedUserType = {
            usertypeid: id,
            User_type,
            status,
            updated_by_id: updated_by_id || 2,
            updated_date: updated_date || new Date().toISOString(),
            hotelid: hotelid || null
        };
        res.json({ success: true, data: updatedUserType });
            
};

exports.deleteUserType = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstuserType WHERE usertypeid = ?');
    stmt.run(id);
     res.json({ success: true, data: { usertypeid: id } });
};