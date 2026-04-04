
const db = require('../config/db');

// Stub functions to fix ReferenceErrors for raw material consumption
// Called during menu updates when flags are set



// Get all menu items with joins
exports.getAllMenuItems = (req, res) => {
    try {
        const { hotelid, outletid } = req.query;
        
let query = `
           SELECT DISTINCT m.*, m.consume_raw_materials_on_bill, m.consume_raw_materials_on_kot, m.store_name,
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
            const parsedOutletId = parseInt(outletid);
            const outlet = db.prepare('SELECT hotelid FROM mst_outlets WHERE outletid = ?').get(parsedOutletId);
            if (outlet) {
                query += ' AND (m.outletid = ? OR (m.hotelid = ? AND m.outletid IS NULL))';
                params.push(parsedOutletId, outlet.hotelid);
            } else {
                query += ' AND m.outletid = ?';
                params.push(parsedOutletId);
            }
        }
        
        query += ' ORDER BY m.created_date DESC';
        
        const menuItems = db.prepare(query).all(...params);
        
        const menuItemsWithDetails = menuItems.map(item => {
            const allDetails = db.prepare(`
                SELECT md.*, d.department_name, vv.value_name as variant_value_name
                FROM mstrestmenudetails md
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE md.restitemid = ?
            `).all(item.restitemid);
            
            return { ...item, department_details: allDetails };
        });
        
        res.json({ success: true, data: menuItemsWithDetails, count: menuItemsWithDetails.length });
    } catch (error) {
        // console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getMenuItemById = (req, res) => {
    try {
        const { id } = req.params;
        
        const menuItem = db.prepare(`
      SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   -- 🔥 NEW STOCK FIELDS + RAW MATERIALS 🔥
             m.is_ingredients_required, m.consume_on_bill, m.reverse_stock_cancel_kot,
             m.allow_negative_stock, m.opening_stock_quantity, m.opening_stock_unit_id,
             m.consume_raw_materials_on_bill, m.consume_raw_materials_on_kot, m.store_name,
                   m.consume_raw_materials_on_bill, m.consume_raw_materials_on_kot, m.store_name,
                   o.outlet_name,
                   h.hotel_name,
                   d.department_name,
                   vv.value_name
            FROM mstrestmenu m
            LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
            LEFT JOIN mst_outlets o ON m.outletid = o.outletid
            LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
            WHERE m.restitemid = ? AND m.status = 1
        `).get(parseInt(id));
        
        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found', data: null });
        }
        
        const allDetails = db.prepare(`
            SELECT md.*, d.department_name, vv.value_name as variant_value_name
            FROM mstrestmenudetails md
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
            WHERE md.restitemid = ?
        `).all(parseInt(id));
        
        res.json({ success: true, data: { ...menuItem, department_details: allDetails }, message: 'Menu item fetched successfully' });
    } catch (error) {
        // console.error('Error fetching menu item:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch menu item', details: error.message, data: null });
    }
};

exports.createMenuItemWithDetails = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing or empty' });
        }

        const {
            hotelid, outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, created_by_id, department_details,
            variant_type_id, variant_values,
            // 🔥 NEW STOCK FIELDS 🔥
            is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot, 
            allow_negative_stock, opening_stock_quantity, opening_stock_unit_id
        } = req.body;

        if (!item_name || !price || !hotelid) {
            return res.status(400).json({ message: 'Required fields missing', missing: { item_name, price, hotelid } });
        }

        const parsedHotelId = parseInt(hotelid);
        if (isNaN(parsedHotelId) || !db.prepare('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId)) {
            return res.status(400).json({ message: `Invalid hotelid: ${hotelid}` });
        }

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

        const isVariantProduct = variant_type_id && variant_values && variant_values.length > 0;

        db.transaction(() => {
            const stmt = db.prepare(`
                INSERT INTO mstrestmenu (
                    hotelid, outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
                    kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
                    stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
                    item_description, item_hsncode, status, created_by_id, created_date,
                    -- 🔥 NEW STOCK FIELDS + RAW MATERIALS 🔥
                    is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot, 
                    allow_negative_stock, opening_stock_quantity, opening_stock_unit_id,
                    consume_raw_materials_on_bill, consume_raw_materials_on_kot, store_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                 parsedHotelId,
                outletid ? parseInt(outletid) : null,
                item_no,
                item_name,
                print_name,
                short_name,
                kitchen_category_id ? parseInt(kitchen_category_id) : null,
                kitchen_sub_category_id ? parseInt(kitchen_sub_category_id) : null,
                kitchen_main_group_id ? parseInt(kitchen_main_group_id) : null,
                item_group_id ? parseInt(item_group_id) : null,
                item_main_group_id ? parseInt(item_main_group_id) : null,
                stock_unit ? parseInt(stock_unit) : null,
                parseFloat(price || 0),
                parseInt(taxgroupid || 0),
                is_runtime_rates || 0,
                is_common_to_all_departments || 0,
                item_description || null,
                item_hsncode || null,
                1, // status
                parseInt(created_by_id || 0),
                new Date().toISOString().slice(0, 19).replace('T', ' '), // created_date DATETIME format
                is_ingredients_required || 0,
                consume_on_bill || 1,
                reverse_stock_cancel_kot || 0,
                allow_negative_stock || 0,
                parseFloat(opening_stock_quantity || 0),
                opening_stock_unit_id ? parseInt(opening_stock_unit_id) : null,
                0, // consume_raw_materials_on_bill default
                0, // consume_raw_materials_on_kot default
                null  // store_name default
            );

            const restitemid = result.lastInsertRowid;

            if (department_details && department_details.length > 0) {
                const insertDetailStmt = db.prepare(`
                    INSERT INTO mstrestmenudetails (
                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const detail of department_details) {
                    const parsedDepartmentId = parseInt(detail.departmentid);
                    
                    if (isVariantProduct && detail.variant_rates) {
                        for (const variantValueId of variant_values) {
                            const variantRate = detail.variant_rates[variantValueId];
                            
                            if (variantRate !== undefined && variantRate !== null && variantRate !== '' && !isNaN(parseFloat(variantRate)) && parseFloat(variantRate) > 0) {
                                const parsedRate = parseFloat(variantRate);
                                const variantValue = db.prepare('SELECT value_name FROM mst_variant_values WHERE variant_value_id = ?').get(variantValueId);
                                const valueName = variantValue ? variantValue.value_name : null;
                                
                                insertDetailStmt.run(
                                    restitemid,
                                    parsedDepartmentId,
                                    parsedRate,
                                    detail.unitid ? parseInt(detail.unitid) : null,
                                    detail.servingunitid ? parseInt(detail.servingunitid) : null,
                                    detail.IsConversion || 0,
                                    parsedHotelId,
                                    variantValueId,
                                    valueName,
                                    detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                                );
                            }
                        }
                    } else {
                        const itemRate = detail.item_rate || detail.rate || 0;
                        insertDetailStmt.run(
                            restitemid,
                            parsedDepartmentId,
                            itemRate,
                            detail.unitid ? parseInt(detail.unitid) : null,
                            detail.servingunitid ? parseInt(detail.servingunitid) : null,
                            detail.IsConversion || 0,
                            parsedHotelId,
                            null,
                            null,
                            detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                        );
                    }
                }
            }

            const createdItem = db.prepare(`
                SELECT m.*, 
                       md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion, md.variant_value_id, md.value_name,
                       o.outlet_name,
                       h.hotel_name,
                       d.department_name,
                       vv.value_name as variant_value_name
                FROM mstrestmenu m
                LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
                LEFT JOIN mst_outlets o ON m.outletid = o.outletid
                LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE m.restitemid = ? AND m.status = 1
            `).get(restitemid);

            const allDetails = db.prepare(`
                SELECT md.*, d.department_name, vv.value_name as variant_value_name
                FROM mstrestmenudetails md
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE md.restitemid = ?
            `).all(restitemid);

            res.json({ success: true, data: { ...createdItem, department_details: allDetails }, message: 'Menu item created successfully' });
        })();
    } catch (error) {
        console.error('Error creating menu item with details:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.updateMenuItemWithDetails = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing or empty' });
        }

        const { id } = req.params;
        const {
            outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
            kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
            stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
            item_description, item_hsncode, status, updated_by_id, department_details,
            variant_type_id, variant_values,
            store_name,
            // 🔥 NEW STOCK FIELDS 🔥
            is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot, 
            allow_negative_stock, opening_stock_quantity, opening_stock_unit_id, consume_raw_materials_on_bill, consume_raw_materials_on_kot
        } = req.body;

        const existingItem = db.prepare('SELECT restitemid, hotelid FROM mstrestmenu WHERE restitemid = ?').get(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const parsedHotelId = parseInt(existingItem.hotelid);

        db.transaction(() => {
            const updateFields = [];
            const params = [];

            if (outletid !== undefined) { updateFields.push('outletid = ?'); params.push(parseInt(outletid)); }
            if (item_no !== undefined) { updateFields.push('item_no = ?'); params.push(item_no); }
            if (item_name) { updateFields.push('item_name = ?'); params.push(item_name); }
            if (print_name !== undefined) { updateFields.push('print_name = ?'); params.push(print_name); }
            if (short_name !== undefined) { updateFields.push('short_name = ?'); params.push(short_name); }
            if (kitchen_category_id !== undefined) { updateFields.push('kitchen_category_id = ?'); params.push(kitchen_category_id); }
            if (kitchen_sub_category_id !== undefined) { updateFields.push('kitchen_sub_category_id = ?'); params.push(kitchen_sub_category_id); }
            if (kitchen_main_group_id !== undefined) { updateFields.push('kitchen_main_group_id = ?'); params.push(kitchen_main_group_id); }
            if (item_group_id !== undefined) { updateFields.push('item_group_id = ?'); params.push(item_group_id); }
            if (item_main_group_id !== undefined) { updateFields.push('item_main_group_id = ?'); params.push(item_main_group_id); }
            if (stock_unit !== undefined) { updateFields.push('stock_unit = ?'); params.push(parseInt(stock_unit)); }
            if (price !== undefined) { updateFields.push('price = ?'); params.push(price); }
            if (taxgroupid !== undefined) { updateFields.push('taxgroupid = ?'); params.push(taxgroupid); }
            if (is_runtime_rates !== undefined) { updateFields.push('is_runtime_rates = ?'); params.push(is_runtime_rates); }
            if (is_common_to_all_departments !== undefined) { updateFields.push('is_common_to_all_departments = ?'); params.push(is_common_to_all_departments); }
            if (item_description !== undefined) { updateFields.push('item_description = ?'); params.push(item_description); }
            if (item_hsncode !== undefined) { updateFields.push('item_hsncode = ?'); params.push(item_hsncode); }
            if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }
            // 🔥 NEW STOCK FIELDS 🔥
            if (is_ingredients_required !== undefined) { updateFields.push('is_ingredients_required = ?'); params.push(is_ingredients_required); }
            if (consume_on_bill !== undefined) { updateFields.push('consume_on_bill = ?'); params.push(consume_on_bill); }
            if (reverse_stock_cancel_kot !== undefined) { updateFields.push('reverse_stock_cancel_kot = ?'); params.push(reverse_stock_cancel_kot); }
            if (allow_negative_stock !== undefined) { updateFields.push('allow_negative_stock = ?'); params.push(allow_negative_stock); }
            if (opening_stock_quantity !== undefined) { updateFields.push('opening_stock_quantity = ?'); params.push(opening_stock_quantity); }
            if (opening_stock_unit_id !== undefined) { updateFields.push('opening_stock_unit_id = ?'); params.push(opening_stock_unit_id); }
            if (consume_raw_materials_on_bill !== undefined) { updateFields.push('consume_raw_materials_on_bill = ?'); params.push(consume_raw_materials_on_bill); }
            if (consume_raw_materials_on_kot !== undefined) { updateFields.push('consume_raw_materials_on_kot = ?'); params.push(consume_raw_materials_on_kot); }
            if (typeof store_name !== 'undefined') { updateFields.push('store_name = ?'); params.push(store_name === '' ? null : String(store_name)); }

            updateFields.push('updated_by_id = ?');
            updateFields.push('updated_date = datetime(\'now\')');
            params.push(updated_by_id, parseInt(id));

            if (updateFields.length > 2) {
                const stmt = db.prepare(`UPDATE mstrestmenu SET ${updateFields.join(', ')} WHERE restitemid = ?`);
                stmt.run(...params);
            }

            if (department_details && department_details.length > 0) {
                const isVariantProduct = variant_type_id && variant_values && variant_values.length > 0;
                
                db.prepare('DELETE FROM mstrestmenudetails WHERE restitemid = ?').run(parseInt(id));

                const insertDetailStmt = db.prepare(`
                    INSERT INTO mstrestmenudetails (
                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const detail of department_details) {
                    const parsedDepartmentId = parseInt(detail.departmentid);
                    
                    if (isVariantProduct && detail.variant_rates && variant_values.length > 0) {
                        for (const variantValueId of variant_values) {
                            const variantRate = detail.variant_rates[variantValueId];
                            
                            if (variantRate !== undefined && variantRate !== null && variantRate !== '' && !isNaN(parseFloat(variantRate)) && parseFloat(variantRate) > 0) {
                                const parsedRate = parseFloat(variantRate);
                                const variantValue = db.prepare('SELECT value_name FROM mst_variant_values WHERE variant_value_id = ?').get(variantValueId);
                                const valueName = variantValue ? variantValue.value_name : null;
                                
                                insertDetailStmt.run(
                                    parseInt(id),
                                    parsedDepartmentId,
                                    parsedRate,
                                    detail.unitid ? parseInt(detail.unitid) : null,
                                    detail.servingunitid ? parseInt(detail.servingunitid) : null,
                                    detail.IsConversion || 0,
                                    parsedHotelId,
                                    variantValueId,
                                    valueName,
                                    detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                                );
                            }
                        }
                    } else {
                        const itemRate = detail.item_rate || detail.rate || 0;
                        insertDetailStmt.run(
                            parseInt(id),
                            parsedDepartmentId,
                            itemRate,
                            detail.unitid ? parseInt(detail.unitid) : null,
                            detail.servingunitid ? parseInt(detail.servingunitid) : null,
                            detail.IsConversion || 0,
                            parsedHotelId,
                            null,
                            null,
                            detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                        );
                    }
                }
            }

            const updatedItem = db.prepare(`
                SELECT m.*, 
                       md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion, md.variant_value_id,
                       o.outlet_name,
                       h.hotel_name,
                       d.department_name,
                       vv.value_name as variant_value_name
                FROM mstrestmenu m
                LEFT JOIN mstrestmenudetails md ON m.restitemid = md.restitemid
                LEFT JOIN mst_outlets o ON m.outletid = o.outletid
                LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE m.restitemid = ? AND m.status = 1
            `).get(parseInt(id));

            const allDetails = db.prepare(`
                SELECT md.*, d.department_name, vv.value_name as variant_value_name
                FROM mstrestmenudetails md
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE md.restitemid = ?
            `).all(parseInt(id));

            res.json({ success: true, data: { ...updatedItem, department_details: allDetails }, message: 'Menu item updated successfully' });
        })();
    } catch (error) {
        // console.error('Error updating menu item with details:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.deleteMenuItem = (req, res) => {
    try {
        const { id } = req.params;
        const { updated_by_id } = req.body;

        const existingItem = db.prepare('SELECT restitemid FROM mstrestmenu WHERE restitemid = ? AND status = 1').get(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found or already deleted', data: null });
        }

        db.transaction(() => {
            db.prepare('UPDATE mstrestmenu SET status = 0, updated_by_id = ?, updated_date = datetime(\'now\') WHERE restitemid = ?').run(updated_by_id, parseInt(id));
            db.prepare('DELETE FROM mstrestmenudetails WHERE restitemid = ?').run(parseInt(id));
        })();

        res.json({ success: true, message: 'Menu item deleted successfully', data: { restitemid: parseInt(id) } });
    } catch (error) {
        // console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getAllVariantTypesWithValues = (req, res) => {
    try {
        const query = `
            SELECT 
                vt.variant_type_id,
                vt.variant_type_name,
                vt.hotelid,
                vt.outletid,
                vt.sort_order AS type_sort_order,
                vt.active AS type_active,
                vv.variant_value_id,
                vv.value_name,
                vv.sort_order AS value_sort_order,
                vv.active AS value_active
            FROM mst_variant_types vt
            LEFT JOIN mst_variant_values vv ON vt.variant_type_id = vv.variant_type_id AND vv.active = 1
            WHERE vt.active = 1
            ORDER BY vt.sort_order ASC, vt.variant_type_name ASC, vv.sort_order ASC, vv.value_name ASC
        `;

        const results = db.prepare(query).all();
        const variantTypesMap = new Map();
        
        for (const row of results) {
            if (!variantTypesMap.has(row.variant_type_id)) {
                variantTypesMap.set(row.variant_type_id, {
                    variant_type_id: row.variant_type_id,
                    variant_type_name: row.variant_type_name,
                    hotelid: row.hotelid,
                    outletid: row.outletid,
                    sort_order: row.type_sort_order,
                    active: row.type_active,
                    values: []
                });
            }
            
            if (row.variant_value_id) {
                variantTypesMap.get(row.variant_type_id).values.push({
                    variant_value_id: row.variant_value_id,
                    value_name: row.value_name,
                    sort_order: row.value_sort_order,
                    active: row.value_active
                });
            }
        }

        const variantTypesWithValues = Array.from(variantTypesMap.values());
        res.json({ success: true, data: variantTypesWithValues, count: variantTypesWithValues.length });
    } catch (error) {
        // console.error('Error fetching variant types with values:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getMaxItemNo = (req, res) => {
  try {
    const { hotelid } = req.query;
    let query = `SELECT IFNULL(MAX(item_no),0) + 1 AS nextItemNo FROM mstrestmenu`;
    let row;
    if (hotelid) {
      query += ` WHERE hotelid = ?`;
      row = db.prepare(query).get(hotelid);
    } else {
      row = db.prepare(query).get();
    }
    res.json({ success: true, data: { nextItemNo: row.nextItemNo } });
  } catch (error) {
    // console.error("Error fetching max item number:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch max item number', error: error.message, data: null });
  }
};

exports.exportMenuItems = (req, res) => {
  try {
    const { hotelid, outletid } = req.query;
    const XLSX = require('xlsx');
    
let query = `
      SELECT DISTINCT m.restitemid, m.item_no, m.item_name, m.print_name, m.short_name,
             m.price, m.item_description, m.item_hsncode, m.status,
             m.kitchen_category_id, m.kitchen_sub_category_id, m.kitchen_main_group_id,
             m.item_group_id, m.item_main_group_id, m.stock_unit, m.taxgroupid,
             m.is_runtime_rates, m.is_common_to_all_departments,
             -- 🔥 NEW STOCK FIELDS 🔥
             m.is_ingredients_required, m.consume_on_bill, m.reverse_stock_cancel_kot,
             m.allow_negative_stock, m.opening_stock_quantity, m.opening_stock_unit_id,
             m.consume_raw_materials_on_bill, m.consume_raw_materials_on_kot, m.store_name,
             o.outlet_name, h.hotel_name,
             ig.itemgroupname AS groupname,
             kmg.Kitchen_main_Group AS kitchen_main_group_name,
             kc.Kitchen_Category AS kitchen_category_name,
             ksc.Kitchen_sub_category AS kitchen_sub_category_name,
             tg.taxgroup_name
      FROM mstrestmenu m
      LEFT JOIN mst_outlets o ON m.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
      LEFT JOIN mst_item_group ig ON m.item_group_id = ig.item_groupid
      LEFT JOIN mst_kitchen_main_group kmg ON m.kitchen_main_group_id = kmg.kitchenmaingroupid
      LEFT JOIN mst_kitchen_category kc ON m.kitchen_category_id = kc.kitchencategoryid
      LEFT JOIN mst_kitchen_sub_category ksc ON m.kitchen_sub_category_id = ksc.kitchensubcategoryid
      LEFT JOIN msttaxgroup tg ON m.taxgroupid = tg.taxgroupid
      WHERE m.status IN (0,1)
    `;
    
    const params = [];
    
    if (hotelid) {
      query += ' AND m.hotelid = ?';
      params.push(parseInt(hotelid));
    }
    
    if (outletid) {
      const parsedOutletId = parseInt(outletid);
      const outlet = db.prepare('SELECT hotelid FROM mst_outlets WHERE outletid = ?').get(parsedOutletId);
      if (outlet) {
        query += ' AND (m.outletid = ? OR (m.hotelid = ? AND m.outletid IS NULL))';
        params.push(parsedOutletId, outlet.hotelid);
      } else {
        query += ' AND m.outletid = ?';
        params.push(parsedOutletId);
      }
    }
    
    query += ' ORDER BY m.item_name ASC';
    
    const menuItems = db.prepare(query).all(...params);
    
    const exportData = menuItems.map((item, index) => ({
      'Sr.No': index + 1,
      'Item No': item.item_no || '',
      'Item Name': item.item_name || '',
      'Print Name': item.print_name || '',
      'Short Name': item.short_name || '',
      'Price': item.price || 0,
      'Description': item.item_description || '',
      'HSN Code': item.item_hsncode || '',
      'Status': item.status === 1 ? 'Active' : 'Inactive',
      'Hotel': item.hotel_name || '',
      'Outlet': item.outlet_name || '',
      'Item Group': item.groupname || '',
      'Kitchen Main Group': item.kitchen_main_group_name || '',
      'Kitchen Category': item.kitchen_category_name || '',
      'Kitchen Sub Category': item.kitchen_sub_category_name || '',
      'Tax Group': item.taxgroup_name || '',
      'Runtime Rates': item.is_runtime_rates === 1 ? 'Yes' : 'No',
      'Common to All Departments': item.is_common_to_all_departments === 1 ? 'Yes' : 'No',
      'Is Ingredients Required': item.is_ingredients_required === 1 ? 'Yes' : 'No',
      'Consume on Bill': item.consume_on_bill === 1 ? 'Yes' : 'No',
      'Reverse Stock Cancel KOT': item.reverse_stock_cancel_kot === 1 ? 'Yes' : 'No',
      'Allow Negative Stock': item.allow_negative_stock === 1 ? 'Yes' : 'No',
      'Opening Stock Qty': item.opening_stock_quantity || 0,
      'Consume Raw on Bill': item.consume_raw_materials_on_bill === 1 ? 'Yes' : 'No',
      'Consume Raw on KOT': item.consume_raw_materials_on_kot === 1 ? 'Yes' : 'No',
      'Store Name': item.store_name || '',
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    ws['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 25 },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_items_export.xlsx');
    res.send(buffer);
    
  } catch (error) {
    // console.error('Error exporting menu items:', error);
    res.status(500).json({ success: false, message: 'Failed to export menu items', error: error.message, data: null });
  }
};

// Import menu items from Excel
exports.importMenuItems = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const XLSX = require('xlsx');
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'No data found in Excel file' });
    }
    
    const { hotelid, outletid, created_by_id } = req.body;
    
    if (!hotelid) {
      return res.status(400).json({ success: false, message: 'hotelid is required' });
    }
    
    const parsedHotelId = parseInt(hotelid);
    const parsedOutletId = outletid ? parseInt(outletid) : null;
    const parsedCreatedById = created_by_id ? parseInt(created_by_id) : 2;
    
    const hotel = db.prepare('SELECT hotelid, hotel_name FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId);
    if (!hotel) {
      return res.status(400).json({ success: false, message: `Invalid hotelid: ${hotelid}` });
    }
    
    const itemGroups = db.prepare('SELECT item_groupid, itemgroupname FROM mst_item_group WHERE status = 0').all();
    const itemGroupsMap = {};
    itemGroups.forEach(ig => { itemGroupsMap[ig.itemgroupname.toLowerCase()] = ig.item_groupid; });
    
    const kitchenCategories = db.prepare('SELECT kitchencategoryid, Kitchen_Category FROM mst_kitchen_category WHERE status = 0').all();
    const kitchenCategoriesMap = {};
    kitchenCategories.forEach(kc => { kitchenCategoriesMap[kc.Kitchen_Category.toLowerCase()] = kc.kitchencategoryid; });
    
    const taxGroups = db.prepare('SELECT taxgroupid, taxgroup_name FROM msttaxgroup WHERE status = 0').all();
    const taxGroupsMap = {};
    taxGroups.forEach(tg => { taxGroupsMap[tg.taxgroup_name.toLowerCase()] = tg.taxgroupid; });
    
    let deptQuery = 'SELECT departmentid, department_name FROM msttable_department WHERE status = 0';
    let deptParams = [];
    if (parsedOutletId) {
      const outlet = db.prepare('SELECT hotelid FROM mst_outlets WHERE outletid = ?').get(parsedOutletId);
      if (outlet && outlet.hotelid === parsedHotelId) {
        deptQuery += ' AND (outletid = ? OR outletid IS NULL)';
        deptParams.push(parsedOutletId);
      }
    } else {
      deptQuery += ' AND hotelid = ?';
      deptParams.push(parsedHotelId);
    }
    const departments = db.prepare(deptQuery).all(...deptParams);
    const departmentsMap = {};
    departments.forEach(d => { departmentsMap[d.department_name.toLowerCase()] = d.departmentid; });
    
    const importedItems = [];
    const errors = [];
    
    db.transaction(() => {
      data.forEach((row, index) => {
        try {
          if (!row['Item Name']) {
            errors.push({ row: index + 2, message: 'Item Name is required' });
            return;
          }
          
          const itemName = row['Item Name'].toString().trim();
          const itemNo = row['Item No'] ? row['Item No'].toString().trim() : null;
          const price = row['Price'] ? parseFloat(row['Price']) : 0;
          
          let itemGroupId = null;
          if (row['Item Group']) {
            const igName = row['Item Group'].toString().toLowerCase().trim();
            itemGroupId = itemGroupsMap[igName] || null;
          }
          
          let kitchenCategoryId = null;
          if (row['Kitchen Category']) {
            const kcName = row['Kitchen Category'].toString().toLowerCase().trim();
            kitchenCategoryId = kitchenCategoriesMap[kcName] || null;
          }
          
          let taxGroupId = null;
          if (row['Tax Group']) {
            const tgName = row['Tax Group'].toString().toLowerCase().trim();
            taxGroupId = taxGroupsMap[tgName] || null;
          }
          
          const status = row['Status'] && row['Status'].toString().toLowerCase() === 'active' ? 1 : 0;
          const isRuntimeRates = row['Runtime Rates'] && row['Runtime Rates'].toString().toLowerCase() === 'yes' ? 1 : 0;
          const isCommonToAll = row['Common to All Departments'] && row['Common to All Departments'].toString().toLowerCase() === 'yes' ? 1 : 0;
          
          const stmt = db.prepare(`
            INSERT INTO mstrestmenu (
              hotelid, outletid, item_no, item_name, print_name, short_name,
              kitchen_category_id, item_group_id, stock_unit, price, taxgroupid,
              is_runtime_rates, is_common_to_all_departments, item_description, item_hsncode,
              status, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
          `);
          
          const result = stmt.run(
            parsedHotelId,
            parsedOutletId,
            itemNo,
            itemName,
            row['Print Name'] || null,
            row['Short Name'] || null,
            kitchenCategoryId,
            itemGroupId,
            null,
            price,
            taxGroupId,
            isRuntimeRates,
            isCommonToAll,
            row['Description'] || null,
            row['HSN Code'] || null,
            status,
            parsedCreatedById
          );
          
          const restitemid = result.lastInsertRowid;
          
          if (departments.length > 0 && price > 0) {
            const detailStmt = db.prepare(`
              INSERT INTO mstrestmenudetails (restitemid, departmentid, item_rate, hotelid)
              VALUES (?, ?, ?, ?)
            `);
            
            departments.forEach(dept => {
              detailStmt.run(restitemid, dept.departmentid, price, parsedHotelId);
            });
          }
          
          importedItems.push({ restitemid, item_name: itemName, item_no: itemNo });
          
        } catch (rowError) {
          errors.push({ row: index + 2, message: rowError.message });
        }
      });
    })();
    
    res.json({
      success: true,
      data: { imported: importedItems.length, errors: errors },
      message: `Successfully imported ${importedItems.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
    
  } catch (error) {
    // console.error('Error importing menu items:', error);
    res.status(500).json({ success: false, message: 'Failed to import menu items', error: error.message, data: null });
  }
};

// Download sample template for menu import
exports.downloadSampleTemplate = (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // 🔥 COMPLETE TEMPLATE - ALL DB FIELDS with examples 🔥
    // Use exact column names that importMenuItems() will read
    // Yes/No → 1/0, exact names for FK mapping
    const sampleData = [
      {
        'Item No': 'AUTO',
        'Item Name': 'Chicken Biryani',
        'Print Name': 'CHICKEN BIRYANI',
        'Short Name': 'C.BIRYANI',
        'Price': 250.00,
        'Description': 'Chicken biryani with basmati rice and aromatic spices',
        'HSN Code': '21069099',
        'Status': 'Active',
        'Item Main Group': 'Food',
        'Item Group': 'Main Course',
        'Kitchen Main Group': 'Indian',
        'Kitchen Category': 'Non-Veg',
        'Kitchen Sub Category': 'Biryani',
        'Tax Group': 'GST 18%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes',
        // 🔥 NEW STOCK FIELDS 🔥
        'Is Ingredients Required': 'No',
        'Consume on Bill': 'Yes',
        'Reverse Stock Cancel KOT': 'No',
        'Allow Negative Stock': 'No',
        'Opening Stock Qty': 50,
        'Opening Stock Unit ID': 1, // UnitMaster.unitid
        // 🔥 NEW RAW MATERIALS FIELDS 🔥
        'Consume Raw on Bill': 'No',
        'Consume Raw on KOT': 'No',
        'Store Name': 1 // Warehouse.warehouseid
      },
      {
        'Item No': 'AUTO',
        'Item Name': 'Veg Pulao',
        'Print Name': 'VEG PULAO',
        'Short Name': 'V.PULAO',
        'Price': 150.00,
        'Description': 'Mixed vegetable pulao with basmati rice',
        'HSN Code': '21069099',
        'Status': 'Active',
        'Item Main Group': 'Food',
        'Item Group': 'Main Course',
        'Kitchen Main Group': 'Indian',
        'Kitchen Category': 'Veg',
        'Kitchen Sub Category': 'Rice',
        'Tax Group': 'GST 5%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes',
        // 🔥 NEW STOCK FIELDS 🔥
        'Is Ingredients Required': 'Yes',
        'Consume on Bill': 'Yes',
        'Reverse Stock Cancel KOT': 'Yes',
        'Allow Negative Stock': 'No',
        'Opening Stock Qty': 100,
        'Opening Stock Unit ID': 1,
        // 🔥 NEW RAW MATERIALS FIELDS 🔥
        'Consume Raw on Bill': 'Yes',
        'Consume Raw on KOT': 'No',
        'Store Name': 2
      }
    ];
    
    const wb = XLSX.utils.book_new();
    
    // Create template sheet
    const wsTemplate = XLSX.utils.json_to_sheet(sampleData);
    
    // Optimized column widths for all fields
    wsTemplate['!cols'] = [
      { wch: 12 }, // Item No
      { wch: 30 }, // Item Name  
      { wch: 20 }, // Print Name
      { wch: 15 }, // Short Name
      { wch: 10 }, // Price
      { wch: 35 }, // Description
      { wch: 12 }, // HSN Code
      { wch: 10 }, // Status
      { wch: 18 }, // Item Main Group
      { wch: 18 }, // Item Group
      { wch: 18 }, // Kitchen Main Group
      { wch: 18 }, // Kitchen Category
      { wch: 20 }, // Kitchen Sub Category
      { wch: 15 }, // Tax Group
      { wch: 15 }, // Runtime Rates
      { wch: 22 }, // Common to All Departments
      { wch: 20 }, // Is Ingredients Required
      { wch: 15 }, // Consume on Bill
      { wch: 22 }, // Reverse Stock Cancel KOT
      { wch: 18 }, // Allow Negative Stock
      { wch: 15 }, // Opening Stock Qty
      { wch: 18 }, // Opening Stock Unit ID
      { wch: 18 }, // Consume Raw on Bill
      { wch: 16 }, // Consume Raw on KOT
      { wch: 15 }  // Store Name
    ];
    
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Menu Import Template');
    
    // Instructions sheet
    const instructions = [
      ['IMPORTANT INSTRUCTIONS:'],
      ['1. Use EXACT names from dropdowns for Item Group, Kitchen Category, etc.'],
      ['2. Status: Active/Inactive'],
      ['3. Boolean fields (Yes/No):'],
      ['   - Yes → 1, No → 0 (automatic conversion)'],
      ['   - Is Ingredients Required: Yes/No'],
      ['   - Consume on Bill: Yes/No'],
      ['   - etc.'],
      ['4. Item No: Leave as AUTO or enter manually'],
      ['5. Opening Stock Unit ID: unitid from unitmaster table'],
      ['6. Store Name: warehouseid from warehouse table'],
      [''],
      ['SAMPLE ROWS BELOW ↓']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_import_template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
    
  } catch (error) {
    console.error('Error downloading sample template:', error);
    res.status(500).json({ success: false, message: 'Failed to download sample template', error: error.message });
  }
};
