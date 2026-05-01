const db = require('../config/db');


const getKitchenAllocation = async (req, res) => {
    try {
        const { fromDate, toDate, hotelId, outletId, filterType, filterId } = req.query;

        // 🔍 DEBUG LOGGING & VALIDATION
        console.log('🧑‍🍳 KitchenAllocation params:', { fromDate, toDate, hotelId, outletId, filterType, filterId });

        // Validate & format dates
        let startDate = fromDate;
        let endDate = toDate;
        if (fromDate) {
            const parsed = new Date(fromDate);
            if (isNaN(parsed.getTime())) {
                console.warn('⚠️ Invalid fromDate format:', fromDate);
                return res.status(400).json({ success: false, message: 'Invalid fromDate format (use YYYY-MM-DD)' });
            }
            startDate = parsed.toISOString().split('T')[0];
        } else {
            startDate = new Date().toISOString().split('T')[0]; // Today fallback
            console.log('📅 Using today as fromDate fallback');
        }
if (toDate) {
            const parsed = new Date(toDate);
            if (isNaN(parsed.getTime())) {
                console.warn('⚠️ Invalid toDate format:', toDate);
                return res.status(400).json({ success: false, message: 'Invalid toDate format (use YYYY-MM-DD)' });
            }
            endDate = parsed.toISOString().split('T')[0];
        } else {
            endDate = new Date().toISOString().split('T')[0];
            console.log('📅 Using today as toDate fallback');
        }

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'hotelId is required' });
        }

        // Base query
        let query = `
          SELECT
    i.itemgroupname              AS item_group,
    d.item_no,
    d.item_name,
    SUM(d.Qty)                   AS TotalQty,
    SUM(d.Qty * d.RuntimeRate)   AS Amount
FROM TAxnTrnbilldetails d
JOIN TAxnTrnbill t
    ON t.TxnID = d.TxnID
LEFT JOIN mstrestmenu m
    ON m.restitemid = d.ItemID
LEFT JOIN mst_Item_Group i
    ON i.item_groupid = m.item_group_id
WHERE DATE(t.TxnDatetime) BETWEEN ? AND ?
  AND t.HotelID = ?
  AND d.isCancelled = 0
GROUP BY
    i.itemgroupname,
    d.item_no,
    d.item_name,
    t.outletid
ORDER BY
    i.itemgroupname,
    t.outletid,
    d.item_name
        `;

        const params = [startDate, endDate, hotelId];

        if (outletId) {
            query = query.replace(
                'GROUP BY\n    i.itemgroupname,',
                'AND t.outletid = ?\nGROUP BY\n    i.itemgroupname,'
            );
            params.push(outletId);
        }

        // Apply dynamic filter based on filterType
        if (filterType && filterId) {
            switch (filterType) {
                case 'kitchen-category':
                    query += ' AND m.kitchen_main_group_id = ?';
                    params.push(filterId);
                    break;
                case 'item-group':
                    query += ' AND m.item_group_id = ?';
                    params.push(filterId);
                    break;
                default:
                    // No additional filter
                    break;
            }
        }

        // 🔍 DEBUG LOGGING - UNCOMMENTED & ENHANCED
        console.log('📊 SQL Query:', query);
        console.log('🔧 SQL Params:', params);

        const [results] = await db.query(query, params);

        console.log('📈 Results count:', results.length);
        if (results.length === 0) {
            console.log('❌ No items found - check date range, hotelId, outletId, or data in TAxnTrnbilldetails');
        }

        const message = results.length > 0 
            ? 'Kitchen allocation data retrieved successfully' 
            : 'No items found for the selected date range/hotel/outlet. Check logs for details.';
        
        res.status(200).json({
            success: true,
            data: results,
            message,
            debug: { startDate: startDate, endDate: endDate, paramsCount: params.length }
        });

    } catch (error) {
        console.error('Error fetching kitchen allocation data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve kitchen allocation data',
            error: error.message
        });
    }
};

const getItemDetails = async (req, res) => {
  try {
    const { item_no } = req.params;
    const { fromDate, toDate, hotelId, outletId } = req.query;

    // 🔍 DEBUG LOGGING & VALIDATION
    console.log('🔍 getItemDetails params:', { item_no, fromDate, toDate, hotelId, outletId });

    if (!item_no) {
      return res.status(400).json({
        success: false,
        message: 'Item number (item_no) is required in URL path'
      });
    }

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'hotelId is required in query params'
      });
    }

    // Validate & format dates with fallbacks
    let startDate = fromDate || new Date().toISOString().split('T')[0];
    let endDate = toDate || new Date().toISOString().split('T')[0];

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      console.warn('⚠️ Invalid date format:', { fromDate, toDate });
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2024-10-01)'
      });
    }

    startDate = parsedStart.toISOString().split('T')[0];
    endDate = parsedEnd.toISOString().split('T')[0];

    console.log('📅 Normalized dates:', { startDate, endDate });

    let query = `
      SELECT
        d.item_name,
        d.Qty,
        (d.Qty * d.RuntimeRate) AS Amount,
        d.KOTNo,
        t.TxnDatetime,
        t.table_name,
        t.TableID,
        t.outletid
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
      WHERE d.item_no = ?
        AND DATE(t.TxnDatetime) >= ?
        AND DATE(t.TxnDatetime) <= ?
        AND t.HotelID = ?
        AND (d.isCancelled = 0 OR d.isCancelled IS NULL)
    `;

    const params = [item_no, startDate, endDate, hotelId];

    if (outletId) {
      query += ' AND t.outletid = ?';
      params.push(outletId);
    }

    query += ' ORDER BY t.TxnDatetime DESC';

    console.log('📊 SQL Query:', query);
    console.log('🔧 SQL Params:', params);

    const [results] = await db.query(query, params);

    console.log('📈 Results count:', results.length);
    if (results.length === 0) {
      console.log('❌ No item details found - check item_no, date range, hotelId, or DB data');
    }

    const message = results.length > 0 
      ? 'Item details retrieved successfully' 
      : `No item details found for ${item_no} in date range ${startDate} to ${endDate} for hotel ${hotelId}`;

    res.status(200).json({
      success: true,
      data: results,
      message,
      debug: { startDate, endDate, item_no, hotelId, totalRecords: results.length }
    });

  } catch (error) {
    console.error('💥 Error fetching item details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item details',
      error: error.message,
      debug: 'Check server logs for details'
    });
  }
};


module.exports = {
    getKitchenAllocation,
    getItemDetails
};
