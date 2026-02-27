const db = require('../config/db');

exports.getStates = (req, res) => {
    const states = db.prepare('SELECT S.stateid, S.state_name,S.state_code,S.state_capital,s.countryid,C.country_name,S.status, S.created_by_id,S.created_date,S.updated_by_id,S.updated_date  FROM mststatemaster S inner join mstcountrymaster C on C.countryid = S.countryid').all();
    res.status(200).json({success: true,message: "Data fetched successfully", data: states
});
};

exports.addState = (req, res) => {
    const { state_name, state_code, state_capital, countryid,status,created_by_id,created_date } = req.body;
    const stmt = db.prepare('INSERT INTO mststatemaster (state_name, state_code, state_capital, countryid,status,created_by_id,created_date) VALUES (?, ?, ?, ?,?,?,?)');
    const result = stmt.run(state_name, state_code, state_capital, countryid,status,created_by_id,created_date);
    res.json({ id: result.lastInsertRowid, state_name, state_code, state_capital, countryid,status,created_by_id,created_date});
};

exports.updateState = (req, res) => {
    const { id } = req.params;
    const { state_name, state_code, state_capital, countryid,status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE mststatemaster SET state_name = ?, state_code = ?, state_capital = ?, countryid = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE stateid = ?');
    stmt.run(state_name, state_code, state_capital, countryid,status,updated_by_id,updated_date, id);
    res.json({ id, state_name, state_code, state_capital, countryid,status,updated_by_id,updated_date });
};

exports.deleteState = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mststatemaster WHERE stateid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
}; 