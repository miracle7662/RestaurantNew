const db = require('../config/db');

const getKitchenAllocation = async (req, res) => {
    try {
        const { fromDate, toDate, hotelId, outletId, filterType, filterId } = req.query;

        // Base query
        let query = `
            SELECT
                DATE(t.TxnDatetime)              AS TxnDate,
                t.HotelID,
                t.outletid,
                d.item_no,
                d.item_name,
                SUM(d.Qty)                       AS TotalQty,
                SUM(d.Qty * d.RuntimeRate)       AS Amount,
                t.UserId,
                u.username,
                t.DeptID,
                td.department_name,
                k.Kitchen_main_Group             AS kitchen_category,
                i.itemgroupname                  AS item_group
            FROM TAxnTrnbilldetails d
            JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
            LEFT JOIN msttable_department td ON td.departmentid = t.DeptID
            LEFT JOIN mst_users u ON u.userid = t.UserId
            LEFT JOIN mstrestmenu m ON m.restitemid = d.ItemID
            LEFT JOIN mstkitchenmaingroup k ON k.kitchenmaingroupid = m.kitchen_main_group_id
            LEFT JOIN mst_Item_Group i ON i.item_groupid = m.item_group_id
            WHERE DATE(t.TxnDatetime) BETWEEN ? AND ?
              AND t.HotelID = ?
              AND d.isCancelled = 0
        `;

        const params = [fromDate, toDate, hotelId];

        if (outletId) {
            query += ' AND t.outletid = ?';
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
                case 'department':
                    query += ' AND t.DeptID = ?';
                    params.push(filterId);
                    break;
                case 'user':
                    query += ' AND t.UserId = ?';
                    params.push(filterId);
                    break;
                default:
                    // No additional filter
                    break;
            }
        }

        // Add GROUP BY
        query += `
            GROUP BY
                DATE(t.TxnDatetime),
                t.HotelID,
                t.outletid,
                d.item_no,
                d.item_name,
                t.UserId,
                u.username,
                t.DeptID,
                td.department_name,
                k.Kitchen_main_Group,
                i.itemgroupname
            ORDER BY TxnDate, d.item_name
        `;

        // Debug logging
        console.log('Filter Type:', filterType);
        console.log('Filter ID:', filterId);
        console.log('SQL Query:', query);
        console.log('Parameters:', params);

        const results = db.prepare(query).all(...params);

        res.status(200).json({
            success: true,
            data: results,
            message: 'Kitchen allocation data retrieved successfully'
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

module.exports = {
    getKitchenAllocation
};
