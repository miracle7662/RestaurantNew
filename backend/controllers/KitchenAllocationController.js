const db = require('../config/db');

/**
 * ✅ GET KITCHEN ALLOCATION (Filtered by KOTUsedDate with time)
 */
const getKitchenAllocation = async (req, res) => {
  try {
   const { fromDate, toDate, hotelId, outletId, userId, departmentId, itemGroupId, kitchenMainGroupId } = req.query;
    console.log('🧑‍🍳 KitchenAllocation params:', { fromDate, toDate, hotelId, outletId,   });

    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
    }

    // ✅ Date time handling - Support both date and datetime
    const formatDateTime = (dateTime) => {
      if (!dateTime) {
        // Default to start of today
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      // If already has time component (contains space or T with time)
      if (dateTime.includes(' ') || (dateTime.includes('T') && dateTime.split('T')[1].length > 0)) {
        // Replace T with space if needed
        let formatted = dateTime.replace('T', ' ');
        // Ensure time is present
        if (formatted.split(' ').length === 1) {
          formatted += ' 00:00:00';
        } else if (formatted.split(' ')[1].split(':').length === 2) {
          // Add seconds if missing
          formatted += ':00';
        }
        return formatted;
      }
      
      // Only date provided, add time
      return `${dateTime} 00:00:00`;
    };

    const formatEndDateTime = (dateTime) => {
      if (!dateTime) {
        // Default to end of today
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      // If already has time component
      if (dateTime.includes(' ') || (dateTime.includes('T') && dateTime.split('T')[1].length > 0)) {
        let formatted = dateTime.replace('T', ' ');
        if (formatted.split(' ').length === 1) {
          formatted += ' 23:59:59';
        } else if (formatted.split(' ')[1].split(':').length === 2) {
          formatted += ':59';
        }
        return formatted;
      }
      
      // Only date provided, add end of day time
      return `${dateTime} 23:59:59`;
    };

    const startDateTime = formatDateTime(fromDate);
    const endDateTime = formatEndDateTime(toDate);

    // ✅ Params
    const params = [startDateTime, endDateTime, hotelId];

    // ✅ WHERE conditions - Using KOTUsedDate with time
    let where = `
      WHERE d.KOTUsedDate BETWEEN ? AND ?
      AND t.HotelID = ?
      AND d.isCancelled = 0
    `;

    if (outletId) {
      where += ' AND t.outletid = ?';
      params.push(outletId);
    }

      // User filter
    if (userId) {
      where += ' AND t.UserID = ?';
      params.push(userId);
    }
    // Department filter
    if (departmentId) {
      where += ' AND t.DeptID = ?';
      params.push(departmentId);
    }
    // Item Group filter
    if (itemGroupId) {
      where += ' AND m.item_group_id = ?';
      params.push(itemGroupId);
    }
    // Kitchen Main Group filter
    if (kitchenMainGroupId) {
      where += ' AND m.kitchen_main_group_id = ?';
      params.push(kitchenMainGroupId);
    }

    // ✅ FINAL QUERY (Using KOTUsedDate with time)
    const query = `
     SELECT
        i.itemgroupname AS item_group,
        COALESCE(m.item_no, d.item_no) AS item_no,
        d.item_name,
        SUM(d.Qty - d.RevQty) AS TotalQty,
        d.RuntimeRate,
        SUM(d.RevQty) as RevQty,
        SUM((d.Qty - d.RevQty) * d.RuntimeRate) AS Amount
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
      LEFT JOIN mstrestmenu m ON m.restitemid = d.ItemID
      LEFT JOIN mst_Item_Group i ON i.item_groupid = m.item_group_id
   ${where}
      GROUP BY
        i.itemgroupname,
        COALESCE(m.item_no, d.item_no),
        d.item_name,
        t.outletid,
        d.RuntimeRate
      ORDER BY
            COALESCE(m.item_no, d.item_no) ASC;
    `;

    console.log('📊 SQL Query:', query);
    console.log('🔧 SQL Params:', params);

    const [results] = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: results,
      message: results.length ? 'Data fetched successfully' : 'No data found'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


/**
 * ✅ GET ITEM DETAILS (Filtered by KOTUsedDate with time)
 */
const getItemDetails = async (req, res) => {
  try {
    const { item_no } = req.params;
    const { fromDate, toDate, hotelId, outletId } = req.query;

    console.log('🔍 getItemDetails:', { item_no, fromDate, toDate, hotelId, outletId });

    if (!item_no || !hotelId) {
      return res.status(400).json({
        success: false,
        message: 'item_no and hotelId are required'
      });
    }

    // ✅ Date time handling
    const formatDateTime = (dateTime) => {
      if (!dateTime) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (dateTime.includes(' ') || (dateTime.includes('T') && dateTime.split('T')[1].length > 0)) {
        let formatted = dateTime.replace('T', ' ');
        if (formatted.split(' ').length === 1) {
          formatted += ' 00:00:00';
        } else if (formatted.split(' ')[1].split(':').length === 2) {
          formatted += ':00';
        }
        return formatted;
      }
      
      return `${dateTime} 00:00:00`;
    };

    const formatEndDateTime = (dateTime) => {
      if (!dateTime) {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (dateTime.includes(' ') || (dateTime.includes('T') && dateTime.split('T')[1].length > 0)) {
        let formatted = dateTime.replace('T', ' ');
        if (formatted.split(' ').length === 1) {
          formatted += ' 23:59:59';
        } else if (formatted.split(' ')[1].split(':').length === 2) {
          formatted += ':59';
        }
        return formatted;
      }
      
      return `${dateTime} 23:59:59`;
    };

    const startDateTime = formatDateTime(fromDate);
    const endDateTime = formatEndDateTime(toDate);

    // ✅ Params with datetime
    const params = [item_no, item_no, startDateTime, endDateTime, hotelId];

    let query = `
      SELECT
        COALESCE(m.item_no, d.item_no) AS item_no,
        d.item_name,
        d.Qty,
        (d.Qty * d.RuntimeRate) AS Amount,
        d.KOTNo,
        d.KOTUsedDate AS TxnDatetime,
        t.table_name,
        t.TableID
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE (m.item_no = ? OR d.item_no = ?)
        AND d.KOTUsedDate BETWEEN ? AND ?
        AND t.HotelID = ?
        AND (d.isCancelled = 0 OR d.isCancelled IS NULL)
    `;

    if (outletId) {
      query += ' AND t.outletid = ?';
      params.push(outletId);
    }

    query += ' ORDER BY d.KOTUsedDate DESC';

    console.log('📊 SQL Query:', query);
    console.log('🔧 Params:', params);

    const [results] = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: results,
      message: results.length ? 'Item details fetched' : 'No item details found'
    });

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


module.exports = {
  getKitchenAllocation,
  getItemDetails
};