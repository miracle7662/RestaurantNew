const db = require('../config/db');

// Get all menu items with joins
exports.getAllMenuItems = (req, res) => {
    try {
        const { hotelid, outletid } = req.query;
        
        let query = `
           SELECT DISTINCT m.*,
                            o.outlet_name,
                            h.hotel_name,
                            ig.itemgroupname AS groupname
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON m.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            LEFT JOIN mst_item_group ig ON m.item_group_id = ig.item_groupid
            WHERE m.status IN (0,1)
        `;
        
        const params = [];
        
        if (hotelid) {
            query += ' AND m.hotelid = ?';
            params.push(parseInt(hotelid));
        }
        if (outletid) {
            query += ' AND m.outletid = ?';
            params.push(parseInt(outletid));
        }
        
        query += ' ORDER BY m.created_date DESC';
        
        const menuItems = db.prepare(query).all(...params);
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
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
                   h.hotel_name,
                   d.department_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON m.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            WHERE m.restitemid = ? AND m.status = 1
        `).get(parseInt(id));
        
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Failed to fetch menu item', details: error.message });
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
            hotelid, outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, created_by_id, department_details
        } = req.body;

        // Validate required fields
        if (!item_name || !price || !hotelid) {
            return res.status(400).json({ message: 'Required fields missing', missing: { item_name, price, hotelid } });
        }

        // Validate hotelid
        const parsedHotelId = parseInt(hotelid);
        if (isNaN(parsedHotelId) || !db.prepare('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId)) {
            return res.status(400).json({ message: `Invalid hotelid: ${hotelid}` });
        }

        // Validate outletid if provided
        if (outletid) {
            const parsedOutletId = parseInt(outletid);
            const outlet = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid = ? AND status = 0').get(parsedOutletId);
            if (!outlet) {
                return res.status(400).json({ message: `Invalid or inactive outletid: ${outletid}` });
            }
            if (outlet.hotelid !== parsedHotelId) {
                return res.status(400).json({ message: 'Outlet does not belong to the specified hotel', hotelid: parsedHotelId, outletHotelId: outlet.hotelid });
            }
        }

        // Validate stock_unit
        if (stock_unit) {
            const parsedStockUnit = parseInt(stock_unit);
            if (!db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(parsedStockUnit)) {
                return res.status(400).json({ message: `Invalid stock_unit: ${stock_unit}` });
            }
        }

        // Validate department_details if provided
        if (department_details && !Array.isArray(department_details)) {
            return res.status(400).json({ message: 'Department details must be an array' });
        }

        // Validate departmentid and item_rate in department_details
        if (department_details && department_details.length > 0) {
            const departmentIds = department_details.map(detail => parseInt(detail.departmentid)).filter(id => !isNaN(id));
            if (departmentIds.length === 0 || departmentIds.includes(null)) {
                return res.status(400).json({ message: 'No valid department IDs provided or null departmentid detected' });
            }

            // Validate departmentid (removed status check to test; re-add if needed)
            const departments = db.prepare('SELECT departmentid FROM msttable_department WHERE departmentid IN (' + departmentIds.map(() => '?').join(',') + ')').all(...departmentIds);
            if (departments.length !== departmentIds.length) {
                const foundDepartmentIds = departments.map(dept => dept.departmentid);
                const invalidDepartmentIds = departmentIds.filter(id => !foundDepartmentIds.includes(id));
                console.error('Invalid department IDs:', invalidDepartmentIds);
                return res.status(400).json({ message: 'One or more department IDs are invalid', invalidDepartmentIds });
            }

        }

        // Insert into mstrestmenu with transaction
        db.transaction(() => {
            const stmt = db.prepare(`
                INSERT INTO mstrestmenu (
                    hotelid, outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
                    kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
                    stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
                    item_description, item_hsncode, status, created_by_id, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
            `);

            const result = stmt.run(
                parsedHotelId, outletid ? parseInt(outletid) : null, item_no, item_name, print_name, short_name, kitchen_category_id,
                kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
                stock_unit ? parseInt(stock_unit) : null, price, taxgroupid, is_runtime_rates || 0, is_common_to_all_departments || 0,
                item_description, item_hsncode, created_by_id
            );

            const restitemid = result.lastInsertRowid;

            // Insert department details if provided
            if (department_details && department_details.length > 0) {
                const insertDetailStmt = db.prepare(`
                    INSERT INTO mstrestmenudetails (
                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `);

                for (const detail of department_details) {
                    console.log('Inserting mstrestmenudetails:', {
                        restitemid,
                        departmentid: parseInt(detail.departmentid),
                        item_rate: detail.item_rate,
                        unitid: detail.unitid ? parseInt(detail.unitid) : null,
                        servingunitid: detail.servingunitid ? parseInt(detail.servingunitid) : null,
                        IsConversion: detail.IsConversion || 0,
                        hotelid: parsedHotelId
                    });
                    insertDetailStmt.run(
                        restitemid,
                        parseInt(detail.departmentid),
                        detail.item_rate,
                        detail.unitid ? parseInt(detail.unitid) : null,
                        detail.servingunitid ? parseInt(detail.servingunitid) : null,
                        detail.IsConversion || 0,
                        parsedHotelId
                    );
                }
            }

            // Fetch the created item with joins for response
            const createdItem = db.prepare(`
                SELECT m.*, 
                       md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                       o.outlet_name,
                       h.hotel_name,
                       d.department_name
                FROM mstrestmenu m
                LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
                LEFT JOIN mst_outlets o ON m.outletid = o.outletid
                LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                WHERE m.restitemid = ? AND m.status = 1
            `).get(restitemid);

            res.json(createdItem);
        })();
    } catch (error) {
        console.error('Error creating menu item with details:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
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
            outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, status, updated_by_id, department_details
        } = req.body;

        // Validate existing menu item
        const existingItem = db.prepare('SELECT restitemid, hotelid FROM mstrestmenu WHERE restitemid = ?').get(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Validate hotelid from existing item
        const parsedHotelId = parseInt(existingItem.hotelid);
        if (isNaN(parsedHotelId) || !db.prepare('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId)) {
            return res.status(400).json({ message: `Invalid or missing hotelid in existing menu item: ${existingItem.hotelid}` });
        }

        // Validate outletid if provided
        if (outletid) {
            const parsedOutletId = parseInt(outletid);
            const outlet = db.prepare('SELECT outletid, hotelid FROM mst_outlets WHERE outletid = ? AND status = 0').get(parsedOutletId);
            if (!outlet) {
                return res.status(400).json({ message: `Invalid or inactive outletid: ${outletid}` });
            }
            if (outlet.hotelid !== parsedHotelId) {
                return res.status(400).json({ message: 'Outlet does not belong to the item\'s hotel', hotelid: parsedHotelId, outletHotelId: outlet.hotelid });
            }
        }

        // Validate stock_unit
        if (stock_unit) {
            const parsedStockUnit = parseInt(stock_unit);
            if (!db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(parsedStockUnit)) {
                return res.status(400).json({ message: `Invalid stock_unit: ${stock_unit}` });
            }
        }

        // Validate department_details if provided
        if (department_details && !Array.isArray(department_details)) {
            return res.status(400).json({ message: 'Department details must be an array' });
        }

        // Validate departmentid and item_rate in department_details
        if (department_details && department_details.length > 0) {
            const departmentIds = department_details.map(detail => parseInt(detail.departmentid)).filter(id => !isNaN(id));
            if (departmentIds.length === 0 || departmentIds.includes(null)) {
                return res.status(400).json({ message: 'No valid department IDs provided or null departmentid detected' });
            }

            // Validate departmentid (removed status check to test; re-add if needed)
            const departments = db.prepare('SELECT departmentid FROM msttable_department WHERE departmentid IN (' + departmentIds.map(() => '?').join(',') + ')').all(...departmentIds);
            if (departments.length !== departmentIds.length) {
                const foundDepartmentIds = departments.map(dept => dept.departmentid);
                const invalidDepartmentIds = departmentIds.filter(id => !foundDepartmentIds.includes(id));
                console.error('Invalid department IDs:', invalidDepartmentIds);
                return res.status(400).json({ message: 'One or more department IDs are invalid', invalidDepartmentIds });
            }

            // Validate unitid and servingunitid
            const unitIds = [...new Set(department_details.flatMap(detail => [detail.unitid, detail.servingunitid]).filter(id => id !== null && id !== undefined))];
            if (unitIds.length > 0) {
                const validUnits = db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid IN (' + unitIds.map(() => '?').join(',') + ')').all(...unitIds);
                const validUnitIds = validUnits.map(unit => unit.unitid);
                const invalidUnitIds = unitIds.filter(id => !validUnitIds.includes(id));
                if (invalidUnitIds.length > 0) {
                    return res.status(400).json({ message: 'Invalid unit IDs', invalidUnitIds });
                }
            }

            // Validate item_rate and unitid/servingunitid
            for (const detail of department_details) {
                if (detail.item_rate == null || isNaN(detail.item_rate)) {
                    return res.status(400).json({ message: `Invalid or missing item_rate for departmentid: ${detail.departmentid}` });
                }
                // Assume unitid and servingunitid are required if provided
                if (detail.unitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(parseInt(detail.unitid))) {
                    return res.status(400).json({ message: `Invalid unitid: ${detail.unitid}` });
                }
                if (detail.servingunitid && !db.prepare('SELECT unitid FROM mstunitmaster WHERE unitid = ?').get(parseInt(detail.servingunitid))) {
                    return res.status(400).json({ message: `Invalid servingunitid: ${detail.servingunitid}` });
                }
            }
        }

        // Update mstrestmenu with transaction
        db.transaction(() => {
            const updateFields = [];
            const params = [];

            if (outletid !== undefined) {
                updateFields.push('outletid = ?');
                params.push(parseInt(outletid));
            }
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
                params.push(parseInt(stock_unit));
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
            params.push(updated_by_id, parseInt(id));

            if (updateFields.length > 2) {
                const stmt = db.prepare(`UPDATE mstrestmenu SET ${updateFields.join(', ')} WHERE restitemid = ?`);
                stmt.run(...params);
            }

            // Update department details if provided
            if (department_details && department_details.length > 0) {
                // Delete existing details
                db.prepare('DELETE FROM mstrestmenudetails WHERE restitemid = ?').run(parseInt(id));

                // Insert new details
                const insertDetailStmt = db.prepare(`
                    INSERT INTO mstrestmenudetails (
                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `);

                for (const detail of department_details) {
                    console.log('Inserting mstrestmenudetails:', {
                        restitemid: parseInt(id),
                        departmentid: parseInt(detail.departmentid),
                        item_rate: detail.item_rate,
                        unitid: detail.unitid ? parseInt(detail.unitid) : null,
                        servingunitid: detail.servingunitid ? parseInt(detail.servingunitid) : null,
                        IsConversion: detail.IsConversion || 0,
                        hotelid: parsedHotelId
                    });
                    insertDetailStmt.run(
                        parseInt(id),
                        parseInt(detail.departmentid),
                        detail.item_rate,
                        detail.unitid ? parseInt(detail.unitid) : null,
                        detail.servingunitid ? parseInt(detail.servingunitid) : null,
                        detail.IsConversion || 0,
                        parsedHotelId
                    );
                }
            }

            // Fetch the updated item with joins for response
            const updatedItem = db.prepare(`
                SELECT m.*, 
                       md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                       o.outlet_name,
                       h.hotel_name,
                       d.department_name
                FROM mstrestmenu m
                LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
                LEFT JOIN mst_outlets o ON m.outletid = o.outletid
                LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                WHERE m.restitemid = ? AND m.status = 1
            `).get(parseInt(id));

            res.json(updatedItem);
        })();
    } catch (error) {
        console.error('Error updating menu item with details:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

// Delete menu item (soft delete)
exports.deleteMenuItem = (req, res) => {
    try {
        const { id } = req.params;
        const { updated_by_id } = req.body;

        const existingItem = db.prepare('SELECT restitemid FROM mstrestmenu WHERE restitemid = ? AND status = 1').get(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found or already deleted' });
        }

        db.transaction(() => {
            db.prepare('UPDATE mstrestmenu SET status = 0, updated_by_id = ?, updated_date = datetime(\'now\') WHERE restitemid = ?').run(updated_by_id, parseInt(id));
            db.prepare('DELETE FROM mstrestmenudetails WHERE restitemid = ?').run(parseInt(id));
        })();

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};