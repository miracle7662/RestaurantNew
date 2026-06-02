// menuExportController.js

const db = require('../config/db');
const XLSX = require('xlsx');

// =========================
// 1. EXPORT MENU ITEMS (WITH DEPARTMENT-WISE RATES)
// =========================
exports.exportMenuItems = async (req, res) => {
  try {
    const { hotelid, outletid } = req.query;
    
    console.log('📤 Export started:', { hotelid, outletid });

    // First, get all departments for this hotel/outlet
    let deptQuery = `
      SELECT departmentid, department_name 
      FROM msttable_department 
      WHERE status IN (0,1)
    `;
    const deptParams = [];
    
    if (outletid) {
      deptQuery += ' AND outletid = ?';
      deptParams.push(parseInt(outletid));
    }
    
    const [departments] = await db.query(deptQuery, deptParams);
    console.log('Departments found:', departments.length);

    // Build the main query
    let query = `
      SELECT DISTINCT 
        m.restitemid,
        m.item_no,
        m.item_name,
        m.print_name,
        m.short_name,
        m.item_description,
        m.item_hsncode,
        m.status,
        m.kitchen_category_id,
        m.kitchen_sub_category_id,
        m.kitchen_main_group_id,
        m.item_group_id,
        m.item_main_group_id,
        m.stock_unit,
        m.taxgroupid,
        m.is_runtime_rates,
        m.is_common_to_all_departments,
        m.is_ingredients_required,
        m.consume_on_bill,
        m.reverse_stock_cancel_kot,
        m.allow_negative_stock,
        m.opening_stock_quantity,
        m.opening_stock_unit_id,
        m.consume_raw_materials_on_bill,
        m.consume_raw_materials_on_kot,
        m.store_name,
        o.outlet_name,
        h.hotel_name,
        ig.itemgroupname AS groupname,
        kmg.Kitchen_main_Group AS kitchen_main_group_name,
        kc.Kitchen_Category AS kitchen_category_name,
        ksc.Kitchen_sub_category AS kitchen_sub_category_name,
        tg.taxgroup_name
      FROM mstrestmenu m
      LEFT JOIN mst_outlets o ON m.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON m.hotelid = h.hotelid
      LEFT JOIN mst_Item_Group ig ON m.item_group_id = ig.item_groupid
      LEFT JOIN mstkitchenmaingroup kmg ON m.kitchen_main_group_id = kmg.kitchenmaingroupid
      LEFT JOIN mstkitchencategory kc ON m.kitchen_category_id = kc.kitchencategoryid
      LEFT JOIN mstkitchensubcategory ksc ON m.kitchen_sub_category_id = ksc.kitchensubcategoryid
      LEFT JOIN msttaxgroup tg ON m.taxgroupid = tg.taxgroupid
      WHERE m.status IN (0, 1)
    `;
    
    const params = [];

    if (hotelid) {
      query += ' AND m.hotelid = ?';
      params.push(parseInt(hotelid));
    }

    if (outletid) {
      const outletIdNum = parseInt(outletid);
      query += ' AND (m.outletid = ? OR (m.hotelid = ? AND m.outletid IS NULL))';
      params.push(outletIdNum, parseInt(hotelid));
    }

    query += ' ORDER BY m.item_no ASC';
    
    const [menuItems] = await db.query(query, params);
    console.log(`✅ Found ${menuItems.length} menu items`);

    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No menu items found for the selected criteria',
        data: null
      });
    }

    // Get department-wise rates for each menu item
    const exportData = [];
    
    for (let index = 0; index < menuItems.length; index++) {
      const item = menuItems[index];
      
      // Get department rates for this item
      const [deptRates] = await db.query(`
        SELECT md.departmentid, md.item_rate, d.department_name
        FROM mstrestmenudetails md
        LEFT JOIN msttable_department d ON md.departmentid = d.departmentid
        WHERE md.restitemid = ?
      `, [item.restitemid]);
      
      // Create a map of department rates
      const rateMap = {};
      deptRates.forEach(rate => {
        rateMap[rate.department_name] = rate.item_rate;
      });
      
      // Build export row with department-wise rates
      const exportRow = {
        'Sr.No': index + 1,
        'Item No': item.item_no || '',
        'Item Name': item.item_name || '',
        'Print Name': item.print_name || '',
        'Short Name': item.short_name || '',
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
      };
      
      // Add department-wise rate columns
      for (const dept of departments) {
        const rate = rateMap[dept.department_name] || '';
        exportRow[`Rate (${dept.department_name})`] = rate;
      }
      
      exportData.push(exportRow);
    }

    // Create Excel file
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const cols = [
      { wch: 6 },   // Sr.No
      { wch: 12 },  // Item No
      { wch: 30 },  // Item Name
      { wch: 25 },  // Print Name
      { wch: 15 },  // Short Name
      { wch: 40 },  // Description
      { wch: 15 },  // HSN Code
      { wch: 10 },  // Status
      { wch: 20 },  // Hotel
      { wch: 20 },  // Outlet
      { wch: 20 },  // Item Group
      { wch: 22 },  // Kitchen Main Group
      { wch: 20 },  // Kitchen Category
      { wch: 22 },  // Kitchen Sub Category
      { wch: 18 },  // Tax Group
      { wch: 14 },  // Runtime Rates
      { wch: 25 },  // Common to All Departments
      { wch: 22 },  // Is Ingredients Required
      { wch: 16 },  // Consume on Bill
      { wch: 24 },  // Reverse Stock Cancel KOT
      { wch: 20 },  // Allow Negative Stock
      { wch: 18 },  // Opening Stock Qty
      { wch: 20 },  // Consume Raw on Bill
      { wch: 20 },  // Consume Raw on KOT
      { wch: 15 }   // Store Name
    ];
    
    // Add department rate columns width
    for (const dept of departments) {
      cols.push({ wch: 18 });
    }
    
    worksheet['!cols'] = cols;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Items');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_items_export.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    console.log(`📁 Export completed: ${exportData.length} rows exported`);
    return res.send(buffer);

  } catch (error) {
    console.error('❌ Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export menu items',
      error: error.message,
      data: null
    });
  }
};

