const db = require('../config/db');

exports.getKitchenCategory = async (req, res) => {
    try {
        const { hotelid } = req.query;
        let query = 'SELECT * FROM mstkitchencategory';
        const params = [];
        if (hotelid) {
          query += ' WHERE hotelid = ?';
          params.push(hotelid);
        }
        const [KitchenCategory] = await db.query(query, params);
        res.json({success: true, message: "Kitchen Category fetched successfully", data: KitchenCategory});
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch Kitchen Category",
            data: null,
            error: error.message
        });
    }
};

exports.addKitchenCategory = async (req, res) => {
  try {
    const {
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid,
      kitchenmaingroupid
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO mstkitchencategory 
      (Kitchen_Category, alternative_category_name, Description, 
       alternative_category_Description, digital_order_image, 
       categorycolor, status, created_by_id, created_date, 
       hotelid, marketid, kitchenmaingroupid) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid,
      kitchenmaingroupid
    ]);

    res.status(201).json({
      success: true,
      message: "Kitchen Category added successfully",
      data: {
        id: result.insertId,
        Kitchen_Category,
        alternative_category_name,
        Description,
        alternative_category_Description,
        digital_order_image,
        categorycolor,
        status,
        created_by_id,
        created_date,
        hotelid,
        marketid,
        kitchenmaingroupid
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add Kitchen Category",
      data: null,
      error: error.message
    });
  }
};

exports.updateKitchenCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      status,
      updated_by_id,
      updated_date,
      kitchenmaingroupid
    } = req.body;

    const [result] = await db.query(`
      UPDATE mstkitchencategory 
      SET Kitchen_Category = ?, 
          alternative_category_name = ?, 
          Description = ?, 
          alternative_category_Description = ?, 
          digital_order_image = ?, 
          categorycolor = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?, 
          kitchenmaingroupid = ?
      WHERE kitchencategoryid = ?
    `, [
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      status,
      updated_by_id,
      updated_date,
      kitchenmaingroupid,
      id
    ]);

    res.status(200).json({
      success: true,
      message: "Kitchen Category updated successfully",
      data: {
        id,
        Kitchen_Category,
        alternative_category_name,
        Description,
        alternative_category_Description,
        digital_order_image,
        categorycolor,
        status,
        updated_by_id,
        updated_date,
        kitchenmaingroupid
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update Kitchen Category",
      data: null,
      error: error.message
    });
  }
};

exports.deleteKitchenCategory = async (req, res) => {
    try {
        const {id} = req.params;
        const [result] = await db.query('DELETE FROM mstkitchencategory WHERE kitchencategoryid = ?', [id]);
        res.status(200).json({
      success: true,
      message: "Kitchen Category deleted successfully",
      data: { id },
      error: null
    });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete Kitchen Category",
            data: null,
            error: error.message
        });
    }
};