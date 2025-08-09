const db = require('../config/db');

// Get all menu items with joins
exports.getAllMenuItems = (req, res) => {
    try {
        const { hotelid, outletid } = req.query;
        
        let query = `
            SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   o.outlet_name,
                   h.hotel_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON md.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            WHERE m.status = 1
        `;
        
        const params = [];
        
        if (hotelid) {
            query += ' AND m.hotelid = ?';
            params.push(hotelid);
        }
        if (outletid) {
            query += ' AND md.outletid = ?';
            params.push(outletid);
        }
        
        query += ' ORDER BY m.created_date DESC';
        
        const menuItems = db.prepare(query).all(...params);
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get menu item by ID with joins
exports.getMenuItemById = (req, res) => {
    try {
        const { id } = req.params;
        
        const menuItem = db.prepare(`
            SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   o.outlet_name,
                   h.hotel_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON md.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            WHERE m.restitemid = ? AND m.status = 1
        `).get(id);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
};

// Create menu item with details
exports.createMenuItemWithDetails = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing or empty' });
        }

        console.log('Request body:', req.body);

        const {
            hotelid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, created_by_id, outlet_details
        } = req.body;

        // Validate required fields
        if (!item_name || !price || !hotelid) {
            return res.status(400).json({ message: 'Required fields missing', missing: { item_name, price, hotelid } });
        }

        // Validate stock_unit
        if (stock_unit && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(stock_unit)) {
            return res.status(400).json({ message: `Invalid stock_unit: ${stock_unit}` });
        }

        // Validate outlet_details if provided
        if (outlet_details && !Array.isArray(outlet_details)) {
            return res.status(400).json({ message: 'Outlet details must be an array' });
        }

        // Validate unitid and servingunitid in outlet_details
        if (outlet_details && outlet_details.length > 0) {
            for (const detail of outlet_details) {
                if (detail.unitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(detail.unitid)) {
                    return res.status(400).json({ message: `Invalid unitid: ${detail.unitid}` });
                }
                if (detail.servingunitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(detail.servingunitid)) {
                    return res.status(400).json({ message: `Invalid servingunitid: ${detail.servingunitid}` });
                }
            }
        }

        // Validate outlet IDs if provided
        if (outlet_details && outlet_details.length > 0) {
            const outletIds = outlet_details.map(detail => parseInt(detail.outletid)).filter(id => !isNaN(id));
            if (outletIds.length === 0) {
                return res.status(400).json({ message: 'No valid outlet IDs provided' });
            }

            const outlets = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid IN (' + outletIds.map(() => '?').join(',') + ') AND status = 0').all(...outletIds);
            console.log('Queried outlets:', outlets);
            if (outlets.length !== outletIds.length) {
                const foundOutletIds = outlets.map(outlet => outlet.outletid);
                const invalidOutletIds = outletIds.filter(id => !foundOutletIds.includes(id));
                console.error('Invalid or inactive outlet IDs:', invalidOutletIds);
                return res.status(400).json({ message: 'One or more outlet IDs are invalid or inactive', invalidOutletIds });
            }

            // Ensure all outlets belong to the same hotel
            const hotelIds = [...new Set(outlets.map(outlet => outlet.hotelid))];
            if (hotelIds.length > 1 || (hotelIds[0] !== parseInt(hotelid))) {
                return res.status(400).json({ message: 'Selected outlets must belong to the specified hotel', hotelid, outletHotelIds: hotelIds });
            }
        }

        // Insert into mstrestmenu
        const stmt = db.prepare(`
            INSERT INTO mstrestmenu (
                hotelid, item_no, item_name, print_name, short_name, kitchen_category_id,
                kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
                stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
                item_description, item_hsncode, status, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `);

        const result = stmt.run(
            hotelid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit || null, price, taxgroupid, is_runtime_rates || 0, is_common_to_all_departments || 0,
            item_description, item_hsncode, created_by_id
        );

        const restitemid = result.lastInsertRowid;

        // Insert outlet details if provided
        if (outlet_details && outlet_details.length > 0) {
            const insertDetailStmt = db.prepare(`
                INSERT INTO mstrestmenudetails (
                    restitemid, outletid, item_rate, unitid, servingunitid, IsConversion, hotelid
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (const detail of outlet_details) {
                insertDetailStmt.run(
                    restitemid,
                    detail.outletid,
                    detail.item_rate,
                    detail.unitid,
                    detail.servingunitid,
                    detail.IsConversion || 0,
                    hotelid
                );
            }
        }

        // Fetch the created item with joins for response
        const createdItem = db.prepare(`
            SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   o.outlet_name,
                   h.hotel_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON md.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            WHERE m.restitemid = ? AND m.status = 1
        `).get(restitemid);

        res.json(createdItem);

    } catch (error) {
        console.error('Error creating menu item with details:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update menu item with details
exports.updateMenuItemWithDetails = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing or empty' });
        }

        console.log('Request body:', req.body);

        const { id } = req.params;
        const {
            item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, status, updated_by_id, outlet_details
        } = req.body;

        const existingItem = db.prepare('SELECT restitemid, hotelid FROM mstrestmenu WHERE restitemid = ?').get(id);
        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Validate stock_unit
        if (stock_unit && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(stock_unit)) {
            return res.status(400).json({ message: `Invalid stock_unit: ${stock_unit}` });
        }

        // Validate outlet_details if provided
        if (outlet_details && !Array.isArray(outlet_details)) {
            return res.status(400).json({ message: 'Outlet details must be an array' });
        }

        // Validate unitid and servingunitid in outlet_details
        if (outlet_details && outlet_details.length > 0) {
            for (const detail of outlet_details) {
                if (detail.unitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(detail.unitid)) {
                    return res.status(400).json({ message: `Invalid unitid: ${detail.unitid}` });
                }
                if (detail.servingunitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(detail.servingunitid)) {
                    return res.status(400).json({ message: `Invalid servingunitid: ${detail.servingunitid}` });
                }
            }
        }

        // Validate outlet IDs if provided
        if (outlet_details && outlet_details.length > 0) {
            const outletIds = outlet_details.map(detail => parseInt(detail.outletid)).filter(id => !isNaN(id));
            if (outletIds.length === 0) {
                return res.status(400).json({ message: 'No valid outlet IDs provided' });
            }

            const outlets = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid IN (' + outletIds.map(() => '?').join(',') + ') AND status = 0').all(...outletIds);
            console.log('Queried outlets:', outlets);
            if (outlets.length !== outletIds.length) {
                const foundOutletIds = outlets.map(outlet => outlet.outletid);
                const invalidOutletIds = outletIds.filter(id => !foundOutletIds.includes(id));
                console.error('Invalid or inactive outlet IDs:', invalidOutletIds);
                return res.status(400).json({ message: 'One or more outlet IDs are invalid or inactive', invalidOutletIds });
            }

            // Ensure all outlets belong to the same hotel
            const hotelIds = [...new Set(outlets.map(outlet => outlet.hotelid))];
            if (hotelIds.length > 1 || (hotelIds[0] !== parseInt(existingItem.hotelid))) {
                return res.status(400).json({ message: 'Selected outlets must belong to the item\'s hotel', hotelid: existingItem.hotelid, outletHotelIds: hotelIds });
            }
        }

        // Update mstrestmenu
        const updateFields = [];
        const params = [];

        if (item_no !== undefined) {
            updateFields.push('item_no = ?');
            params.push(item_no);
        }
        if (item_name) {
            updateFields.push('item_name = ?');
            params.push(item_name);
        }
        if (print_name !== undefined) {
            updateFields.push('print_name = ?');
            params.push(print_name);
        }
        if (short_name !== undefined) {
            updateFields.push('short_name = ?');
            params.push(short_name);
        }
        if (kitchen_category_id !== undefined) {
            updateFields.push('kitchen_category_id = ?');
            params.push(kitchen_category_id);
        }
        if (kitchen_sub_category_id !== undefined) {
            updateFields.push('kitchen_sub_category_id = ?');
            params.push(kitchen_sub_category_id);
        }
        if (kitchen_main_group_id !== undefined) {
            updateFields.push('kitchen_main_group_id = ?');
            params.push(kitchen_main_group_id);
        }
        if (item_group_id !== undefined) {
            updateFields.push('item_group_id = ?');
            params.push(item_group_id);
        }
        if (item_main_group_id !== undefined) {
            updateFields.push('item_main_group_id = ?');
            params.push(item_main_group_id);
        }
        if (stock_unit !== undefined) {
            updateFields.push('stock_unit = ?');
            params.push(stock_unit);
        }
        if (price !== undefined) {
            updateFields.push('price = ?');
            params.push(price);
        }
        if (taxgroupid !== undefined) {
            updateFields.push('taxgroupid = ?');
            params.push(taxgroupid);
        }
        if (is_runtime_rates !== undefined) {
            updateFields.push('is_runtime_rates = ?');
            params.push(is_runtime_rates);
        }
        if (is_common_to_all_departments !== undefined) {
            updateFields.push('is_common_to_all_departments = ?');
            params.push(is_common_to_all_departments);
        }
        if (item_description !== undefined) {
            updateFields.push('item_description = ?');
            params.push(item_description);
        }
        if (item_hsncode !== undefined) {
            updateFields.push('item_hsncode = ?');
            params.push(item_hsncode);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }

        updateFields.push('updated_by_id = ?');
        updateFields.push('updated_date = datetime(\'now\')');
        params.push(updated_by_id, id);

        if (updateFields.length > 2) {
            const stmt = db.prepare(`UPDATE mstrestmenu SET ${updateFields.join(', ')} WHERE restitemid = ?`);
            stmt.run(...params);
        }

        // Update outlet details if provided
        if (outlet_details && outlet_details.length > 0) {
            // Delete existing details
            db.prepare('DELETE FROM mstrestmenudetails WHERE restitemid = ?').run(id);

            // Insert new details
            const insertDetailStmt = db.prepare(`
                INSERT INTO mstrestmenudetails (
                    restitemid, outletid, item_rate, unitid, servingunitid, IsConversion, hotelid
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (const detail of outlet_details) {
                insertDetailStmt.run(
                    id,
                    detail.outletid,
                    detail.item_rate,
                    detail.unitid,
                    detail.servingunitid,
                    detail.IsConversion || 0,
                    existingItem.hotelid
                );
            }
        }

        // Fetch the updated item with joins for response
        const updatedItem = db.prepare(`
            SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   o.outlet_name,
                   h.hotel_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON md.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            WHERE m.restitemid = ? AND m.status = 1
        `).get(id);

        res.json(updatedItem);

    } catch (error) {
        console.error('Error updating menu item with details:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete menu item (soft delete)
exports.deleteMenuItem = (req, res) => {
    try {
        const { id } = req.params;
        const { updated_by_id } = req.body;

        const stmt = db.prepare('UPDATE mstrestmenu SET status = 0, updated_by_id = ?, updated_date = datetime(\'now\') WHERE restitemid = ?');
        stmt.run(updated_by_id, id);

        res.json({ message: 'Menu item deleted successfully' });

    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};