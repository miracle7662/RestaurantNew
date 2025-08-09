
const db = require('../config/db');

const baseSelectSql = `
  SELECT tg.*, h.hotel_name, u.username AS created_by
  FROM msttaxgroup tg
  LEFT JOIN msthotelmasters h ON tg.hotelid = h.hotelid
  LEFT JOIN mst_users u ON tg.created_by_id = u.userid
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

// Duplicate check functionality removed as requested

exports.getAllTaxGroups = (req, res) => {
  try {
    const { hotelid } = req.query;

    let sql = baseSelectSql;
    const params = [];

    if (hotelid) {
      sql += ' WHERE tg.hotelid = ?';
      params.push(hotelid);
    }

    sql += ' ORDER BY tg.taxgroupid DESC';

    const taxGroups = db.prepare(sql).all(params);

    sendSuccessResponse(res, { taxGroups, count: taxGroups.length });
  } catch (error) {
    sendErrorResponse(res, 'Error fetching tax groups:', error);
  }
};

exports.getTaxGroupById = (req, res) => {
  try {
    const { id } = req.params;

    const sql = baseSelectSql + ' WHERE tg.taxgroupid = ?';

    const taxGroup = db.prepare(sql).get(id);

    if (!taxGroup) {
      return sendErrorResponse(res, 'Tax group not found', null, 404);
    }

    sendSuccessResponse(res, taxGroup);
  } catch (error) {
    sendErrorResponse(res, 'Error fetching tax group:', error);
  }
};

exports.createTaxGroup = (req, res) => {
  try {
    const { taxgroup_name, hotelid, status, created_by_id } = req.body;

    if (!taxgroup_name) {
      return sendErrorResponse(res, 'Missing required field: taxgroup_name', null, 400);
    }

    const sql = `
      INSERT INTO msttaxgroup (taxgroup_name, hotelid, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    const params = [taxgroup_name, hotelid, status, created_by_id];

    const result = db.prepare(sql).run(params);

    sendSuccessResponse(res, { taxgroupid: result.lastInsertRowid }, 'Tax group created successfully', 201);
  } catch (error) {
    sendErrorResponse(res, 'Error creating tax group:', error);
  }
};

exports.updateTaxGroup = (req, res) => {
  try {
    const { id } = req.params;
    const { taxgroup_name, hotelid, status, updated_by_id } = req.body;

    if (
      taxgroup_name === undefined || taxgroup_name === null ||
      hotelid === undefined || hotelid === null ||
      status === undefined || status === null ||
      updated_by_id === undefined || updated_by_id === null
    ) {
      return sendErrorResponse(res, 'Missing required fields: taxgroup_name, hotelid, status, updated_by_id', null, 400);
    }

    const sql = `
      UPDATE msttaxgroup
      SET taxgroup_name = ?, hotelid = ?, status = ?, updated_by_id = ?, updated_date = datetime('now')
      WHERE taxgroupid = ?
    `;
    const params = [taxgroup_name, hotelid, parseInt(status), updated_by_id, parseInt(id)];

    const result = db.prepare(sql).run(params);

    if (result.changes === 0) {
      return sendErrorResponse(res, 'Tax group not found', null, 404);
    }

    sendSuccessResponse(res, null, 'Tax group updated successfully');
  } catch (error) {
    sendErrorResponse(res, 'Error updating tax group:', error);
  }
};

exports.deleteTaxGroup = (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM msttaxgroup WHERE taxgroupid = ?`;
    const result = db.prepare(sql).run(id);

    if (result.changes === 0) {
      return sendErrorResponse(res, 'Tax group not found', null, 404);
    }

    sendSuccessResponse(res, null, 'Tax group deleted successfully');
  } catch (error) {
    sendErrorResponse(res, 'Error deleting tax group:', error);
  }
}