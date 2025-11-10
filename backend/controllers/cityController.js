const db = require('../config/db');

exports.getCities = (req, res) => {
    const cities = db.prepare('SELECT * FROM mstcitymaster').all();
    res.json(cities);
};

exports.addCity = (req, res) => {
    const { city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date } = req.body;
    // Convert boolean to integer for SQLite
   
    const stmt = db.prepare('INSERT INTO mstcitymaster (city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date) VALUES (?, ?, ?, ?, ?,?,?)');
    const result = stmt.run(city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date);
    res.json({ id: result.lastInsertRowid, city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date });
};

exports.updateCity = (req, res) => {
    const { id } = req.params;
    const { city_name, city_Code, stateId, iscoastal, status,updated_by_id,updated_date} = req.body;
    // Convert boolean to integer for SQLite
   
    const stmt = db.prepare('UPDATE mstcitymaster SET city_name = ?, city_Code = ?, stateId = ?, iscoastal = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE cityid = ?');
    stmt.run(city_name, city_Code, stateId, iscoastal, status,updated_by_id,updated_date ,id);
    res.json({ id, city_name, city_Code, stateId, iscoastal, status,updated_by_id,updated_date});
};

exports.deleteCity = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstcitymaster WHERE cityid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
}; 

// controllers/cityController.js
exports.getCitiesByState = (req, res) => {
  const { stateId } = req.params;
  const cities = db.prepare('SELECT * FROM mstcitymaster WHERE stateId = ?').all(stateId);
  res.json(cities);
};
