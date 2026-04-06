// menuController.js

const db = require('../config/db');

const XLSX = require('xlsx');

// =========================
// 🔽 1. EXPORT MENU ITEMS
// =========================
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
             m.is_ingredients_required, m.consume_on_bill, m.reverse_stock_cancel_kot,
             m.allow_negative_stock, m.opening_stock_quantity, m.opening_stock_unit_id,
             m.consume_raw_materials_on_bill, m.consume_raw_materials_on_kot, m.store_name,
             o.outlet_name, h.hotel_name,
             ig.itemgroupname AS groupname,
             kmg.Kitchen_main_Group AS kitchen_main_group_name,
             kc.Kitchen_Category AS kitchen_category_name,
             ksc.Kitchen_sub_Category AS kitchen_sub_category_name,
             tg.taxgroup_name
      FROM mstrestmenu m
      LEFT JOIN mst_outlets o ON m.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
      LEFT JOIN mst_Item_Group ig ON m.item_group_id = ig.item_groupid
      LEFT JOIN mstkitchenmaingroup kmg ON m.kitchen_main_group_id = kmg.kitchenmaingroupid
      LEFT JOIN mstkitchencategory kc ON m.kitchen_category_id = kc.kitchencategoryid
      LEFT JOIN mstkitchensubcategory ksc ON m.kitchen_sub_category_id = ksc.kitchensubcategoryid
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

    console.log('Executing query with params:', params);
    
    const stmt = db.prepare(query);
    const menuItems = params.length ? stmt.all(...params) : stmt.all();
    
    console.log('Menu items found:', menuItems.length);

    // Check if no data found
    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No menu items found for the selected criteria',
        data: null 
      });
    }

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

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-set column widths based on content
    const maxWidths = {};
    Object.keys(exportData[0] || {}).forEach(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const value = row[key] ? String(row[key]).length : 0;
        maxLen = Math.max(maxLen, value);
      });
      maxWidths[key] = { wch: Math.min(maxLen + 2, 50) }; // Cap at 50 characters
    });
    ws['!cols'] = Object.values(maxWidths);

    XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

    // Write buffer with proper options
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false,  // Avoid Shared String Table issues
      compression: false 
    });

    // Verify buffer is valid
    if (!buffer || buffer.length === 0) {
      throw new Error('Generated buffer is empty');
    }

    console.log('Buffer size:', buffer.length, 'bytes');

    // Set proper headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="menu_items_export.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the buffer
    return res.send(buffer);

  } catch (error) {
    console.error('Export error details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export menu items', 
      error: error.message,
      stack: error.stack,
      data: null 
    });
  }
};


// =========================
// 🔽 2. IMPORT MENU ITEMS
// =========================
// Import menu items from Excel
// =========================
// 🔽 2. IMPORT MENU ITEMS (COMPLETE FIX)
// =========================


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

