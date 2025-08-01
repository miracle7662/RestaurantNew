const db = require('../config/db');

exports.gethoteltype = (req, res) => {
    const hoteltype = db.prepare('SELECT * FROM msthoteltype').all();
    res.json(hoteltype);
};

exports.addhoteltype = (req, res) => {
    const { hotel_type, status,created_by_id,created_date} = req.body;
    const stmt = db.prepare('INSERT INTO msthoteltype ( hotel_type, status, created_by_id, created_date) VALUES (?, ?,?,?)');
    const result = stmt.run( hotel_type, status,created_by_id,created_date);
    res.json({ id: result.lastInsertRowid, hotel_type, status ,created_by_id,created_date});
};

exports.updatehoteltype = (req, res) => {
    const { id } = req.params;
    const {hotel_type,status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE msthoteltype SET hotel_type = ?, status = ?,updated_by_id =?,updated_date =? WHERE hoteltypeid = ?');
    stmt.run(hotel_type,status,updated_by_id,updated_date, id);
    res.json({ id, hotel_type,status,updated_by_id,updated_date });
};

exports.deletehoteltype = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM msthoteltype WHERE hoteltypeid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};