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

    const stmt = db.prepare(query);
const menuItems = params.length ? stmt.all(...params) : stmt.all();

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

    // Auto-set column widths
    ws['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

res.setHeader(
  'Content-Type',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);
res.setHeader(
  'Content-Disposition',
  'attachment; filename=menu_items_export.xlsx'
);
res.setHeader('Content-Length', buffer.length);

// ✅ FINAL FIX
return res.end(buffer);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export menu items', error: error.message, data: null });
  }
};


// =========================
// 🔽 2. IMPORT MENU ITEMS
// =========================
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

    if (!hotelid) return res.status(400).json({ success: false, message: 'hotelid is required' });

    const parsedHotelId = parseInt(hotelid);
    const parsedOutletId = outletid ? parseInt(outletid) : null;
    const parsedCreatedById = created_by_id ? parseInt(created_by_id) : 2;

    // Validate hotel
    const hotel = db.prepare('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?').get(parsedHotelId);
    if (!hotel) return res.status(400).json({ success: false, message: `Invalid hotelid: ${hotelid}` });

    // Load master data maps
    const itemGroupsMap = {};
    db.prepare('SELECT item_groupid, itemgroupname FROM mst_Item_Group WHERE status = 0').all()
      .forEach(ig => itemGroupsMap[ig.itemgroupname.toLowerCase()] = ig.item_groupid);

    const kitchenCategoriesMap = {};
    db.prepare('SELECT kitchencategoryid, Kitchen_Category FROM mstkitchencategory WHERE status = 0').all()
      .forEach(kc => kitchenCategoriesMap[kc.Kitchen_Category.toLowerCase()] = kc.kitchencategoryid);

    const mainGroupsMap = {};
    db.prepare('SELECT item_maingroupid, item_group_name FROM mst_Item_Main_Group WHERE status = 0').all()
      .forEach(mg => mainGroupsMap[mg.item_group_name.toLowerCase()] = mg.item_maingroupid);

    const taxGroupsMap = {};
    db.prepare('SELECT taxgroupid, taxgroup_name FROM msttaxgroup WHERE status = 0').all()
      .forEach(tg => taxGroupsMap[tg.taxgroup_name.toLowerCase()] = tg.taxgroupid);

    // Departments mapping
    let deptQuery = 'SELECT departmentid, department_name FROM msttable_department WHERE status = 0';
    const deptParams = [];
    if (parsedOutletId) {
      deptQuery += ' AND outletid = ?';
      deptParams.push(parsedOutletId);
    } else {
      deptQuery += ' AND outletid IS NULL';
    }
    const departmentsMap = {};
    db.prepare(deptQuery).all(...deptParams)
      .forEach(d => departmentsMap[d.department_name.toLowerCase()] = d.departmentid);

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

          const itemGroupId = row['Item Group'] ? itemGroupsMap[row['Item Group'].toString().toLowerCase().trim()] : null;
          const kitchenCategoryId = row['Kitchen Category'] ? kitchenCategoriesMap[row['Kitchen Category'].toString().toLowerCase().trim()] : null;
          const mainGroupId = row['Kitchen Main Group'] ? mainGroupsMap[row['Kitchen Main Group'].toString().toLowerCase().trim()] : null;
          const taxGroupId = row['Tax Group'] ? taxGroupsMap[row['Tax Group'].toString().toLowerCase().trim()] : null;

          // Skip if FK references are missing
          if (row['Item Group'] && !itemGroupId) {
            errors.push({ row: index + 2, message: `Item Group not found: ${row['Item Group']}` });
            return;
          }
          if (row['Kitchen Category'] && !kitchenCategoryId) {
            errors.push({ row: index + 2, message: `Kitchen Category not found: ${row['Kitchen Category']}` });
            return;
          }
          if (row['Kitchen Main Group'] && !mainGroupId) {
            errors.push({ row: index + 2, message: `Kitchen Main Group not found: ${row['Kitchen Main Group']}` });
            return;
          }
          if (row['Tax Group'] && !taxGroupId) {
            errors.push({ row: index + 2, message: `Tax Group not found: ${row['Tax Group']}` });
            return;
          }

          const status = row['Status'] && row['Status'].toString().toLowerCase() === 'active' ? 1 : 0;
          const isRuntimeRates = row['Runtime Rates'] && row['Runtime Rates'].toString().toLowerCase() === 'yes' ? 1 : 0;
          const isCommonToAll = row['Common to All Departments'] && row['Common to All Departments'].toString().toLowerCase() === 'yes' ? 1 : 0;

          // Insert into mstrestmenu
          const result = db.prepare(`
            INSERT INTO mstrestmenu (
              hotelid, outletid, item_no, item_name, print_name, short_name,
              kitchen_category_id, kitchen_main_group_id, item_group_id, price, taxgroupid,
              is_runtime_rates, is_common_to_all_departments, item_description, item_hsncode,
              status, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            parsedHotelId,
            parsedOutletId,
            itemNo,
            itemName,
            row['Print Name'] || null,
            row['Short Name'] || null,
            kitchenCategoryId,
            mainGroupId,
            itemGroupId,
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

          // Insert into mstrestmenudetails for each department
          Object.values(departmentsMap).forEach(departmentid => {
            db.prepare(`
              INSERT INTO mstrestmenudetails (restitemid, departmentid, item_rate, hotelid)
              VALUES (?, ?, ?, ?)
            `).run(restitemid, departmentid, price, parsedHotelId);
          });

          importedItems.push({ restitemid, item_name: itemName, item_no: itemNo });
        } catch (rowError) {
          errors.push({ row: index + 2, message: rowError.message });
        }
      });
    })();

    res.json({
      success: true,
      data: { imported: importedItems.length, errors },
      message: `Successfully imported ${importedItems.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to import menu items', error: error.message, data: null });
  }
};


// =========================
// 🔽 3. DOWNLOAD TEMPLATE
// =========================
exports.downloadSampleTemplate = (req, res) => {
  try {
    const sampleData = [
      {
        'Item Name': 'Chicken Biryani',
        'Price': 250,
        'Item Group': 'Main Course',
        'Kitchen Category': 'Non-Veg',
        'Tax Group': 'GST 18%'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_template.xlsx');

    return res.end(buffer);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};