// =========================
// 🔽 2. IMPORT MENU ITEMS (FIXED - WITH NULL CHECKS)
// =========================
exports.importMenuItems = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('=== IMPORT START ===');
    console.log('File:', req.file.originalname, 'Size:', req.file.size);

    const XLSX = require('xlsx');
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('Total rows from Excel:', data.length);
    
    if (data.length > 0) {
      console.log('Excel columns found:', Object.keys(data[0]));
    }

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

    // Validate hotel
    const hotel = db.prepare('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId);
    if (!hotel) {
      return res.status(400).json({ success: false, message: `Invalid hotelid: ${hotelid}` });
    }

    // ============ LOAD ALL MASTER DATA WITH IDs ============
    
    // 1. Load Item Groups with their IDs
    const itemGroupsMap = new Map();
    const itemGroupsList = db.prepare(`
      SELECT item_groupid, itemgroupname 
      FROM mst_Item_Group 
      WHERE status IN (0,1)
    `).all();
    
    itemGroupsList.forEach(ig => {
      if (ig.itemgroupname) {
        const normalizedName = ig.itemgroupname.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        itemGroupsMap.set(normalizedName, ig.item_groupid);
      }
    });
    console.log('Item Groups loaded:', itemGroupsMap.size);

    // 2. Load Kitchen Categories with their IDs
    const kitchenCategoriesMap = new Map();
    const kitchenCategoriesList = db.prepare(`
      SELECT kitchencategoryid, Kitchen_Category 
      FROM mstkitchencategory 
      WHERE status IN (0,1)
    `).all();
    
    kitchenCategoriesList.forEach(kc => {
      if (kc.Kitchen_Category) {
        const normalizedName = kc.Kitchen_Category.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        kitchenCategoriesMap.set(normalizedName, kc.kitchencategoryid);
      }
    });
    console.log('Kitchen Categories loaded:', kitchenCategoriesMap.size);

    // 3. Load Kitchen Main Groups with their IDs
    const kitchenMainGroupsMap = new Map();
    const kitchenMainGroupsList = db.prepare(`
      SELECT kitchenmaingroupid, Kitchen_main_Group 
      FROM mstkitchenmaingroup 
      WHERE status IN (0,1)
    `).all();
    
    kitchenMainGroupsList.forEach(kmg => {
      if (kmg.Kitchen_main_Group) {
        const normalizedName = kmg.Kitchen_main_Group.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        kitchenMainGroupsMap.set(normalizedName, kmg.kitchenmaingroupid);
      }
    });
    console.log('Kitchen Main Groups loaded:', kitchenMainGroupsMap.size);

    // 4. Load Tax Groups with their IDs
    const taxGroupsMap = new Map();
    const taxGroupsList = db.prepare(`
      SELECT taxgroupid, taxgroup_name 
      FROM msttaxgroup 
      WHERE status IN (0,1)
    `).all();
    
    taxGroupsList.forEach(tg => {
      if (tg.taxgroup_name) {
        const normalizedName = tg.taxgroup_name.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        taxGroupsMap.set(normalizedName, tg.taxgroupid);
      }
    });
    console.log('Tax Groups loaded:', taxGroupsMap.size);

    // Get departments for this outlet/hotel
    let deptQuery = 'SELECT departmentid, department_name FROM msttable_department WHERE status IN (0,1)';
    const deptParams = [];
    if (parsedOutletId) {
      deptQuery += ' AND outletid = ?';
      deptParams.push(parsedOutletId);
    }
    const departments = db.prepare(deptQuery).all(...deptParams);
    console.log('Departments found:', departments.length);

    if (departments.length === 0) {
      return res.status(400).json({ success: false, message: 'No departments found for this outlet/hotel' });
    }

    const importedItems = [];
    const errors = [];

    // Helper function to safely get string value
    const safeString = (value) => {
      if (!value) return '';
      return value.toString().trim();
    };

    // Helper function to normalize string for comparison
    const normalizeString = (value) => {
      if (!value) return '';
      return value.toString().replace(/\s+/g, ' ').trim().toLowerCase();
    };

    // Helper function to get value from row with multiple column name possibilities
    const getValue = (row, possibleNames) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      
      try {
        // Extract values with multiple column name possibilities
        const itemName = getValue(row, ['Item Name', 'item_name', 'ItemName', 'NAME', 'Item']);
        
        if (!itemName) {
          errors.push({ 
            row: rowNumber, 
            message: `Item Name is required. Available columns: ${Object.keys(row).join(', ')}` 
          });
          continue;
        }

        const itemNameStr = safeString(itemName);
        
        if (!itemNameStr) {
          errors.push({ row: rowNumber, message: 'Item Name cannot be empty' });
          continue;
        }
        
        // Get Item Group ID
        let itemGroupId = null;
        const itemGroupName = getValue(row, ['Item Group', 'item_group', 'Group', 'ItemGroup']);
        if (itemGroupName) {
          const normalizedName = normalizeString(itemGroupName);
          if (normalizedName) {
            itemGroupId = itemGroupsMap.get(normalizedName);
            if (!itemGroupId) {
              const availableGroups = Array.from(itemGroupsMap.keys()).slice(0, 5);
              errors.push({ 
                row: rowNumber, 
                message: `Item Group "${itemGroupName}" not found. Available: ${availableGroups.join(', ')}` 
              });
              continue;
            }
            console.log(`Row ${rowNumber}: Mapped Item Group "${itemGroupName}" -> ID: ${itemGroupId}`);
          }
        }

        // Get Kitchen Category ID
        let kitchenCategoryId = null;
        const kitchenCategoryName = getValue(row, ['Kitchen Category', 'kitchen_category', 'Category', 'KitchenCategory']);
        if (kitchenCategoryName) {
          const normalizedName = normalizeString(kitchenCategoryName);
          if (normalizedName) {
            kitchenCategoryId = kitchenCategoriesMap.get(normalizedName);
            if (!kitchenCategoryId) {
              errors.push({ 
                row: rowNumber, 
                message: `Kitchen Category "${kitchenCategoryName}" not found` 
              });
              continue;
            }
            console.log(`Row ${rowNumber}: Mapped Kitchen Category "${kitchenCategoryName}" -> ID: ${kitchenCategoryId}`);
          }
        }

        // Get Kitchen Main Group ID
        let kitchenMainGroupId = null;
        const kitchenMainGroupName = getValue(row, ['Kitchen Main Group', 'kitchen_main_group', 'MainGroup', 'KitchenMainGroup']);
        if (kitchenMainGroupName) {
          const normalizedName = normalizeString(kitchenMainGroupName);
          if (normalizedName) {
            kitchenMainGroupId = kitchenMainGroupsMap.get(normalizedName);
            if (!kitchenMainGroupId) {
              errors.push({ 
                row: rowNumber, 
                message: `Kitchen Main Group "${kitchenMainGroupName}" not found` 
              });
              continue;
            }
            console.log(`Row ${rowNumber}: Mapped Kitchen Main Group "${kitchenMainGroupName}" -> ID: ${kitchenMainGroupId}`);
          }
        }

        // Get Tax Group ID
        let taxGroupId = null;
        const taxGroupName = getValue(row, ['Tax Group', 'tax_group', 'Tax', 'TaxGroup']);
        if (taxGroupName) {
          const normalizedName = normalizeString(taxGroupName);
          if (normalizedName) {
            taxGroupId = taxGroupsMap.get(normalizedName);
            if (!taxGroupId) {
              errors.push({ 
                row: rowNumber, 
                message: `Tax Group "${taxGroupName}" not found` 
              });
              continue;
            }
            console.log(`Row ${rowNumber}: Mapped Tax Group "${taxGroupName}" -> ID: ${taxGroupId}`);
          }
        }

        // Get other values
        const itemNo = getValue(row, ['Item No', 'item_no', 'ItemNo', 'Item Number']);
        const priceRaw = getValue(row, ['Price', 'price', 'Rate', 'rate']);
        const price = priceRaw ? parseFloat(priceRaw) : 0;
        
        const printName = getValue(row, ['Print Name', 'print_name', 'PrintName']);
        const shortName = getValue(row, ['Short Name', 'short_name', 'ShortName']);
        const description = getValue(row, ['Description', 'description', 'Item Description']);
        const hsnCode = getValue(row, ['HSN Code', 'hsn_code', 'HSN', 'HSNCode']);
        
        // Status (default: Active)
        const statusText = getValue(row, ['Status', 'status']);
        const status = statusText ? (statusText.toString().toLowerCase() === 'active' ? 1 : 0) : 1;
        
        // Boolean fields (default: No/0)
        const runtimeRatesText = getValue(row, ['Runtime Rates', 'runtime_rates']);
        const isRuntimeRates = runtimeRatesText ? (runtimeRatesText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const commonToAllText = getValue(row, ['Common to All Departments', 'common_to_all']);
        const isCommonToAll = commonToAllText ? (commonToAllText.toString().toLowerCase() === 'yes' ? 1 : 0) : 1;
        
        const ingredientsRequiredText = getValue(row, ['Is Ingredients Required', 'ingredients_required']);
        const isIngredientsRequired = ingredientsRequiredText ? (ingredientsRequiredText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const consumeOnBillText = getValue(row, ['Consume on Bill', 'consume_on_bill']);
        const consumeOnBill = consumeOnBillText ? (consumeOnBillText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const reverseStockText = getValue(row, ['Reverse Stock Cancel KOT', 'reverse_stock_cancel_kot']);
        const reverseStockCancelKot = reverseStockText ? (reverseStockText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const allowNegativeStockText = getValue(row, ['Allow Negative Stock', 'allow_negative_stock']);
        const allowNegativeStock = allowNegativeStockText ? (allowNegativeStockText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const consumeRawOnBillText = getValue(row, ['Consume Raw on Bill', 'consume_raw_on_bill']);
        const consumeRawOnBill = consumeRawOnBillText ? (consumeRawOnBillText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const consumeRawOnKotText = getValue(row, ['Consume Raw on KOT', 'consume_raw_on_kot']);
        const consumeRawOnKot = consumeRawOnKotText ? (consumeRawOnKotText.toString().toLowerCase() === 'yes' ? 1 : 0) : 0;
        
        const openingStockQtyRaw = getValue(row, ['Opening Stock Qty', 'opening_stock_qty']);
        const openingStockQty = openingStockQtyRaw ? parseFloat(openingStockQtyRaw) : 0;
        
        const storeName = getValue(row, ['Store Name', 'store_name']);

        // Insert into database
        const insertStmt = db.prepare(`
          INSERT INTO mstrestmenu (
            hotelid, outletid, item_no, item_name, print_name, short_name,
            kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id,
            item_group_id, price, taxgroupid,
            is_runtime_rates, is_common_to_all_departments, 
            is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot,
            allow_negative_stock, opening_stock_quantity,
            consume_raw_materials_on_bill, consume_raw_materials_on_kot, 
            store_name, item_description, item_hsncode, status,
            created_by_id, created_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        const result = insertStmt.run(
          parsedHotelId,
          parsedOutletId,
          itemNo ? safeString(itemNo) : null,
          itemNameStr,
          printName ? safeString(printName) : null,
          shortName ? safeString(shortName) : null,
          kitchenCategoryId,
          null, // kitchen_sub_category_id
          kitchenMainGroupId,
          itemGroupId,
          isNaN(price) ? 0 : price,
          taxGroupId,
          isRuntimeRates,
          isCommonToAll,
          isIngredientsRequired,
          consumeOnBill,
          reverseStockCancelKot,
          allowNegativeStock,
          openingStockQty,
          consumeRawOnBill,
          consumeRawOnKot,
          storeName ? safeString(storeName) : null,
          description ? safeString(description) : null,
          hsnCode ? safeString(hsnCode) : null,
          status,
          parsedCreatedById
        );

        const restitemid = result.lastInsertRowid;

        // Insert into mstrestmenudetails for each department
        const detailStmt = db.prepare(`
          INSERT INTO mstrestmenudetails (restitemid, departmentid, item_rate, hotelid)
          VALUES (?, ?, ?, ?)
        `);

        for (const dept of departments) {
          detailStmt.run(restitemid, dept.departmentid, price, parsedHotelId);
        }

        importedItems.push({ 
          restitemid, 
          item_name: itemNameStr, 
          item_no: itemNo ? safeString(itemNo) : 'N/A',
          price: price 
        });
        
        console.log(`✓ Row ${rowNumber}: Imported "${itemNameStr}"`);

      } catch (rowError) {
        console.error(`Error processing row ${rowNumber}:`, rowError);
        errors.push({ row: rowNumber, message: rowError.message });
      }
    }

    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Successfully imported: ${importedItems.length} items`);
    console.log(`Errors: ${errors.length}`);

    res.json({
      success: true,
      data: { 
        imported: importedItems.length, 
        errors: errors,
        importedItems: importedItems.slice(0, 10)
      },
      message: `Successfully imported ${importedItems.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import menu items', 
      error: error.message, 
      stack: error.stack,
      data: null 
    });
  }
};
// Download sample template for menu import
exports.downloadSampleTemplate = (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Sample data with examples (static template - no DB dependency to avoid errors)
    const sampleData = [
      {
        'Item No': 'AUTO',
        'Item Name': 'Example: Chicken Biryani',
        'Print Name': 'CHICKEN BIRYANI',
        'Short Name': 'C.BIRYANI',
        'Price': 250.00,
        'Description': 'Delicious chicken biryani with aromatic spices',
        'HSN Code': '210690',
        'Status': 'Active',
        'Item Group': 'Main Course',
        'Kitchen Category': 'Non-Veg',
        'Tax Group': 'GST 18%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes'
      },
      {
        'Item No': 'AUTO',
        'Item Name': 'Example: Veg Pulao',
        'Print Name': 'VEG PULAO',
        'Short Name': 'V.PULAO',
        'Price': 150.00,
        'Description': 'Fragrant vegetable pulao',
        'HSN Code': '210690',
        'Status': 'Active',
        'Item Group': 'Main Course',
        'Kitchen Category': 'Veg',
        'Tax Group': 'GST 18%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes'
      }
    ];
    
    const wb = XLSX.utils.book_new();
    
    // Create template sheet
    const wsTemplate = XLSX.utils.json_to_sheet(sampleData);
    wsTemplate['!cols'] = [
      { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
      { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 15 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Import Template');
    
    // Write to buffer - use 'buffer' type to get a proper Node.js Buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set proper headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_import_template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the buffer directly
    res.send(buffer);
    
  } catch (error) {
    // console.error('Error downloading sample template:', error);
    res.status(500).json({ success: false, message: 'Failed to download sample template', error: error.message, data: null });
  }
};



// =========================
// 🔽 3. DOWNLOAD TEMPLATE
// =========================
// =========================
// 🔽 3. DOWNLOAD TEMPLATE (FIXED - ALL COLUMNS)
// =========================
exports.downloadSampleTemplate = (req, res) => {
  try {
    // Load real available data for dropdown suggestions
    const itemGroups = db.prepare('SELECT itemgroupname FROM mst_Item_Group WHERE status IN (0,1) ORDER BY itemgroupname LIMIT 10').all();
    const kitchenCategories = db.prepare('SELECT Kitchen_Category FROM mstkitchencategory WHERE status IN (0,1) ORDER BY Kitchen_Category LIMIT 10').all();
    const kitchenMainGroups = db.prepare('SELECT item_group_name FROM mst_Item_Main_Group WHERE status IN (0,1) ORDER BY item_group_name LIMIT 10').all();
    const taxGroups = db.prepare('SELECT taxgroup_name FROM msttaxgroup WHERE status IN (0,1) ORDER BY taxgroup_name LIMIT 10').all();

    // Create template with ALL columns matching the export format
    const sampleData = [
      {
        'Item No': 'ITEM001',
        'Item Name': 'Butter Chicken',
        'Print Name': 'Butter Chicken',
        'Short Name': 'Btr Chkn',
        'Price': 350,
        'Description': 'Creamy tomato based chicken curry',
        'HSN Code': '21069099',
        'Status': 'Active',
        'Item Group': itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Non-Veg',
        'Kitchen Main Group': kitchenMainGroups.length > 0 ? kitchenMainGroups[0].item_group_name : 'Main Course',
        'Kitchen Category': kitchenCategories.length > 0 ? kitchenCategories[0]['Kitchen_Category'] : 'Non-Veg',
        'Kitchen Sub Category': '',
        'Tax Group': taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 18%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes',
        'Is Ingredients Required': 'No',
        'Consume on Bill': 'No',
        'Reverse Stock Cancel KOT': 'No',
        'Allow Negative Stock': 'No',
        'Opening Stock Qty': '0',
        'Consume Raw on Bill': 'No',
        'Consume Raw on KOT': 'No',
        'Store Name': 'Main Store'
      },
      {
        'Item No': 'ITEM002',
        'Item Name': 'Dal Makhani',
        'Print Name': 'Dal Makhani',
        'Short Name': 'Dal Mak',
        'Price': 250,
        'Description': 'Black lentils cooked overnight',
        'HSN Code': '21069099',
        'Status': 'Active',
        'Item Group': itemGroups.length > 1 ? itemGroups[1].itemgroupname : 'Veg',
        'Kitchen Main Group': kitchenMainGroups.length > 1 ? kitchenMainGroups[1].item_group_name : 'Main Course',
        'Kitchen Category': kitchenCategories.length > 1 ? kitchenCategories[1]['Kitchen_Category'] : 'Veg',
        'Kitchen Sub Category': '',
        'Tax Group': taxGroups.length > 1 ? taxGroups[1].taxgroup_name : 'GST 5%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes',
        'Is Ingredients Required': 'No',
        'Consume on Bill': 'No',
        'Reverse Stock Cancel KOT': 'No',
        'Allow Negative Stock': 'No',
        'Opening Stock Qty': '0',
        'Consume Raw on Bill': 'No',
        'Consume Raw on KOT': 'No',
        'Store Name': 'Main Store'
      },
      {
        'Item No': 'ITEM003',
        'Item Name': 'Garlic Naan',
        'Print Name': 'Garlic Naan',
        'Short Name': 'G Naan',
        'Price': 45,
        'Description': 'Tandoor baked bread with garlic',
        'HSN Code': '21069099',
        'Status': 'Active',
        'Item Group': itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Breads',
        'Kitchen Main Group': kitchenMainGroups.length > 0 ? kitchenMainGroups[0].item_group_name : 'Breads',
        'Kitchen Category': kitchenCategories.length > 0 ? kitchenCategories[0]['Kitchen_Category'] : 'Veg',
        'Kitchen Sub Category': '',
        'Tax Group': taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 5%',
        'Runtime Rates': 'No',
        'Common to All Departments': 'Yes',
        'Is Ingredients Required': 'No',
        'Consume on Bill': 'No',
        'Reverse Stock Cancel KOT': 'No',
        'Allow Negative Stock': 'No',
        'Opening Stock Qty': '0',
        'Consume Raw on Bill': 'No',
        'Consume Raw on KOT': 'No',
        'Store Name': 'Main Store'
      }
    ];

    // Add instruction sheet
    const instructions = [
      {
        'Column Name': 'Item No',
        'Description': 'Unique item code (optional)',
        'Example': 'ITEM001',
        'Required': 'No'
      },
      {
        'Column Name': 'Item Name',
        'Description': 'Name of the menu item',
        'Example': 'Butter Chicken',
        'Required': 'Yes'
      },
      {
        'Column Name': 'Print Name',
        'Description': 'Name to print on bills',
        'Example': 'Butter Chicken',
        'Required': 'No'
      },
      {
        'Column Name': 'Short Name',
        'Description': 'Short name for KOT',
        'Example': 'Btr Chkn',
        'Required': 'No'
      },
      {
        'Column Name': 'Price',
        'Description': 'Selling price',
        'Example': '350',
        'Required': 'Yes'
      },
      {
        'Column Name': 'Description',
        'Description': 'Item description',
        'Example': 'Creamy tomato based chicken curry',
        'Required': 'No'
      },
      {
        'Column Name': 'HSN Code',
        'Description': 'HSN/SAC code',
        'Example': '21069099',
        'Required': 'No'
      },
      {
        'Column Name': 'Status',
        'Description': 'Active or Inactive',
        'Example': 'Active',
        'Required': 'No (defaults to Active)'
      },
      {
        'Column Name': 'Item Group',
        'Description': 'Must match existing group in database',
        'Example': 'Non-Veg, Veg, Beverages',
        'Required': 'No'
      },
      {
        'Column Name': 'Kitchen Main Group',
        'Description': 'Main kitchen group',
        'Example': 'Main Course, Starters',
        'Required': 'No'
      },
      {
        'Column Name': 'Kitchen Category',
        'Description': 'Must match existing category in database',
        'Example': 'Veg, Non-Veg',
        'Required': 'No'
      },
      {
        'Column Name': 'Kitchen Sub Category',
        'Description': 'Sub category (optional)',
        'Example': 'Curries, Tandoor',
        'Required': 'No'
      },
      {
        'Column Name': 'Tax Group',
        'Description': 'Must match existing tax group',
        'Example': 'GST 18%, GST 5%',
        'Required': 'No'
      },
      {
        'Column Name': 'Runtime Rates',
        'Description': 'Yes/No - Allow runtime rate changes',
        'Example': 'No',
        'Required': 'No'
      },
      {
        'Column Name': 'Common to All Departments',
        'Description': 'Yes/No - Available in all departments',
        'Example': 'Yes',
        'Required': 'No'
      }
    ];

    const wb = XLSX.utils.book_new();
    
    // Create data sheet
    const wsData = XLSX.utils.json_to_sheet(sampleData);
    
    // Auto-set column widths for data sheet
    const colWidths = {};
    Object.keys(sampleData[0] || {}).forEach(key => {
      colWidths[key] = { wch: Math.max(key.length, 20) };
    });
    wsData['!cols'] = Object.values(colWidths);
    
    // Create instruction sheet
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 15 }];
    
    // Add both sheets
    XLSX.utils.book_append_sheet(wb, wsData, 'Menu Items Template');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    // Also add a sheet with valid values
    const validValues = [];
    
    // Add item groups
    itemGroups.forEach(ig => {
      validValues.push({ 'Field': 'Item Group', 'Valid Value': ig.itemgroupname });
    });
    
    // Add kitchen categories
    kitchenCategories.forEach(kc => {
      validValues.push({ 'Field': 'Kitchen Category', 'Valid Value': kc['Kitchen_Category'] });
    });
    
    // Add kitchen main groups
    kitchenMainGroups.forEach(kmg => {
      validValues.push({ 'Field': 'Kitchen Main Group', 'Valid Value': kmg.item_group_name });
    });
    
    // Add tax groups
    taxGroups.forEach(tg => {
      validValues.push({ 'Field': 'Tax Group', 'Valid Value': tg.taxgroup_name });
    });
    
    const wsValidValues = XLSX.utils.json_to_sheet(validValues);
    wsValidValues['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsValidValues, 'Valid Values');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_import_template.xlsx');

    return res.end(buffer);

  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({ message: err.message });
  }
};