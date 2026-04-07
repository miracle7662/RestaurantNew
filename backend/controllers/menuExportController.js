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
// 🔽 2. IMPORT MENU ITEMS
// =========================
// Import menu items from Excel
// =========================
// 🔽 2. IMPORT MENU ITEMS (COMPLETE FIX)
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

// Stub functions to fix ReferenceErrors for raw material consumption
// Called during menu updates when flags are set



// Get all menu items with joins



// =========================
// 🔽 3. DOWNLOAD TEMPLATE
// =========================
// =========================
// 🔽 3. DOWNLOAD TEMPLATE (FIXED - ALL COLUMNS)
// =========================
exports.downloadSampleTemplate = (req, res) => {
  try {
    // Load real data for dropdown suggestions with error handling
    let itemGroups = [];
    let kitchenCategories = [];
    let kitchenMainGroups = [];
    let taxGroups = [];
    
    try {
      itemGroups = db.prepare(`
        SELECT itemgroupname 
        FROM mst_Item_Group 
        WHERE status IN (0,1) AND itemgroupname IS NOT NULL 
        ORDER BY itemgroupname LIMIT 10
      `).all() || [];
    } catch (err) {
      console.warn('Could not load item groups:', err.message);
    }
    
    try {
      kitchenCategories = db.prepare(`
        SELECT Kitchen_Category 
        FROM mstkitchencategory 
        WHERE status IN (0,1) AND Kitchen_Category IS NOT NULL 
        ORDER BY Kitchen_Category LIMIT 10
      `).all() || [];
    } catch (err) {
      console.warn('Could not load kitchen categories:', err.message);
    }
    
    try {
      kitchenMainGroups = db.prepare(`
        SELECT Kitchen_main_Group 
        FROM mstkitchenmaingroup 
        WHERE status IN (0,1) AND Kitchen_main_Group IS NOT NULL 
        ORDER BY Kitchen_main_Group LIMIT 10
      `).all() || [];
    } catch (err) {
      console.warn('Could not load kitchen main groups:', err.message);
    }
    
    try {
      taxGroups = db.prepare(`
        SELECT taxgroup_name 
        FROM msttaxgroup 
        WHERE status IN (0,1) AND taxgroup_name IS NOT NULL 
        ORDER BY taxgroup_name LIMIT 10
      `).all() || [];
    } catch (err) {
      console.warn('Could not load tax groups:', err.message);
    }

    // Sample data with real values from database
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
        'Item Group': itemGroups.length > 0 && itemGroups[0].itemgroupname ? itemGroups[0].itemgroupname : 'Non-Veg',
        'Kitchen Main Group': kitchenMainGroups.length > 0 && kitchenMainGroups[0].Kitchen_main_Group ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course',
        'Kitchen Category': kitchenCategories.length > 0 && kitchenCategories[0].Kitchen_Category ? kitchenCategories[0].Kitchen_Category : 'Non-Veg',
        'Kitchen Sub Category': '',
        'Tax Group': taxGroups.length > 0 && taxGroups[0].taxgroup_name ? taxGroups[0].taxgroup_name : 'GST 18%',
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
        'Item Group': itemGroups.length > 1 && itemGroups[1].itemgroupname ? itemGroups[1].itemgroupname : (itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Veg'),
        'Kitchen Main Group': kitchenMainGroups.length > 1 && kitchenMainGroups[1].Kitchen_main_Group ? kitchenMainGroups[1].Kitchen_main_Group : (kitchenMainGroups.length > 0 ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course'),
        'Kitchen Category': kitchenCategories.length > 1 && kitchenCategories[1].Kitchen_Category ? kitchenCategories[1].Kitchen_Category : (kitchenCategories.length > 0 ? kitchenCategories[0].Kitchen_Category : 'Veg'),
        'Kitchen Sub Category': '',
        'Tax Group': taxGroups.length > 1 && taxGroups[1].taxgroup_name ? taxGroups[1].taxgroup_name : (taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 5%'),
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

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create main data sheet
    const wsData = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for data sheet
    wsData['!cols'] = [
      { wch: 12 }, // Item No
      { wch: 25 }, // Item Name
      { wch: 20 }, // Print Name
      { wch: 15 }, // Short Name
      { wch: 10 }, // Price
      { wch: 35 }, // Description
      { wch: 12 }, // HSN Code
      { wch: 10 }, // Status
      { wch: 20 }, // Item Group
      { wch: 20 }, // Kitchen Main Group
      { wch: 20 }, // Kitchen Category
      { wch: 20 }, // Kitchen Sub Category
      { wch: 15 }, // Tax Group
      { wch: 12 }, // Runtime Rates
      { wch: 22 }, // Common to All Departments
      { wch: 20 }, // Is Ingredients Required
      { wch: 15 }, // Consume on Bill
      { wch: 22 }, // Reverse Stock Cancel KOT
      { wch: 18 }, // Allow Negative Stock
      { wch: 15 }, // Opening Stock Qty
      { wch: 18 }, // Consume Raw on Bill
      { wch: 18 }, // Consume Raw on KOT
      { wch: 15 }  // Store Name
    ];
    
    XLSX.utils.book_append_sheet(wb, wsData, 'Menu Items Template');
    
    // Create instructions sheet
    const instructions = [
      { 'Column Name': 'Item No', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Unique item code (optional)', 'Example': 'ITEM001' },
      { 'Column Name': 'Item Name', 'Required': 'Yes', 'Data Type': 'Text', 'Description': 'Name of the menu item', 'Example': 'Butter Chicken' },
      { 'Column Name': 'Print Name', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Name to print on bills', 'Example': 'Butter Chicken' },
      { 'Column Name': 'Short Name', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Short name for KOT', 'Example': 'Btr Chkn' },
      { 'Column Name': 'Price', 'Required': 'Yes', 'Data Type': 'Number', 'Description': 'Selling price', 'Example': '350' },
      { 'Column Name': 'Description', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Item description', 'Example': 'Creamy tomato based chicken curry' },
      { 'Column Name': 'HSN Code', 'Required': 'No', 'Data Type': 'Text', 'Description': 'HSN/SAC code', 'Example': '21069099' },
      { 'Column Name': 'Status', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Active or Inactive', 'Example': 'Active', 'Default': 'Active' },
      { 'Column Name': 'Item Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Item Group in database', 'Example': itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Non-Veg' },
      { 'Column Name': 'Kitchen Main Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Main Group in database', 'Example': kitchenMainGroups.length > 0 ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course' },
      { 'Column Name': 'Kitchen Category', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Category in database', 'Example': kitchenCategories.length > 0 ? kitchenCategories[0].Kitchen_Category : 'Non-Veg' },
      { 'Column Name': 'Kitchen Sub Category', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Sub Category in database', 'Example': '' },
      { 'Column Name': 'Tax Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Tax Group in database', 'Example': taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 18%' },
      { 'Column Name': 'Runtime Rates', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No - Allow runtime rate changes', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Common to All Departments', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No - Available in all departments', 'Example': 'Yes', 'Default': 'Yes' },
      { 'Column Name': 'Is Ingredients Required', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Consume on Bill', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Reverse Stock Cancel KOT', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Allow Negative Stock', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Opening Stock Qty', 'Required': 'No', 'Data Type': 'Number', 'Description': 'Opening stock quantity', 'Example': '0', 'Default': '0' },
      { 'Column Name': 'Consume Raw on Bill', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Consume Raw on KOT', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Yes/No', 'Example': 'No', 'Default': 'No' },
      { 'Column Name': 'Store Name', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Store name', 'Example': 'Main Store' }
    ];
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 25 }, // Column Name
      { wch: 10 }, // Required
      { wch: 15 }, // Data Type
      { wch: 40 }, // Description
      { wch: 20 }, // Example
      { wch: 15 }  // Default
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    // Create valid values sheet
    const validValues = [];
    
    // Add Item Groups
    if (itemGroups.length > 0) {
      validValues.push({ 'Field': '=== ITEM GROUPS ===', 'Valid Value': '', 'Note': 'Use exact names from below' });
      itemGroups.forEach(ig => {
        if (ig.itemgroupname) {
          validValues.push({ 'Field': 'Item Group', 'Valid Value': ig.itemgroupname, 'Note': 'Case-sensitive' });
        }
      });
      validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
    }
    
    // Add Kitchen Categories
    if (kitchenCategories.length > 0) {
      validValues.push({ 'Field': '=== KITCHEN CATEGORIES ===', 'Valid Value': '', 'Note': '' });
      kitchenCategories.forEach(kc => {
        if (kc.Kitchen_Category) {
          validValues.push({ 'Field': 'Kitchen Category', 'Valid Value': kc.Kitchen_Category, 'Note': 'Case-sensitive' });
        }
      });
      validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
    }
    
    // Add Kitchen Main Groups
    if (kitchenMainGroups.length > 0) {
      validValues.push({ 'Field': '=== KITCHEN MAIN GROUPS ===', 'Valid Value': '', 'Note': '' });
      kitchenMainGroups.forEach(kmg => {
        if (kmg.Kitchen_main_Group) {
          validValues.push({ 'Field': 'Kitchen Main Group', 'Valid Value': kmg.Kitchen_main_Group, 'Note': 'Case-sensitive' });
        }
      });
      validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
    }
    
    // Add Tax Groups
    if (taxGroups.length > 0) {
      validValues.push({ 'Field': '=== TAX GROUPS ===', 'Valid Value': '', 'Note': '' });
      taxGroups.forEach(tg => {
        if (tg.taxgroup_name) {
          validValues.push({ 'Field': 'Tax Group', 'Valid Value': tg.taxgroup_name, 'Note': 'Case-sensitive' });
        }
      });
    }
    
    // Add common values
    validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
    validValues.push({ 'Field': '=== COMMON VALUES ===', 'Valid Value': '', 'Note': '' });
    validValues.push({ 'Field': 'Status', 'Valid Value': 'Active, Inactive', 'Note': 'Default: Active' });
    validValues.push({ 'Field': 'Boolean Fields', 'Valid Value': 'Yes, No', 'Note': 'Runtime Rates, Common to All Departments, etc.' });
    
    const wsValidValues = XLSX.utils.json_to_sheet(validValues);
    wsValidValues['!cols'] = [
      { wch: 25 }, // Field
      { wch: 30 }, // Valid Value
      { wch: 30 }  // Note
    ];
    XLSX.utils.book_append_sheet(wb, wsValidValues, 'Valid Values');
    
    // Write buffer
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false 
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="menu_import_template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.end(buffer);

  } catch (err) {
    console.error('Template generation error:', err);
    
    // Fallback: Create a basic template without database data
    try {
      const fallbackData = [
        {
          'Item Name': 'Sample Item',
          'Price': 100,
          'Item Group': 'Non-Veg',
          'Kitchen Category': 'Non-Veg',
          'Tax Group': 'GST 18%'
        }
      ];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(fallbackData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="menu_template_fallback.xlsx"');
      
      return res.end(buffer);
    } catch (fallbackErr) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate template', 
        error: err.message 
      });
    }
  }
};