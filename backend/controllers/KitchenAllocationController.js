const db = require('../config/db');

/**
 * ✅ GET KITCHEN ALLOCATION
 */
const getKitchenAllocation = async (req, res) => {
  try {
    const { fromDate, toDate, hotelId, outletId, filterType, filterId } = req.query;

    console.log('🧑‍🍳 KitchenAllocation params:', { fromDate, toDate, hotelId, outletId, filterType, filterId });

    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
    }

    // ✅ Date handling
    const formatDate = (date) => {
      if (!date) return new Date().toISOString().split('T')[0];
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) throw new Error('Invalid date format');
      return parsed.toISOString().split('T')[0];
    };

    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    // ✅ Params
    const params = [startDate, endDate, hotelId];

    // ✅ WHERE conditions (IMPORTANT FIX)
    let where = `
      WHERE DATE(t.TxnDatetime) BETWEEN ? AND ?
      AND t.HotelID = ?
      AND d.isCancelled = 0
    `;

    if (outletId) {
      where += ' AND t.outletid = ?';
      params.push(outletId);
    }

    if (filterType && filterId) {
      if (filterType === 'kitchen-category') {
        where += ' AND m.kitchen_main_group_id = ?';
        params.push(filterId);
      } else if (filterType === 'item-group') {
        where += ' AND m.item_group_id = ?';
        params.push(filterId);
      }
    }

    // ✅ FINAL QUERY (FIXED)
    const query = `
      SELECT
        i.itemgroupname AS item_group,
        COALESCE(m.item_no, d.item_no) AS item_no,
        d.item_name,
        SUM(d.Qty) AS TotalQty,
        SUM(d.Qty * d.RuntimeRate) AS Amount
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
      LEFT JOIN mstrestmenu m ON m.restitemid = d.ItemID
      LEFT JOIN mst_Item_Group i ON i.item_groupid = m.item_group_id
      ${where}
      GROUP BY
        i.itemgroupname,
        COALESCE(m.item_no, d.item_no),
        d.item_name,
        t.outletid
      ORDER BY
        i.itemgroupname,
        t.outletid,
        d.item_name
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
 * ✅ GET ITEM DETAILS (EYE CLICK FIXED)
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

    // ✅ Date handling
    const formatDate = (date) => {
      if (!date) return new Date().toISOString().split('T')[0];
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) throw new Error('Invalid date format');
      return parsed.toISOString().split('T')[0];
    };

    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    // ✅ CRITICAL FIX (2 item_no params)
    const params = [item_no, item_no, startDate, endDate, hotelId];

    let query = `
      SELECT
        COALESCE(m.item_no, d.item_no) AS item_no,
        d.item_name,
        d.Qty,
        (d.Qty * d.RuntimeRate) AS Amount,
        d.KOTNo,
        t.TxnDatetime,
        t.table_name,
        t.TableID
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE (m.item_no = ? OR d.item_no = ?)
        AND DATE(t.TxnDatetime) BETWEEN ? AND ?
        AND t.HotelID = ?
        AND (d.isCancelled = 0 OR d.isCancelled IS NULL)
    `;

    if (outletId) {
      query += ' AND t.outletid = ?';
      params.push(outletId);
    }

    query += ' ORDER BY t.TxnDatetime DESC';

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