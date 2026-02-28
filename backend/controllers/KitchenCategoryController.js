const db = require('../config/db');

exports.getKitchenCategory = (req, res) => {
    const { hotelid } = req.query;
    let query = 'SELECT * FROM mstkitchencategory';
    const params = [];
    if (hotelid) {
      query += ' WHERE hotelid = ?';
      params.push(hotelid);
    }
    const KitchenCategory = db.prepare(query).all(...params);
    res.json({success: true, message: "Kitchen Category fetched successfully", data: KitchenCategory
});
};


exports.addKitchenCategory = (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO mstkitchencategory 
      (Kitchen_Category, alternative_category_name, Description, 
       alternative_category_Description, digital_order_image, 
       categorycolor, status, created_by_id, created_date, 
       hotelid, marketid, kitchenmaingroupid) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
    );

    res.status(201).json({
      success: true,
      message: "Kitchen Category added successfully",
      data: {
        id: result.lastInsertRowid,
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


exports.updateKitchenCategory = (req, res) => {
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

    const stmt = db.prepare(`
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
    `);

    stmt.run(
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
    );

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



exports.deleteKitchenCategory  = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstkitchencategory WHERE kitchencategoryid = ?');
    stmt.run(id);
    res.status(200).json({
  success: true,
  message: "Kitchen Category deleted successfully",
  data: { id },  // send the deleted item's id
  error: null
});
};
