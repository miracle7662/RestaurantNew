const db = require('../config/db');

// GET /api/orders/taxes?outletid=..&departmentid=..
// Returns { success, data: { outletid, departmentid, taxgroupid, taxes: { cgst, sgst, igst, cess } } }
exports.getTaxesByOutletAndDepartment = (req, res) => {
  try {
    const outletId = req.query.outletid ? Number(req.query.outletid) : null;
    const departmentId = req.query.departmentid ? Number(req.query.departmentid) : null;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'departmentid is required' });
    }

    const deptRow = db.prepare(
      `SELECT rm.restcgst AS cgst, td.outletid, rm.resttax_value, td.departmentid, rm.restsgst AS sgst, rm.restigst AS igst, rm.restcess AS cess, td.taxgroupid, tg.taxgroup_name
       FROM mst_resttaxmaster rm
       LEFT JOIN msttable_department td ON rm.taxgroupid = td.taxgroupid
       LEFT JOIN msttaxgroup tg ON td.taxgroupid = tg.taxgroupid
       WHERE td.departmentid = ? AND (td.outletid = ? OR ? IS NULL OR rm.isapplicablealloutlet = 1)
       ORDER BY (td.outletid = ?) DESC, rm.isapplicablealloutlet DESC
       LIMIT 1`
    ).get(departmentId, outletId, outletId, outletId);

    // If no row found with outlet, try without outlet filter
    if (!deptRow) {
      const fallbackRow = db.prepare(
        `SELECT rm.restcgst AS cgst, td.outletid, rm.resttax_value, td.departmentid, rm.restsgst AS sgst, rm.restigst AS igst, rm.restcess AS cess, td.taxgroupid, tg.taxgroup_name
         FROM mst_resttaxmaster rm
         LEFT JOIN msttable_department td ON rm.taxgroupid = td.taxgroupid
         LEFT JOIN msttaxgroup tg ON td.taxgroupid = tg.taxgroupid
         WHERE td.departmentid = ?
         LIMIT 1`
      ).get(departmentId);
      
      if (fallbackRow) {
        console.log('Using fallback row:', fallbackRow);
        console.log('Fallback - Individual tax values from DB:');
        console.log('- cgst (restcgst):', fallbackRow.cgst, 'Type:', typeof fallbackRow.cgst);
        console.log('- sgst (restsgst):', fallbackRow.sgst, 'Type:', typeof fallbackRow.sgst);
        console.log('- igst (restigst):', fallbackRow.igst, 'Type:', typeof fallbackRow.igst);
        console.log('- cess (restcess):', fallbackRow.cess, 'Type:', typeof fallbackRow.cess);
        
        const fallbackTaxes = {
          cgst: Number(fallbackRow.cgst) || 0,
          sgst: Number(fallbackRow.sgst) || 0,
          igst: Number(fallbackRow.igst) || 0,
          cess: Number(fallbackRow.cess) || 0
        };
        
        console.log('Fallback computed taxes:', fallbackTaxes);
        console.log('Fallback IGST specifically:', fallbackTaxes.igst, 'Type:', typeof fallbackTaxes.igst);
        
        return res.status(200).json({
          success: true,
          data: {
            departmentid: departmentId,
            taxgroupid: fallbackRow.taxgroupid,
            taxes: fallbackTaxes
          }
        });
      }
    }

    console.log('Query params:', { departmentId, outletId });
    console.log('Raw deptRow:', deptRow);

    if (!deptRow) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const resolvedOutletId = outletId || (deptRow && deptRow.outletid) || null;
    const taxGroupId = deptRow.taxgroupid || null;

    if (!taxGroupId) {
      return res.status(200).json({
        success: true,
        data: {
          outletid: resolvedOutletId,
          departmentid: departmentId,
          taxgroupid: null,
          taxes: { cgst: 0, sgst: 0, igst: 0, cess: 0 }
        }
      });
    }

    // Use the same row we already fetched
    const taxRow = deptRow;

    // Debug individual tax values
    console.log('Individual tax values from DB:');
    console.log('- cgst (restcgst):', taxRow.cgst, 'Type:', typeof taxRow.cgst);
    console.log('- sgst (restsgst):', taxRow.sgst, 'Type:', typeof taxRow.sgst);
    console.log('- igst (restigst):', taxRow.igst, 'Type:', typeof taxRow.igst);
    console.log('- cess (restcess):', taxRow.cess, 'Type:', typeof taxRow.cess);

    const taxes = taxRow
      ? { 
          cgst: Number(taxRow.cgst) || 0, 
          sgst: Number(taxRow.sgst) || 0, 
          igst: Number(taxRow.igst) || 0, 
          cess: Number(taxRow.cess) || 0 
        }
      : { cgst: 0, sgst: 0, igst: 0, cess: 0 };

    console.log('Tax row found:', taxRow);
    console.log('Computed taxes:', taxes);
    console.log('IGST specifically:', taxes.igst, 'Type:', typeof taxes.igst);

    return res.status(200).json({
      success: true,
      data: {
        departmentid: departmentId,
        taxgroupid: taxGroupId,
        taxes
      }
    });
  } catch (err) {
    console.error('Error fetching taxes by outlet/department:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch taxes', error: err.message });
  }
};

exports.getShiftTypes = (req, res) => {
  try {
    const sql = `
      SELECT id, shift_type
      FROM mstshifts
     
    `;
    const rows = db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching shifts:", err);
    res.status(500).json({ error: err.message });
  }
};



module.exports = exports;
