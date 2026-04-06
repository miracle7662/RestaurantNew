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
exports.importMenuItems = async (req, res) => {
  let dbTransaction = null;
  
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

    // Load master data maps
    const itemGroupsMap = {};
    const itemGroupsList = db.prepare('SELECT item_groupid, itemgroupname FROM mst_Item_Group WHERE status IN (0,1)').all();
    itemGroupsList.forEach(ig => { 
      const normalized = ig.itemgroupname.replace(/\s+/g, ' ').trim().toLowerCase(); 
      itemGroupsMap[normalized] = ig.item_groupid; 
    });
    console.log('Item Groups loaded:', Object.keys(itemGroupsMap).length);

    const kitchenCategoriesMap = {};
    const kitchenCategoriesList = db.prepare('SELECT kitchencategoryid, Kitchen_Category FROM mstkitchencategory WHERE status IN (0,1)').all();
    kitchenCategoriesList.forEach(kc => { 
      const normalized = kc.Kitchen_Category.replace(/\s+/g, ' ').trim().toLowerCase(); 
      kitchenCategoriesMap[normalized] = kc.kitchencategoryid; 
    });
    console.log('Kitchen Categories loaded:', Object.keys(kitchenCategoriesMap).length);

    const taxGroupsMap = {};
    const taxGroupsList = db.prepare('SELECT taxgroupid, taxgroup_name FROM msttaxgroup WHERE status IN (0,1)').all();
    taxGroupsList.forEach(tg => { 
      const normalized = tg.taxgroup_name.replace(/\s+/g, ' ').trim().toLowerCase(); 
      taxGroupsMap[normalized] = tg.taxgroupid; 
    });
    console.log('Tax Groups loaded:', Object.keys(taxGroupsMap).length);

    // Get departments
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

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      
      try {
        // Get Item Name (try different case variations)
        let itemName = row['Item Name'] || row['item_name'] || row['ItemName'] || row['NAME'];
        if (!itemName) {
          errors.push({ row: rowNumber, message: 'Item Name column not found or empty. Available columns: ' + Object.keys(row).join(', ') });
          continue;
        }
        itemName = itemName.toString().trim();
        
        if (!itemName) {
          errors.push({ row: rowNumber, message: 'Item Name is required' });
          continue;
        }

        // Get Price
        let price = row['Price'] || row['price'] || row['RATE'] || 0;
        price = parseFloat(price);
        if (isNaN(price)) price = 0;

        // Get Item No
        let itemNo = row['Item No'] || row['item_no'] || row['ItemNo'];
        itemNo = itemNo ? itemNo.toString().trim() : null;

        // Get Item Group
        let itemGroupId = null;
        let itemGroupName = row['Item Group'] || row['item_group'] || row['Group'];
        if (itemGroupName) {
          const normalized = itemGroupName.toString().replace(/\s+/g, ' ').trim().toLowerCase();
          itemGroupId = itemGroupsMap[normalized];
          if (!itemGroupId) {
            errors.push({ row: rowNumber, message: `Item Group "${itemGroupName}" not found in database` });
            continue;
          }
        }

        // Get Kitchen Category
        let kitchenCategoryId = null;
        let kitchenCategoryName = row['Kitchen Category'] || row['kitchen_category'] || row['Category'];
        if (kitchenCategoryName) {
          const normalized = kitchenCategoryName.toString().replace(/\s+/g, ' ').trim().toLowerCase();
          kitchenCategoryId = kitchenCategoriesMap[normalized];
          if (!kitchenCategoryId) {
            errors.push({ row: rowNumber, message: `Kitchen Category "${kitchenCategoryName}" not found in database` });
            continue;
          }
        }

        // Get Tax Group
        let taxGroupId = null;
        let taxGroupName = row['Tax Group'] || row['tax_group'] || row['Tax'];
        if (taxGroupName) {
          const normalized = taxGroupName.toString().replace(/\s+/g, ' ').trim().toLowerCase();
          taxGroupId = taxGroupsMap[normalized];
          if (!taxGroupId) {
            errors.push({ row: rowNumber, message: `Tax Group "${taxGroupName}" not found in database` });
            continue;
          }
        }

        // Get Status
        let statusValue = 1;
        let statusText = row['Status'] || row['status'];
        if (statusText) {
          statusValue = statusText.toString().toLowerCase() === 'active' ? 1 : 0;
        }

        // Get Runtime Rates
        let isRuntimeRates = 0;
        let runtimeText = row['Runtime Rates'] || row['runtime_rates'];
        if (runtimeText) {
          isRuntimeRates = runtimeText.toString().toLowerCase() === 'yes' ? 1 : 0;
        }

        // Get Common to All
        let isCommonToAll = 0;
        let commonText = row['Common to All Departments'] || row['common_to_all'];
        if (commonText) {
          isCommonToAll = commonText.toString().toLowerCase() === 'yes' ? 1 : 0;
        }

        // Get Print Name
        let printName = row['Print Name'] || row['print_name'] || null;
        if (printName) printName = printName.toString().trim();

        // Get Short Name
        let shortName = row['Short Name'] || row['short_name'] || null;
        if (shortName) shortName = shortName.toString().trim();

        // Get Description
        let description = row['Description'] || row['description'] || null;
        if (description) description = description.toString().trim();

        // Get HSN Code
        let hsnCode = row['HSN Code'] || row['hsn_code'] || row['HSN'] || null;
        if (hsnCode) hsnCode = hsnCode.toString().trim();

        // Insert into database using transaction for each item
        const insertStmt = db.prepare(`
          INSERT INTO mstrestmenu (
            hotelid, outletid, item_no, item_name, print_name, short_name,
            kitchen_category_id, kitchen_main_group_id, item_group_id, price, taxgroupid,
            is_runtime_rates, is_common_to_all_departments, item_description, item_hsncode,
            status, created_by_id, created_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        const result = insertStmt.run(
          parsedHotelId,
          parsedOutletId,
          itemNo,
          itemName,
          printName,
          shortName,
          kitchenCategoryId,
          null, // kitchen_main_group_id (set to null if not provided)
          itemGroupId,
          price,
          taxGroupId,
          isRuntimeRates,
          isCommonToAll,
          description,
          hsnCode,
          statusValue,
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
          item_name: itemName, 
          item_no: itemNo || 'N/A',
          price: price 
        });
        
        console.log(`Imported item ${i+1}: ${itemName}`);

      } catch (rowError) {
        console.error(`Error processing row ${rowNumber}:`, rowError);
        errors.push({ row: rowNumber, message: rowError.message });
      }
    }

    console.log(`Import completed. Imported: ${importedItems.length}, Errors: ${errors.length}`);

    res.json({
      success: true,
      data: { 
        imported: importedItems.length, 
        errors: errors,
        importedItems: importedItems.slice(0, 10) // Send first 10 imported items for preview
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