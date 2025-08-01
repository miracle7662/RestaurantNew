const db = require('../config/db');

exports.getMessageMaster = (req, res) => {
    const MessageMaster  = db.prepare('SELECT * FROM mstmessagemaster ').all();
    res.json(MessageMaster );
};

exports.addMessageMaster = (req, res) => {
    const { Department,message,fromdate,todate, status, created_by_id, created_date, hotelid, marketid  } = req.body;
    const stmt = db.prepare('INSERT INTO mstmessagemaster (Department,message,fromdate,todate, status, created_by_id, created_date, hotelid, marketid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(Department,message,fromdate,todate, status, created_by_id, created_date, hotelid, marketid);
    res.json({ id: result.lastInsertRowid, Department,message,fromdate,todate, status, created_by_id, created_date, hotelid, marketid });
};

exports.updateMessageMaster = (req, res) => {
    const { id } = req.params;
    const { Department,message,fromdate,todate, status,updated_by_id,updated_date} = req.body;
    const stmt = db.prepare('UPDATE mstmessagemaster SET Department = ?,message = ?,fromdate = ?,todate = ?, status = ?, updated_by_id = ?,updated_date = ? WHERE messagemasterid = ?');
    stmt.run(Department,message,fromdate,todate,status, updated_by_id,updated_date, id);
    res.json({ id, Department,message,fromdate,todate, status, updated_by_id,updated_date });
};

exports.deleteMessageMaster = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstmessagemaster WHERE messagemasterid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};