// =========================
// 2. IMPORT MENU ITEMS (WITH DEPARTMENT-WISE RATES)
// =========================
// =========================
// 2. IMPORT MENU ITEMS (WITH DEPARTMENT-WISE RATES) - FIXED
// =========================
exports.importMenuItems = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('=== IMPORT START ===');
    console.log('File:', req.file.originalname, 'Size:', req.file.size);

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
    const [hotelRows] = await db.query('SELECT hotelid FROM msthotelmasters WHERE hotelid = ?', [parsedHotelId]);
    if (!hotelRows[0]) {
      return res.status(400).json({ success: false, message: `Invalid hotelid: ${hotelid}` });
    }

    // ============ LOAD ALL MASTER DATA ============
    
    // Load Item Groups
    const itemGroupsMap = new Map();
    const [itemGroupsList] = await db.query(`
      SELECT item_groupid, itemgroupname 
      FROM mst_Item_Group 
      WHERE status IN (0,1)
    `);
    itemGroupsList.forEach(ig => {
      if (ig.itemgroupname) {
        const normalizedName = ig.itemgroupname.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        itemGroupsMap.set(normalizedName, ig.item_groupid);
      }
    });

    // Load Kitchen Categories
    const kitchenCategoriesMap = new Map();
    const [kitchenCategoriesList] = await db.query(`
      SELECT kitchencategoryid, Kitchen_Category 
      FROM mstkitchencategory 
      WHERE status IN (0,1)
    `);
    kitchenCategoriesList.forEach(kc => {
      if (kc.Kitchen_Category) {
        const normalizedName = kc.Kitchen_Category.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        kitchenCategoriesMap.set(normalizedName, kc.kitchencategoryid);
      }
    });

    // Load Kitchen Main Groups
    const kitchenMainGroupsMap = new Map();
    const [kitchenMainGroupsList] = await db.query(`
      SELECT kitchenmaingroupid, Kitchen_main_Group 
      FROM mstkitchenmaingroup 
      WHERE status IN (0,1)
    `);
    kitchenMainGroupsList.forEach(kmg => {
      if (kmg.Kitchen_main_Group) {
        const normalizedName = kmg.Kitchen_main_Group.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        kitchenMainGroupsMap.set(normalizedName, kmg.kitchenmaingroupid);
      }
    });

    // Load Tax Groups
    const taxGroupsMap = new Map();
    const [taxGroupsList] = await db.query(`
      SELECT taxgroupid, taxgroup_name 
      FROM msttaxgroup 
      WHERE status IN (0,1)
    `);
    taxGroupsList.forEach(tg => {
      if (tg.taxgroup_name) {
        const normalizedName = tg.taxgroup_name.toString().replace(/\s+/g, ' ').trim().toLowerCase();
        taxGroupsMap.set(normalizedName, tg.taxgroupid);
      }
    });

    // Get departments for this outlet/hotel
    let deptQuery = 'SELECT departmentid, department_name FROM msttable_department WHERE status IN (0,1)';
    const deptParams = [];
    if (parsedOutletId) {
      deptQuery += ' AND outletid = ?';
      deptParams.push(parsedOutletId);
    }
    const [departments] = await db.query(deptQuery, deptParams);
    console.log('Departments found:', departments.length);

    if (departments.length === 0) {
      return res.status(400).json({ success: false, message: 'No departments found for this outlet/hotel' });
    }

    // Create department name to ID mapping
    const departmentMap = new Map();
    departments.forEach(dept => {
      departmentMap.set(dept.department_name.toLowerCase().trim(), dept.departmentid);
    });

    const importedItems = [];
    const errors = [];
    const warnings = [];

    // Helper functions
    const safeString = (value) => {
      if (!value) return '';
      return value.toString().trim();
    };

    const normalizeString = (value) => {
      if (!value) return '';
      return value.toString().replace(/\s+/g, ' ').trim().toLowerCase();
    };

    const getValue = (row, possibleNames) => {
      for (const name of possibleNames) {
        // Check exact match
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
        // Check case-insensitive match
        for (const key of Object.keys(row)) {
          if (key.toLowerCase() === name.toLowerCase()) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return row[key];
            }
          }
        }
      }
      return null;
    };

    const parseBoolean = (value, defaultValue = false) => {
      if (value === undefined || value === null) return defaultValue ? 1 : 0;
      const str = value.toString().toLowerCase().trim();
      if (str === 'yes' || str === 'true' || str === '1' || str === 'active') return 1;
      if (str === 'no' || str === 'false' || str === '0' || str === 'inactive') return 0;
      return defaultValue ? 1 : 0;
    };

    const parsePrice = (value) => {
      if (value === undefined || value === null) return null;
      const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      
      try {
        const itemName = getValue(row, ['Item Name', 'item_name', 'ItemName', 'NAME', 'Item']);
        
        if (!itemName) {
          errors.push({ row: rowNumber, message: 'Item Name is required' });
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
              warnings.push({ row: rowNumber, message: `Item Group "${itemGroupName}" not found, using default` });
            }
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
              warnings.push({ row: rowNumber, message: `Kitchen Category "${kitchenCategoryName}" not found, using default` });
            }
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
              warnings.push({ row: rowNumber, message: `Kitchen Main Group "${kitchenMainGroupName}" not found, using default` });
            }
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
              warnings.push({ row: rowNumber, message: `Tax Group "${taxGroupName}" not found, using default` });
            }
          }
        }

        // Get other values
        const itemNo = getValue(row, ['Item No', 'item_no', 'ItemNo', 'Item Number']);
        const printName = getValue(row, ['Print Name', 'print_name', 'PrintName']);
        const shortName = getValue(row, ['Short Name', 'short_name', 'ShortName']);
        const description = getValue(row, ['Description', 'description', 'Item Description']);
        const hsnCode = getValue(row, ['HSN Code', 'hsn_code', 'HSN', 'HSNCode']);
        
        // Status
        const statusText = getValue(row, ['Status', 'status']);
        const status = statusText ? (statusText.toString().toLowerCase() === 'active' ? 1 : 0) : 1;
        
        // Boolean fields
        const isRuntimeRates = parseBoolean(getValue(row, ['Runtime Rates', 'runtime_rates']), false);
        const isCommonToAll = parseBoolean(getValue(row, ['Common to All Departments', 'common_to_all']), true);
        const isIngredientsRequired = parseBoolean(getValue(row, ['Is Ingredients Required', 'ingredients_required']), false);
        const consumeOnBill = parseBoolean(getValue(row, ['Consume on Bill', 'consume_on_bill']), false);
        const reverseStockCancelKot = parseBoolean(getValue(row, ['Reverse Stock Cancel KOT', 'reverse_stock_cancel_kot']), false);
        const allowNegativeStock = parseBoolean(getValue(row, ['Allow Negative Stock', 'allow_negative_stock']), false);
        const consumeRawOnBill = parseBoolean(getValue(row, ['Consume Raw on Bill', 'consume_raw_on_bill']), false);
        const consumeRawOnKot = parseBoolean(getValue(row, ['Consume Raw on KOT', 'consume_raw_on_kot']), false);
        
        const openingStockQtyRaw = getValue(row, ['Opening Stock Qty', 'opening_stock_qty']);
        const openingStockQty = openingStockQtyRaw ? parseFloat(openingStockQtyRaw) : 0;
        const storeName = getValue(row, ['Store Name', 'store_name']);

        // ============ EXTRACT DEPARTMENT-WISE RATES ============
        const departmentRates = [];
        
        // First try to get common price from 'Price' column
        let defaultPrice = parsePrice(getValue(row, ['Price', 'price', 'Rate', 'rate']));
        
        // If no common price, try to get from 'Selling Price' or 'Amount'
        if (defaultPrice === null) {
          defaultPrice = parsePrice(getValue(row, ['Selling Price', 'selling_price', 'Amount', 'amount']));
        }
        
        // Extract department-specific rates from columns like "Rate (Department Name)"
        let hasAnyRate = false;
        
        for (const dept of departments) {
          const rateColumnName = `Rate (${dept.department_name})`;
          let rateValue = null;
          
          // Try exact column name
          if (row[rateColumnName] !== undefined) {
            rateValue = row[rateColumnName];
          } else {
            // Try case-insensitive match
            for (const key of Object.keys(row)) {
              if (key.toLowerCase() === `rate (${dept.department_name.toLowerCase()})`) {
                rateValue = row[key];
                break;
              }
            }
          }
          
          const rate = parsePrice(rateValue);
          
          if (rate !== null && rate > 0) {
            departmentRates.push({
              departmentId: dept.departmentid,
              departmentName: dept.department_name,
              rate: rate
            });
            hasAnyRate = true;
          } else if (defaultPrice !== null && defaultPrice > 0) {
            // Use default price if available
            departmentRates.push({
              departmentId: dept.departmentid,
              departmentName: dept.department_name,
              rate: defaultPrice
            });
            hasAnyRate = true;
          }
        }
        
        // If still no rates, try to get from any column that might contain price
        if (!hasAnyRate) {
          // Try to find any numeric column that might be a price
          for (const key of Object.keys(row)) {
            const value = row[key];
            const price = parsePrice(value);
            if (price !== null && price > 0 && !key.toLowerCase().includes('name') && !key.toLowerCase().includes('code')) {
              defaultPrice = price;
              hasAnyRate = true;
              warnings.push({ row: rowNumber, message: `Using "${key}" column as price: ${price}` });
              break;
            }
          }
        }
        
        // If we have a default price but no department rates yet, create for all departments
        if (!hasAnyRate && defaultPrice !== null && defaultPrice > 0) {
          for (const dept of departments) {
            departmentRates.push({
              departmentId: dept.departmentid,
              departmentName: dept.department_name,
              rate: defaultPrice
            });
          }
          hasAnyRate = true;
        }
        
        if (!hasAnyRate || departmentRates.length === 0) {
          errors.push({ 
            row: rowNumber, 
            message: `No valid price/rate found. Please provide either 'Price' column or 'Rate (Department Name)' columns. Available columns: ${Object.keys(row).join(', ')}` 
          });
          continue;
        }

        // Get the first rate as the main price for mstrestmenu table
        const mainPrice = departmentRates[0]?.rate || 0;

        // Insert into database - NOW INCLUDING price FIELD
        const insertStmt = `
          INSERT INTO mstrestmenu (
            hotelid, outletid, item_no, item_name, print_name, short_name,
            kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id,
            item_group_id, item_main_group_id, stock_unit, price, taxgroupid,
            is_runtime_rates, is_common_to_all_departments, 
            is_ingredients_required, consume_on_bill, reverse_stock_cancel_kot,
            allow_negative_stock, opening_stock_quantity, opening_stock_unit_id,
            consume_raw_materials_on_bill, consume_raw_materials_on_kot, 
            store_name, item_description, item_hsncode, status,
            created_by_id, created_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const insertParams = [
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
          null, // item_main_group_id
          null, // stock_unit
          mainPrice, // price field - IMPORTANT: This fixes the "Field 'price' doesn't have a default value" error
          taxGroupId,
          isRuntimeRates,
          isCommonToAll,
          isIngredientsRequired,
          consumeOnBill,
          reverseStockCancelKot,
          allowNegativeStock,
          openingStockQty,
          null, // opening_stock_unit_id
          consumeRawOnBill,
          consumeRawOnKot,
          storeName ? safeString(storeName) : null,
          description ? safeString(description) : null,
          hsnCode ? safeString(hsnCode) : null,
          status,
          parsedCreatedById
        ];

        console.log(`Inserting row ${rowNumber}:`, { itemName: itemNameStr, price: mainPrice, departments: departmentRates.length });

        const [result] = await db.query(insertStmt, insertParams);

        const restitemid = result.insertId;

        // Insert department-wise rates into mstrestmenudetails
        const detailStmt = `
          INSERT INTO mstrestmenudetails (restitemid, departmentid, item_rate, hotelid)
          VALUES (?, ?, ?, ?)
        `;

        for (const deptRate of departmentRates) {
          await db.query(detailStmt, [restitemid, deptRate.departmentId, deptRate.rate, parsedHotelId]);
          console.log(`  - Added rate for ${deptRate.departmentName}: ${deptRate.rate}`);
        }

        importedItems.push({ 
          restitemid, 
          item_name: itemNameStr, 
          item_no: itemNo ? safeString(itemNo) : 'N/A',
          price: mainPrice,
          department_rates: departmentRates.map(d => `${d.departmentName}: ${d.rate}`).join(', ')
        });
        
        console.log(`✓ Row ${rowNumber}: Imported "${itemNameStr}" with price ${mainPrice} and ${departmentRates.length} department rates`);

      } catch (rowError) {
        console.error(`Error processing row ${rowNumber}:`, rowError);
        errors.push({ row: rowNumber, message: rowError.message });
      }
    }

    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Successfully imported: ${importedItems.length} items`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Errors: ${errors.length}`);

    res.json({
      success: true,
      data: { 
        imported: importedItems.length, 
        warnings: warnings,
        errors: errors,
        importedItems: importedItems.slice(0, 10)
      },
      message: `Successfully imported ${importedItems.length} items${warnings.length > 0 ? ` with ${warnings.length} warnings` : ''}${errors.length > 0 ? ` and ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import menu items', 
      error: error.message,
      data: null 
    });
  }
};

// =========================
// 3. DOWNLOAD TEMPLATE (WITH DEPARTMENT-WISE RATES)
// =========================
exports.downloadSampleTemplate = async (req, res) => {
  try {
    const { hotelid, outletid } = req.query;
    
    console.log('📥 Generating template for:', { hotelid, outletid });
    
    // Load real data for dropdown suggestions
    let itemGroups = [];
    let kitchenCategories = [];
    let kitchenMainGroups = [];
    let taxGroups = [];
    let departments = [];
    
    try {
      const [rows] = await db.query(`
        SELECT itemgroupname 
        FROM mst_Item_Group 
        WHERE status IN (0,1) AND itemgroupname IS NOT NULL 
        ORDER BY itemgroupname LIMIT 20
      `);
      itemGroups = rows;
    } catch (err) {
      console.warn('Could not load item groups:', err.message);
    }
    
    try {
      const [rows] = await db.query(`
        SELECT Kitchen_Category 
        FROM mstkitchencategory 
        WHERE status IN (0,1) AND Kitchen_Category IS NOT NULL 
        ORDER BY Kitchen_Category LIMIT 20
      `);
      kitchenCategories = rows;
    } catch (err) {
      console.warn('Could not load kitchen categories:', err.message);
    }
    
    try {
      const [rows] = await db.query(`
        SELECT Kitchen_main_Group 
        FROM mstkitchenmaingroup 
        WHERE status IN (0,1) AND Kitchen_main_Group IS NOT NULL 
        ORDER BY Kitchen_main_Group LIMIT 20
      `);
      kitchenMainGroups = rows;
    } catch (err) {
      console.warn('Could not load kitchen main groups:', err.message);
    }
    
    try {
      const [rows] = await db.query(`
        SELECT taxgroup_name 
        FROM msttaxgroup 
        WHERE status IN (0,1) AND taxgroup_name IS NOT NULL 
        ORDER BY taxgroup_name LIMIT 20
      `);
      taxGroups = rows;
    } catch (err) {
      console.warn('Could not load tax groups:', err.message);
    }
    
    // Load departments for the hotel/outlet
    try {
      let deptQuery = `
        SELECT departmentid, department_name 
        FROM msttable_department 
        WHERE status IN (0,1)
      `;
      const deptParams = [];
      
      if (outletid) {
        deptQuery += ' AND outletid = ?';
        deptParams.push(parseInt(outletid));
      }
      
      const [rows] = await db.query(deptQuery, deptParams);
      departments = rows;
    } catch (err) {
      console.warn('Could not load departments:', err.message);
    }
    
    console.log('Departments for template:', departments.length);
    
    // If no departments found, use fallback
    if (departments.length === 0) {
      departments = [
        { department_name: 'Main Department' },
        { department_name: 'Kitchen' },
        { department_name: 'Bar' }
      ];
    }
    
    // Build sample data row
    const sampleRow = {
      'Item No': '',
      'Item Name': 'Butter Chicken',
      'Print Name': 'Butter Chicken',
      'Short Name': 'Btr Chkn',
      'Description': 'Creamy tomato based chicken curry',
      'HSN Code': '21069099',
      'Status': 'Active',
      'Item Group': itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Non-Veg',
      'Kitchen Main Group': kitchenMainGroups.length > 0 ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course',
      'Kitchen Category': kitchenCategories.length > 0 ? kitchenCategories[0].Kitchen_Category : 'Non-Veg',
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
    };
    
    // Add department-wise rate columns
    for (const dept of departments) {
      sampleRow[`Rate (${dept.department_name})`] = '';
    }
    
    const sampleData = [sampleRow];
    
    // Second sample row for demonstration
    const sampleRow2 = {
      'Item No': '',
      'Item Name': 'Dal Makhani',
      'Print Name': 'Dal Makhani',
      'Short Name': 'Dal Mak',
      'Description': 'Black lentils cooked overnight',
      'HSN Code': '21069099',
      'Status': 'Active',
      'Item Group': itemGroups.length > 1 ? itemGroups[1].itemgroupname : (itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Veg'),
      'Kitchen Main Group': kitchenMainGroups.length > 1 ? kitchenMainGroups[1].Kitchen_main_Group : (kitchenMainGroups.length > 0 ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course'),
      'Kitchen Category': kitchenCategories.length > 1 ? kitchenCategories[1].Kitchen_Category : (kitchenCategories.length > 0 ? kitchenCategories[0].Kitchen_Category : 'Veg'),
      'Kitchen Sub Category': '',
      'Tax Group': taxGroups.length > 1 ? taxGroups[1].taxgroup_name : (taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 5%'),
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
    };
    
    // Add department-wise rate columns for second row with sample rates
    for (const dept of departments) {
      sampleRow2[`Rate (${dept.department_name})`] = dept.department_name === departments[0].department_name ? '350' : '300';
    }
    
    sampleData.push(sampleRow2);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create main data sheet
    const wsData = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const cols = [
      { wch: 12 }, // Item No
      { wch: 30 }, // Item Name
      { wch: 25 }, // Print Name
      { wch: 15 }, // Short Name
      { wch: 40 }, // Description
      { wch: 15 }, // HSN Code
      { wch: 10 }, // Status
      { wch: 20 }, // Item Group
      { wch: 22 }, // Kitchen Main Group
      { wch: 20 }, // Kitchen Category
      { wch: 22 }, // Kitchen Sub Category
      { wch: 18 }, // Tax Group
      { wch: 14 }, // Runtime Rates
      { wch: 25 }, // Common to All Departments
      { wch: 22 }, // Is Ingredients Required
      { wch: 16 }, // Consume on Bill
      { wch: 24 }, // Reverse Stock Cancel KOT
      { wch: 20 }, // Allow Negative Stock
      { wch: 18 }, // Opening Stock Qty
      { wch: 20 }, // Consume Raw on Bill
      { wch: 20 }, // Consume Raw on KOT
      { wch: 15 }  // Store Name
    ];
    
    // Add department rate columns
    for (const dept of departments) {
      cols.push({ wch: 18 });
    }
    
    wsData['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, wsData, 'Menu Items Template');
    
    // Create instructions sheet
    const instructions = [
      { 'Column Name': 'Item No', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Unique item code (optional)', 'Example': 'ITEM001' },
      { 'Column Name': 'Item Name', 'Required': 'Yes', 'Data Type': 'Text', 'Description': 'Name of the menu item', 'Example': 'Butter Chicken' },
      { 'Column Name': 'Print Name', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Name to print on bills', 'Example': 'Butter Chicken' },
      { 'Column Name': 'Short Name', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Short name for KOT', 'Example': 'Btr Chkn' },
      { 'Column Name': 'Description', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Item description', 'Example': 'Creamy tomato based chicken curry' },
      { 'Column Name': 'HSN Code', 'Required': 'No', 'Data Type': 'Text', 'Description': 'HSN/SAC code', 'Example': '21069099' },
      { 'Column Name': 'Status', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Active or Inactive', 'Example': 'Active', 'Default': 'Active' },
      { 'Column Name': 'Item Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Item Group', 'Example': itemGroups.length > 0 ? itemGroups[0].itemgroupname : 'Non-Veg' },
      { 'Column Name': 'Kitchen Main Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Main Group', 'Example': kitchenMainGroups.length > 0 ? kitchenMainGroups[0].Kitchen_main_Group : 'Main Course' },
      { 'Column Name': 'Kitchen Category', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Category', 'Example': kitchenCategories.length > 0 ? kitchenCategories[0].Kitchen_Category : 'Non-Veg' },
      { 'Column Name': 'Kitchen Sub Category', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Kitchen Sub Category', 'Example': '' },
      { 'Column Name': 'Tax Group', 'Required': 'No', 'Data Type': 'Text', 'Description': 'Must match existing Tax Group', 'Example': taxGroups.length > 0 ? taxGroups[0].taxgroup_name : 'GST 18%' },
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
    
    // Add department rate instructions
    for (const dept of departments) {
      instructions.push({ 
        'Column Name': `Rate (${dept.department_name})`, 
        'Required': 'No', 
        'Data Type': 'Number', 
        'Description': `Rate for ${dept.department_name} department. Leave blank to use common price.`, 
        'Example': '350', 
        'Default': 'Uses Price column value' 
      });
    }
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 30 }, // Column Name
      { wch: 10 }, // Required
      { wch: 15 }, // Data Type
      { wch: 45 }, // Description
      { wch: 20 }, // Example
      { wch: 25 }  // Default
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
    
    // Add Departments
    if (departments.length > 0) {
      validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
      validValues.push({ 'Field': '=== DEPARTMENTS ===', 'Valid Value': '', 'Note': 'Rate columns created for these departments' });
      departments.forEach(dept => {
        validValues.push({ 'Field': `Rate (${dept.department_name})`, 'Valid Value': 'Any positive number', 'Note': 'Department-specific rate' });
      });
    }
    
    // Add common values
    validValues.push({ 'Field': '', 'Valid Value': '', 'Note': '' });
    validValues.push({ 'Field': '=== COMMON VALUES ===', 'Valid Value': '', 'Note': '' });
    validValues.push({ 'Field': 'Status', 'Valid Value': 'Active, Inactive', 'Note': 'Default: Active' });
    validValues.push({ 'Field': 'Boolean Fields', 'Valid Value': 'Yes, No', 'Note': 'Runtime Rates, Common to All Departments, etc.' });
    
    const wsValidValues = XLSX.utils.json_to_sheet(validValues);
    wsValidValues['!cols'] = [
      { wch: 30 }, // Field
      { wch: 30 }, // Valid Value
      { wch: 40 }  // Note
    ];
    XLSX.utils.book_append_sheet(wb, wsValidValues, 'Valid Values');
    
    // Write buffer
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false 
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="menu_import_template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.end(buffer);

  } catch (err) {
    console.error('Template generation error:', err);
    
    // Fallback: Create a basic template
    try {
      const fallbackData = [
        {
          'Item Name': 'Sample Item',
          'Item Group': 'Non-Veg',
          'Kitchen Category': 'Non-Veg',
          'Tax Group': 'GST 18%',
          'Rate (Main Department)': '100',
          'Rate (Kitchen)': '100',
          'Rate (Bar)': '120'
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