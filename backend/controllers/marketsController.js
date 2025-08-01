const db = require('../config/db');

exports.getmarkets = (req, res) => {
    const markets = db.prepare('SELECT * FROM mstmarkets').all();
    res.json(markets);
};

exports.addmarkets = (req, res) => {
    const { market_name, status,created_by_id,created_date,updated_by_id,updated_date } = req.body;
    //const result = stmt.run(market_name, status,created_by_id,created_date,updated_by_id,updated_date);
    const stmt = db.prepare('INSERT INTO mstmarkets (market_name, status, created_by_id, created_date, updated_by_id, updated_date) VALUES (?, ?,?,?,?,?)');
    const result = stmt.run(market_name, status,created_by_id,created_date,updated_by_id,updated_date);
    res.json({ id: result.lastInsertRowid, market_name, status ,created_by_id,created_date,updated_by_id,updated_date});
};

exports.updatemarkets = (req, res) => {
    const { id } = req.params;
    const { market_name, status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE mstmarkets SET market_name = ?, status = ?,updated_by_id =?,updated_date =? WHERE marketid = ?');
    stmt.run(market_name, status,updated_by_id,updated_date, id);
    res.json({ id, market_name, status,updated_by_id,updated_date });
};

exports.deletemarkets = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstmarkets WHERE marketid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};