const db = require('../config/db');

exports.getUserType = (req, res) => {
    const UserType = db.prepare('SELECT * FROM mstuserType').all();
    res.json(UserType);
};

exports.addUserType = (req, res) => {
    const { User_type, status, created_by_id, created_date, hotelid } = req.body;
    const stmt = db.prepare('INSERT INTO mstuserType ( User_type, status, created_by_id, created_date, hotelid) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(User_type, status, created_by_id, created_date, hotelid);
    res.json({ id: result.lastInsertRowid, User_type, status, created_by_id, created_date, hotelid });
};

exports.updateUserType = (req, res) => {
    const { id } = req.params;
    const {User_type, status,updated_by_id,updated_date, hotelid } = req.body;
    const stmt = db.prepare('UPDATE mstuserType SET User_type = ?, status = ?,updated_by_id =?,updated_date =?, hotelid =? WHERE usertypeid = ?');
    stmt.run(User_type, status,updated_by_id,updated_date, hotelid, id);
    res.json({ id,User_type, status,updated_by_id,updated_date, hotelid });
};

exports.deleteUserType = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstuserType WHERE usertypeid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};