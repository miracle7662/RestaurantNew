
const db = require('../config/db');

// ✅ MySQL Transaction Helper (replaces SQLite db.transaction())
const runInTransaction = async (fn) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Stub functions to fix ReferenceErrors for raw material consumption
// Called during menu updates when flags are set



// Get all menu items with joins
exports.getAllMenuItems = async (req, res) => {
    try {
        const { hotelid, outletid } = req.query;
        console.log('🚀 getAllMenuItems called:', { hotelid, outletid, url: req.originalUrl });
        
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
            const [outletRows] = await db.execute('SELECT hotelid FROM mst_outlets WHERE outletid = ?', [parsedOutletId]);
            const outlet = outletRows[0];
            if (outlet) {
                query += ' AND (m.outletid = ? OR (m.hotelid = ? AND m.outletid IS NULL))';
                params.push(parsedOutletId, outlet.hotelid);
            } else {
                query += ' AND m.outletid = ?';
                params.push(parsedOutletId);
            }
        }
        
        query += ' ORDER BY m.created_date DESC';
        
        console.log('📊 Executing SQL:', query, 'params:', params);
        const [menuRows] = await db.execute(query, params);
        console.log('✅ Raw query result:', menuRows.length, 'rows');
        const menuItems = menuRows;
        
        const menuItemsWithDetails = await Promise.all(menuItems.map(async (item) => {
            const [detailsRows] = await db.execute(`
                SELECT md.*, d.department_name, vv.value_name as variant_value_name
                FROM mstrestmenudetails md
                LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
                LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
                WHERE md.restitemid = ?
            `, [item.restitemid]);
            return { ...item, department_details: detailsRows };
        }));
        
        console.log('📦 Final response:', { success: true, count: menuItemsWithDetails.length });
        res.json({ success: true, data: menuItemsWithDetails, count: menuItemsWithDetails.length });
    } catch (error) {
        console.error('💥 MENU FETCH ERROR:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0,3).join('\n'),
            queryParams: req.query,
            url: req.originalUrl
        });
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getMenuItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id);
        
        const [menuRows] = await db.execute(`
            SELECT m.*, 
                   md.itemdetailsid, md.item_rate, md.unitid, md.servingunitid, md.IsConversion,
                   m.is_ingredients_required, m.consume_on_bill, m.reverse_stock_cancel_kot,
                   m.allow_negative_stock, m.opening_stock_quantity, m.opening_stock_unit_id,
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
        `, [parsedId]);
        
        const menuItem = menuRows[0];
        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found', data: null });
        }
        
        const [detailsRows] = await db.execute(`
            SELECT md.*, d.department_name, vv.value_name as variant_value_name
            FROM mstrestmenudetails md
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
            WHERE md.restitemid = ?
        `, [parsedId]);
        const allDetails = detailsRows;
        
        res.json({ success: true, data: { ...menuItem, department_details: allDetails }, message: 'Menu item fetched successfully' });
    } catch (error) {
        console.error('Error fetching menu item:', error);
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
        if (isNaN(parsedHotelId)) {
            return res.status(400).json({ message: `Invalid hotelid: ${hotelid}` });
        }
        const [hotelRows] = await db.execute('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?', [parsedHotelId]);
        if (hotelRows.length === 0) {
            return res.status(400).json({ message: `Invalid hotelid: ${hotelid}` });
        }

        if (outletid) {
            const parsedOutletId = parseInt(outletid);
            const [outletRows] = await db.execute('SELECT outletid, hotelid FROM mst_outlets WHERE outletid = ? AND status = 0', [parsedOutletId]);
            const outlet = outletRows[0];
            if (!outlet) {
                return res.status(400).json({ message: `Invalid or inactive outletid: ${outletid}` });
            }
            if (outlet.hotelid !== parsedHotelId) {
                return res.status(400).json({ message: 'Outlet does not belong to the specified hotel', hotelid: parsedHotelId, outletHotelId: outlet.hotelid });
            }
        }

        const isVariantProduct = variant_type_id && variant_values && variant_values.length > 0;

        const restitemid = await runInTransaction(async (conn) => {
            // Insert main menu item
            const [result] = await conn.execute(`
                INSERT INTO mstrestmenu (
                    hotelid, outletid, item_no, item_name, print_name, short_name, kitchen_category_id,
                    kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id,
                    stock_unit, price, taxgroupid, is_runtime_rates, is_common_to_all_departments,
                    item_description, item_hsncode, status, created_by_id, created_date,
                    is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot, 
                    allow_negative_stock, opening_stock_quantity, opening_stock_unit_id,
                    consume_raw_materials_on_bill, consume_raw_materials_on_kot, store_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
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
                new Date().toISOString().slice(0, 19).replace('T', ' '),
                is_ingredients_required || 0,
                consume_on_bill || 1,
                reverse_stock_cancel_kot || 0,
                allow_negative_stock || 0,
                parseFloat(opening_stock_quantity || 0),
                opening_stock_unit_id ? parseInt(opening_stock_unit_id) : null,
                0,
                0,
                null
            ]);

            const newRestItemId = result.insertId;

            // Insert department details
            if (department_details && department_details.length > 0) {
                for (const detail of department_details) {
                    const parsedDepartmentId = parseInt(detail.departmentid);
                    
                    if (isVariantProduct && detail.variant_rates) {
                        for (const variantValueId of variant_values) {
                            const variantRate = detail.variant_rates[variantValueId];
                            
                            if (variantRate !== undefined && variantRate !== null && variantRate !== '' && !isNaN(parseFloat(variantRate)) && parseFloat(variantRate) > 0) {
                                const parsedRate = parseFloat(variantRate);
                                const [variantValueRows] = await conn.execute('SELECT value_name FROM mst_variant_values WHERE variant_value_id = ?', [variantValueId]);
                                const valueName = variantValueRows[0]?.value_name || null;
                                
                                await conn.execute(`
                                    INSERT INTO mstrestmenudetails (
                                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `, [
                                    newRestItemId,
                                    parsedDepartmentId,
                                    parsedRate,
                                    detail.unitid ? parseInt(detail.unitid) : null,
                                    detail.servingunitid ? parseInt(detail.servingunitid) : null,
                                    detail.IsConversion || 0,
                                    parsedHotelId,
                                    variantValueId,
                                    valueName,
                                    detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                                ]);
                            }
                        }
                    } else {
                        const itemRate = detail.item_rate || detail.rate || 0;
                        await conn.execute(`
                            INSERT INTO mstrestmenudetails (
                                restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            newRestItemId,
                            parsedDepartmentId,
                            itemRate,
                            detail.unitid ? parseInt(detail.unitid) : null,
                            detail.servingunitid ? parseInt(detail.servingunitid) : null,
                            detail.IsConversion || 0,
                            parsedHotelId,
                            null,
                            null,
                            detail.taxgroupid ? parseInt(detail.taxgroupid) : null
                        ]);
                    }
                }
            }

            return newRestItemId;
        });

        // Fetch created item + details (outside transaction - read-only)
        const [createdItemRows] = await db.execute(`
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
        `, [restitemid]);

        const [allDetailsRows] = await db.execute(`
            SELECT md.*, d.department_name, vv.value_name as variant_value_name
            FROM mstrestmenudetails md
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
            WHERE md.restitemid = ?
        `, [restitemid]);

        const createdItem = createdItemRows[0] || {};
        const allDetails = allDetailsRows;

        res.json({ success: true, data: { ...createdItem, department_details: allDetails }, message: 'Menu item created successfully' });
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

        const [existingRows] = await db.execute('SELECT restitemid, hotelid FROM mstrestmenu WHERE restitemid = ?', [parseInt(id)]);
        const existingItem = existingRows[0];
        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const parsedHotelId = parseInt(existingItem.hotelid);

        await runInTransaction(async (conn) => {
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
            updateFields.push('updated_date = NOW()');
            params.push(updated_by_id, parseInt(id));

            if (updateFields.length > 2) {
                const updateQuery = `UPDATE mstrestmenu SET ${updateFields.join(', ')} WHERE restitemid = ?`;
                await conn.execute(updateQuery, [...params, parseInt(id)]);
            }

            if (department_details && department_details.length > 0) {
                const isVariantProduct = variant_type_id && variant_values && variant_values.length > 0;
                
                await conn.execute('DELETE FROM mstrestmenudetails WHERE restitemid = ?', [parseInt(id)]);

                for (const detail of department_details) {
                    const parsedDepartmentId = parseInt(detail.departmentid);
                    
                    if (isVariantProduct && detail.variant_rates && variant_values.length > 0) {
                        for (const variantValueId of variant_values) {
                            const variantRate = detail.variant_rates[variantValueId];
                            
                            if (variantRate !== undefined && variantRate !== null && variantRate !== '' && !isNaN(parseFloat(variantRate)) && parseFloat(variantRate) > 0) {
                                const parsedRate = parseFloat(variantRate);
                                const [variantValueRows] = await conn.execute('SELECT value_name FROM mst_variant_values WHERE variant_value_id = ?', [variantValueId]);
                                const valueName = variantValueRows[0]?.value_name || null;
                                
                                await conn.execute(`
                                    INSERT INTO mstrestmenudetails (
                                        restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `, [
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
                                ]);
                            }
                        }
                    } else {
                        const itemRate = detail.item_rate || detail.rate || 0;
                        await conn.execute(`
                            INSERT INTO mstrestmenudetails (
                                restitemid, departmentid, item_rate, unitid, servingunitid, IsConversion, hotelid, variant_value_id, value_name, taxgroupid
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
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
                        ]);
                    }
                }
            }
        });

        // Fetch updated item + details (outside transaction)
        const [updatedItemRows] = await db.execute(`
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
        `, [parseInt(id)]);

        const [allDetailsRows] = await db.execute(`
            SELECT md.*, d.department_name, vv.value_name as variant_value_name
            FROM mstrestmenudetails md
            LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
            LEFT JOIN mst_variant_values vv ON md.variant_value_id = vv.variant_value_id
            WHERE md.restitemid = ?
        `, [parseInt(id)]);

        const updatedItem = updatedItemRows[0] || {};
        const allDetails = allDetailsRows;

        res.json({ success: true, data: { ...updatedItem, department_details: allDetails }, message: 'Menu item updated successfully' });
    } catch (error) {
        // console.error('Error updating menu item with details:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { updated_by_id } = req.body;

        // Check if exists (outside transaction)
        const [existingRows] = await db.execute('SELECT restitemid FROM mstrestmenu WHERE restitemid = ? AND status = 1', [parseInt(id)]);
        const existingItem = existingRows[0];
        if (!existingItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found or already deleted', data: null });
        }

        // Transaction for delete
        await runInTransaction(async (conn) => {
            await conn.execute('UPDATE mstrestmenu SET status = 0, updated_by_id = ?, updated_date = NOW() WHERE restitemid = ?', [updated_by_id, parseInt(id)]);
            await conn.execute('DELETE FROM mstrestmenudetails WHERE restitemid = ?', [parseInt(id)]);
        });

        res.json({ success: true, message: 'Menu item deleted successfully', data: { restitemid: parseInt(id) } });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getAllVariantTypesWithValues = async (req, res) => {
    try {
        const [results] = await db.execute(`
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
        `);

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
        console.error('Error fetching variant types with values:', error);
        res.status(500).json({ success: false, message: 'Internal server error', details: error.message, data: null });
    }
};

exports.getMaxItemNo = async (req, res) => {
  try {
    const { hotelid } = req.query;
    let query = `SELECT IFNULL(MAX(item_no),0) + 1 AS nextItemNo FROM mstrestmenu`;
    let row;
    if (hotelid) {
      query += ` WHERE hotelid = ?`;
      [row] = await db.execute(query, [hotelid]);
    } else {
      [row] = await db.execute(query);
    }
    res.json({ success: true, data: { nextItemNo: row[0].nextItemNo } });
  } catch (error) {
    console.error("Error fetching max item number:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch max item number', error: error.message, data: null });
  }
};



// Download sample template for menu import

