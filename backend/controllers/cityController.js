const db = require('../config/db');

exports.getCities = (req, res) => {
    const cities = db.prepare('SELECT * FROM mstcitymaster').all();
    res.json({
            success: true,
            message: "Cities fetched successfully",
            data: cities,
            error: null
        });
};

exports.addCity = (req, res) => {
    const { city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date } = req.body;
    // Convert boolean to integer for SQLite
   
    const stmt = db.prepare('INSERT INTO mstcitymaster (city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date) VALUES (?, ?, ?, ?, ?,?,?)');
    const result = stmt.run(city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date);
   res.status(200).json({
  success: true,
  message: "City created successfully",
  data: {
    id: result.lastInsertRowid,
    city_name,
    city_Code,
    stateId,
    iscoastal,
    status,
    created_by_id,
    created_date
  }
});
};

exports.updateCity = (req, res) => {
    const { id } = req.params;
    const { city_name, city_Code, stateId, iscoastal, status,updated_by_id,updated_date} = req.body;
    // Convert boolean to integer for SQLite
   
    const stmt = db.prepare('UPDATE mstcitymaster SET city_name = ?, city_Code = ?, stateId = ?, iscoastal = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE cityid = ?');
    stmt.run(city_name, city_Code, stateId, iscoastal, status,updated_by_id,updated_date ,id);
   res.status(200).json({
  success: true,
  message: "City updated successfully",
  data: {
    id,
    city_name,
    city_Code,
    stateId,
    iscoastal,
    status,
    updated_by_id,
    updated_date
  }
});
};

exports.deleteCity = (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM mstcitymaster WHERE cityid = ?');
        const result = stmt.run(id);
        if (result.changes > 0) {
            res.json({
                success: true,
                message: 'City deleted successfully',
                data: null,
                error: null
            });
        } else {
            res.json({
                success: false,
                message: 'City not found or already deleted',
                data: null,
                error: 'No rows affected'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete city',
            data: null,
            error: error.message
        });
    }
};

// controllers/cityController.js
exports.getCitiesByState = (req, res) => {
  const { stateId } = req.params;
  const cities = db.prepare('SELECT * FROM mstcitymaster WHERE stateId = ?').all(stateId);
  res.json(cities);
};
