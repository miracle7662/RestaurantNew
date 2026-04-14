const db = require('../config/db');

const getKitchenAllocation = async (req, res) => {
    try {
        const { fromDate, toDate, hotelId, outletId, filterType, filterId } = req.query;

        // Base query
        let query = `
            SELECT
                i.itemgroupname AS item_group,
                d.item_no,
                d.item_name,
                SUM(d.Qty) AS TotalQty,
                SUM(d.Qty * d.RuntimeRate) AS Amount
            FROM TAxnTrnbilldetails d
            INNER JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
            LEFT JOIN mstrestmenu m ON m.restitemid = d.ItemID
            LEFT JOIN mst_Item_Group i ON i.item_groupid = m.item_group_id
            WHERE DATE(t.TxnDatetime) BETWEEN ? AND ?
                AND t.HotelID = ?
                AND d.isCancelled = 0
        `;

        const params = [fromDate, toDate, hotelId];

        // Add outlet filter if provided
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
                default:
                    break;
            }
        }

        // GROUP BY and ORDER BY clauses
        query += `
            GROUP BY i.itemgroupname, d.item_no, d.item_name
            ORDER BY i.itemgroupname, d.item_name
        `;

        // Execute MySQL query
        const [results] = await db.query(query, params);

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

const getItemDetails = async (req, res) => {
    try {
        const { item_no } = req.params;
        const { fromDate, toDate, hotelId, outletId } = req.query;

        if (!item_no) {
            return res.status(400).json({
                success: false,
                message: 'Item number is required'
            });
        }

        // Validate required parameters
        if (!fromDate || !toDate || !hotelId) {
            return res.status(400).json({
                success: false,
                message: 'fromDate, toDate, and hotelId are required'
            });
        }

        let query = `
            SELECT
                d.item_name,
                d.Qty,
                (d.Qty * d.RuntimeRate) AS Amount,
                d.KOTNo,
                t.TxnDatetime,
                t.table_name,
                t.TableID
            FROM TAxnTrnbilldetails d
            INNER JOIN TAxnTrnbill t ON t.TxnID = d.TxnID
            WHERE d.item_no = ?
                AND t.TxnDatetime >= ?
                AND t.TxnDatetime < DATE_ADD(?, INTERVAL 1 DAY)
                AND t.HotelID = ?
                AND (d.isCancelled = 0 OR d.isCancelled IS NULL)
        `;

        const params = [item_no, fromDate, toDate, hotelId];

        // Add outlet filter if provided
        if (outletId) {
            query += ` AND t.outletid = ?`;
            params.push(outletId);
        }

        // Add order by clause
        query += ` ORDER BY t.TxnDatetime DESC`;

        // Execute MySQL query
        const [results] = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: results,
            message: 'Item details retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching item details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve item details',
            error: error.message
        });
    }
};

module.exports = {
    getKitchenAllocation,
    getItemDetails
};