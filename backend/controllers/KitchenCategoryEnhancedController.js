const db = require('../config/db');

const baseSelectSql = `
  SELECT kc.*, h.hotel_name, u.username AS created_by
  FROM mstkitchencategory kc
  LEFT JOIN msthotelmasters h ON kc.hotelid = h.hotelid
  LEFT JOIN mst_users u ON kc.created_by_id = u.userid
`;

function sendErrorResponse(res, message, error, statusCode = 500) {
  console.error(message, error);
  res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : undefined,
  });
}

function sendSuccessResponse(res, data, message = null, statusCode = 200) {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  res.status(statusCode).json(response);
}

exports.getAllKitchenCategories = (req, res) => {
  try {
    const { hotelid } = req.query;

    let sql = baseSelectSql;
    const params = [];

    if (hotelid) {
      sql += ' WHERE kc.hotelid = ?';
      params.push(hotelid);
    }

    sql += ' ORDER BY kc.kitchencategoryid DESC';

    const kitchenCategories = db.prepare(sql).all(params);

    sendSuccessResponse(res, { kitchenCategories, count: kitchenCategories.length });
  } catch (error) {
    sendErrorResponse(res, 'Error fetching kitchen categories:', error);
  }
};

exports.getKitchenCategoryById = (req, res) => {
  try {
    const { id } = req.params;

    const sql = baseSelectSql + ' WHERE kc.kitchencategoryid = ?';

    const kitchenCategory = db.prepare(sql).get(id);

    if (!kitchenCategory) {
      return sendErrorResponse(res, 'Kitchen category not found', null, 404);
    }

    sendSuccessResponse(res, kitchenCategory);
  } catch (error) {
    sendErrorResponse(res, 'Error fetching kitchen category:', error);
  }
};

exports.createKitchenCategory = (req, res) => {
  try {
    const { 
      Kitchen_Category, 
      alternative_category_name, 
      Description, 
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      hotelid, 
      status, 
      created_by_id,
      marketid 
    } = req.body;

    if (!Kitchen_Category) {
      return sendErrorResponse(res, 'Missing required field: Kitchen_Category', null, 400);
    }

    const sql = `
      INSERT INTO mstkitchencategory (
        Kitchen_Category, 
        alternative_category_name, 
        Description, 
        alternative_category_Description,
        digital_order_image,
        categorycolor,
        hotelid, 
        status, 
        created_by_id, 
        created_date,
        marketid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `;
    
    const params = [
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      hotelid,
      status,
      created_by_id,
      marketid
    ];

    const result = db.prepare(sql).run(params);

    sendSuccessResponse(res, { kitchencategoryid: result.lastInsertRowid }, 'Kitchen category created successfully', 201);
  } catch (error) {
    sendErrorResponse(res, 'Error creating kitchen category:', error);
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
      hotelid, 
      status, 
      updated_by_id,
      marketid 
    } = req.body;

    if (
      Kitchen_Category === undefined || Kitchen_Category === null ||
      hotelid === undefined || hotelid === null ||
      status === undefined || status === null ||
      updated_by_id === undefined || updated_by_id === null
    ) {
      return sendErrorResponse(res, 'Missing required fields', null, 400);
    }

    const sql = `
      UPDATE mstkitchencategory
      SET 
        Kitchen_Category = ?, 
        alternative_category_name = ?, 
        Description = ?, 
        alternative_category_Description = ?,
        digital_order_image = ?,
        categorycolor = ?,
        hotelid = ?, 
        status = ?, 
        updated_by_id = ?, 
        updated_date = datetime('now'),
        marketid = ?
      WHERE kitchencategoryid = ?
    `;
    
    const params = [
      Kitchen_Category,
      alternative_category_name,
      Description,
      alternative_category_Description,
      digital_order_image,
      categorycolor,
      hotelid,
      parseInt(status),
      updated_by_id,
      marketid,
      parseInt(id)
    ];

    const result = db.prepare(sql).run(params);

    if (result.changes === 0) {
      return sendErrorResponse(res, 'Kitchen category not found', null, 404);
    }

    sendSuccessResponse(res, null, 'Kitchen category updated successfully');
  } catch (error) {
    sendErrorResponse(res, 'Error updating kitchen category:', error);
  }
};

exports.deleteKitchenCategory = (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM mstkitchencategory WHERE kitchencategoryid = ?`;
    const result = db.prepare(sql).run(id);

    if (result.changes === 0) {
      return sendErrorResponse(res, 'Kitchen category not found', null, 404);
    }

    sendSuccessResponse(res, null, 'Kitchen category deleted successfully');
  } catch (error) {
    sendErrorResponse(res, 'Error deleting kitchen category:', error);
  }
};
