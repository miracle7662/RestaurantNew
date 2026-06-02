const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL HOTEL TAXES
exports.getHotelTaxes = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM hoteltaxmaster ORDER BY hotel_taxid DESC');

    // Ensure status is returned as number
    const formattedRows = rows.map(row => ({
      ...row,
      status: Number(row.status)
    }));

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: formattedRows
    });

  } catch (error) {
    console.error("Error fetching hotel taxes:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD HOTEL TAX
exports.addHotelTax = async (req, res) => {
  try {
    const { hotel_tax_value, hotel_cgst, hotel_sgst, hotel_igst, hotel_cess, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    // Ensure status is properly converted to integer
    const statusInt = parseInt(status) || 1;

    const query = `
      INSERT INTO hoteltaxmaster 
      (hotel_tax_value, hotel_cgst, hotel_sgst, hotel_igst, hotel_cess, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      hotel_tax_value,
      hotel_cgst,
      hotel_sgst,
      hotel_igst,
      hotel_cess,
      statusInt,
      created_by_id,
      created_date
    ]);

    // Fetch the inserted record to return complete data
    const [newRecord] = await db.execute(
      'SELECT * FROM hoteltaxmaster WHERE hotel_taxid = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Hotel tax added successfully",
      data: {
        ...newRecord[0],
        status: Number(newRecord[0].status)
      }
    });

  } catch (error) {
    console.error("Error adding hotel tax:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add hotel tax",
      error: error.message
    });
  }
};

// ✅ UPDATE HOTEL TAX
exports.updateHotelTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotel_tax_value, hotel_cgst, hotel_sgst, hotel_igst, hotel_cess, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    // Ensure status is properly converted to integer
    const statusInt = parseInt(status) || 0;

    const query = `
      UPDATE hoteltaxmaster 
      SET hotel_tax_value = ?, 
          hotel_cgst = ?, 
          hotel_sgst = ?, 
          hotel_igst = ?, 
          hotel_cess = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE hotel_taxid = ?
    `;

    const [result] = await db.execute(query, [
      hotel_tax_value,
      hotel_cgst,
      hotel_sgst,
      hotel_igst,
      hotel_cess,
      statusInt,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel tax record not found"
      });
    }

    // Fetch the updated record
    const [updatedRecord] = await db.execute(
      'SELECT * FROM hoteltaxmaster WHERE hotel_taxid = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Hotel tax updated successfully",
      data: {
        ...updatedRecord[0],
        status: Number(updatedRecord[0].status)
      }
    });

  } catch (error) {
    console.error("Error updating hotel tax:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hotel tax",
      error: error.message
    });
  }
};

// ✅ DELETE HOTEL TAX
exports.deleteHotelTax = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM hoteltaxmaster WHERE hotel_taxid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel tax record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel tax deleted successfully",
      data: { hotel_taxid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting hotel tax:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel tax",
      error: error.message
    });
  }
};