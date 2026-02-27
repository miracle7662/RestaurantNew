const db = require('../config/db');

exports.getmarkets = (req, res) => {
  try {
    const markets = db.prepare('SELECT * FROM mstmarkets').all();

    res.json({
      success: true,
      data: markets,
      message: "Markets fetched successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      data: [],
      message: error.message
    });
  }
};


exports.addmarkets = (req, res) => {
  try {
    const { market_name, status, created_by_id, created_date, updated_by_id, updated_date } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mstmarkets 
      (market_name, status, created_by_id, created_date, updated_by_id, updated_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      market_name,
      status,
      created_by_id,
      created_date,
      updated_by_id,
      updated_date
    );

    const newMarket = {
      marketid: result.lastInsertRowid,
      market_name,
      status,
      created_by_id,
      created_date,
      updated_by_id,
      updated_date
    };

    res.json({
      success: true,
      data: newMarket,
      message: "Market added successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};


exports.updatemarkets = (req, res) => {
  try {
    const { id } = req.params;
    const { market_name, status, updated_by_id, updated_date } = req.body;

    const stmt = db.prepare(`
      UPDATE mstmarkets 
      SET market_name = ?, status = ?, updated_by_id = ?, updated_date = ? 
      WHERE marketid = ?
    `);

    const result = stmt.run(market_name, status, updated_by_id, updated_date, id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Market not found"
      });
    }

    res.json({
      success: true,
      data: {
        marketid: parseInt(id),
        market_name,
        status,
        updated_by_id,
        updated_date
      },
      message: "Market updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};


exports.deletemarkets = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM mstmarkets WHERE marketid = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Market not found"
      });
    }

    res.json({
      success: true,
      data: null,
      message: "Market deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};