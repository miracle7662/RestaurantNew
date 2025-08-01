const db = require('../config/db');
exports.getCountries = (req, res) => {
    const countries = db.prepare('SELECT * FROM mstcountrymaster').all();
    res.json(countries);
};

exports.addCountry = (req, res) => {
    const { country_name, country_code, country_capital,status,created_by_id,created_date } = req.body;
    const stmt = db.prepare('INSERT INTO mstcountrymaster (country_name, country_code, country_capital,status,created_by_id,created_date) VALUES (?, ?, ?,?,?,?)');
    const result = stmt.run(country_name, country_code, country_capital,status,created_by_id,created_date);
    res.json({ id: result.lastInsertRowid, country_name, country_code, country_capital,status,created_by_id,created_date });
};

exports.updateCountry = (req, res) => {
    const { id } = req.params;
    const { country_name, country_code, country_capital,status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE mstcountrymaster SET country_name = ?, country_code = ?, country_capital = ?,status =?,updated_by_id =?,updated_date =? WHERE countryid = ?');
    stmt.run(country_name, country_code, country_capital,status,updated_by_id,updated_date, id);
    res.json({ id, country_name, country_code, country_capital,status,updated_by_id,updated_date});
};

exports.deleteCountry = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstcountrymaster WHERE countryid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};
