const db = require('../config/db');

// ✅ getCities
exports.getCities = async (req, res) => {
    const [cities] = await db.query('SELECT * FROM mstcitymaster');
    res.json({
        success: true,
        message: "Cities fetched successfully",
        data: cities,
        error: null
    });
};


// ✅ addCity
exports.addCity = async (req, res) => {
    const { city_name, city_Code, stateId, iscoastal, status, created_by_id, created_date } = req.body;

    const [result] = await db.query(
        'INSERT INTO mstcitymaster (city_name, city_Code, stateId, iscoastal, status,created_by_id,created_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [city_name, city_Code, stateId, iscoastal, status, created_by_id, created_date]
    );

    res.status(200).json({
        success: true,
        message: "City created successfully",
        data: {
            id: result.insertId,
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


// ✅ updateCity
exports.updateCity = async (req, res) => {
    const { id } = req.params;
    const { city_name, city_Code, stateId, iscoastal, status, updated_by_id, updated_date } = req.body;

    const [result] = await db.query(
        'UPDATE mstcitymaster SET city_name = ?, city_Code = ?, stateId = ?, iscoastal = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE cityid = ?',
        [city_name, city_Code, stateId, iscoastal, status, updated_by_id, updated_date, id]
    );

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


// ✅ deleteCity
exports.deleteCity = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM mstcitymaster WHERE cityid = ?',
            [id]
        );

        if (result.affectedRows > 0) {
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


// ✅ getCitiesByState
exports.getCitiesByState = async (req, res) => {
    const { stateId } = req.params;

    const [cities] = await db.query(
        'SELECT * FROM mstcitymaster WHERE stateId = ?',
        [stateId]
    );

    res.json(cities);
};