const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

exports.getUserType = async (req, res) => {
    try {
        const [userTypes] = await db.query('SELECT * FROM mstuserType');
        res.json({
            success: true,
            count: userTypes.length,
            data: userTypes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user types', data: [] });
    }
};

exports.addUserType = async (req, res) => {
    try {
        const { User_type, status, created_by_id, created_date, hotelid } = req.body;

        const [result] = await db.query(
            'INSERT INTO mstuserType (User_type, status, created_by_id, created_date, hotelid) VALUES (?, ?, ?, ?, ?)',
[User_type, status, created_by_id, formatMySQLDate(created_date), hotelid]
        );

        const newUserType = {
            usertypeid: result.insertId,
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
        res.status(500).json({ success: false, message: 'Failed to add user type' });
    }
};


exports.updateUserType = async (req, res) => {
    const { id } = req.params;
    const { User_type, status, updated_by_id, updated_date, hotelid } = req.body;

    await db.query(
        'UPDATE mstuserType SET User_type = ?, status = ?, updated_by_id = ?, updated_date = ?, hotelid = ? WHERE usertypeid = ?',
[User_type, status, updated_by_id, formatMySQLDate(updated_date), hotelid, id]
    );

    res.json({ id, User_type, status, updated_by_id, updated_date, hotelid });

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


exports.deleteUserType = async (req, res) => {
    const { id } = req.params;

    await db.query(
        'DELETE FROM mstuserType WHERE usertypeid = ?',
        [id]
    );

    res.json({ success: true, data: { usertypeid: id } });
};