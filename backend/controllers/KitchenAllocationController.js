const db = require('../config/db');

const getKitchenAllocationData = (req, res) => {
  try {
    const { startDate, endDate, filterType, filterValue, hotelid, outletid } = req.query;

    // Default to today's date if not provided
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // Base query to aggregate item-wise data
    let query = `
      SELECT
        m.restitemid AS id,
        m.item_name AS itemName,
        m.item_no AS itemNo,
        SUM(td.Qty) AS quantity,
        SUM(td.RuntimeRate * td.Qty) AS amount,
        kc.Kitchen_Category AS kitchenCategory,
        ig.itemgroupname AS itemGroup,
        mt.table_name AS tableNo,
        d.department_name AS department,
        DATE(t.TxnDatetime) AS txnDate
      FROM TAxnTrnbill t
      INNER JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      INNER JOIN mstrestmenu m ON td.ItemID = m.restitemid
      LEFT JOIN mstkitchencategory kc ON m.kitchen_category_id = kc.kitchencategoryid
      LEFT JOIN mst_Item_Group ig ON m.item_group_id = ig.item_groupid
      LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
      LEFT JOIN msttable_department d ON mt.departmentid = d.departmentid
      WHERE DATE(t.TxnDatetime) BETWEEN ? AND ?
        AND t.hotelid = ?
        AND t.outletid = ?
        AND t.isCancelled = 0
        AND (t.isBilled = 1 OR t.isSetteled = 1)
    `;

    const params = [start, end, hotelid, outletid];

    // Apply filters
    if (filterType && filterValue) {
      switch (filterType) {
        case 'kitchen-category':
          query += ' AND kc.Kitchen_Category = ?';
          params.push(filterValue);
          break;
        case 'item-group':
          query += ' AND ig.itemgroupname = ?';
          params.push(filterValue);
          break;
        case 'table-department':
          const [tableNo, department] = filterValue.split(' - ');
          query += ' AND mt.table_name = ? AND d.department_name = ?';
          params.push(tableNo, department);
          break;
      }
    }

    query += ' GROUP BY m.restitemid ORDER BY m.item_name';

    const rows = db.prepare(query).all(...params);

    // Calculate totals
    const totals = rows.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + (item.quantity || 0),
        totalAmount: acc.totalAmount + (item.amount || 0)
      }),
      { totalQuantity: 0, totalAmount: 0 }
    );

    res.json({
      success: true,
      data: rows,
      totals
    });
  } catch (error) {
    console.error('Error fetching kitchen allocation data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch kitchen allocation data' });
  }
};

const getFilterOptions = (req, res) => {
  try {
    const { filterType, hotelid, outletid } = req.query;

    let query = '';
    const params = [hotelid, outletid];

    switch (filterType) {
      case 'kitchen-category':
        query = `
          SELECT DISTINCT kc.Kitchen_Category AS value, kc.Kitchen_Category AS label
          FROM TAxnTrnbill t
          INNER JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
          INNER JOIN mstrestmenu m ON td.ItemID = m.restitemid
          INNER JOIN mstkitchencategory kc ON m.kitchen_category_id = kc.kitchencategoryid
          WHERE t.hotelid = ? AND t.outletid = ?
            AND t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)
          ORDER BY kc.Kitchen_Category
        `;
        break;
      case 'item-group':
        query = `
          SELECT DISTINCT ig.itemgroupname AS value, ig.itemgroupname AS label
          FROM TAxnTrnbill t
          INNER JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
          INNER JOIN mstrestmenu m ON td.ItemID = m.restitemid
          INNER JOIN mst_Item_Group ig ON m.item_group_id = ig.item_groupid
          WHERE t.hotelid = ? AND t.outletid = ?
            AND t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)
          ORDER BY ig.itemgroupname
        `;
        break;
      case 'table-department':
        query = `
          SELECT DISTINCT (mt.table_name || ' - ' || d.department_name) AS value,
                         (mt.table_name || ' - ' || d.department_name) AS label
          FROM TAxnTrnbill t
          INNER JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
          INNER JOIN mstrestmenu m ON td.ItemID = m.restitemid
          LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
          LEFT JOIN msttable_department d ON mt.departmentid = d.departmentid
          WHERE t.hotelid = ? AND t.outletid = ?
            AND t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)
            AND mt.table_name IS NOT NULL AND d.department_name IS NOT NULL
          ORDER BY mt.table_name, d.department_name
        `;
        break;
      default:
        return res.json({ success: true, options: [] });
    }

    const options = db.prepare(query).all(...params);
    res.json({ success: true, options });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch filter options' });
  }
};

module.exports = { getKitchenAllocationData, getFilterOptions };
