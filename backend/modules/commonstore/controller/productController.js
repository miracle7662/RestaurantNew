const db = require('../../../config/db');

// ============================================================
// CREATE PRODUCT
// ============================================================
exports.createProduct = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const {
      hotelid,
      outletid,
      item_code,
      barcode,
      item_name,
      short_name,
      categoryid,
      brandid,
      item_type = "RAW_MATERIAL",
      unitid,
      purchase_rate = 0,
      average_rate = 0,
      mrp = 0,
      is_stock_item = 1,
      is_purchase_item = 1,
      is_sale_item = 0,
      is_housekeeping_item = 0,
      is_restaurant_item = 0,
      is_bar_item = 0,
      is_recipe_item = 0,
      allow_negative_stock = 0,
      gst_percent = 0,
      hsn_sac_code,
      reorder_level = 0,
      minimum_stock = 0,
      maximum_stock = 0,
      status = 1,
      createdby
    } = req.body;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------
    if (!hotelid) {
      return res.status(400).json({
        success: false,
        message: "hotelid is required"
      });
    }

    if (!outletid) {
      return res.status(400).json({
        success: false,
        message: "outletid is required"
      });
    }

    if (!item_code) {
      return res.status(400).json({
        success: false,
        message: "Item code is required"
      });
    }

    if (!item_name) {
      return res.status(400).json({
        success: false,
        message: "Item name is required"
      });
    }

    // if (!categoryid) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Category is required"
    //   });
    // }

    // if (!unitid) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Unit is required"
    //   });
    // }

    // --------------------------------------------------------
    // Check duplicate item code
    // --------------------------------------------------------
    const [existingCode] = await connection.execute(
      `
      SELECT itemid
      FROM mst_product
      WHERE hotelid = ?
        AND outletid = ?
        AND item_code = ?
      LIMIT 1
      `,
      [hotelid, outletid, item_code]
    );

    if (existingCode.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Item code already exists"
      });
    }

    // --------------------------------------------------------
    // Check duplicate barcode
    // --------------------------------------------------------
    if (barcode) {
      const [existingBarcode] = await connection.execute(
        `
        SELECT itemid
        FROM mst_product
        WHERE hotelid = ?
          AND outletid = ?
          AND barcode = ?
        LIMIT 1
        `,
        [hotelid, outletid, barcode]
      );

      if (existingBarcode.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Barcode already exists"
        });
      }
    }

    // --------------------------------------------------------
    // Insert Product
    // --------------------------------------------------------
const [result] = await connection.execute(
  `
  INSERT INTO mst_product (
    hotelid, outletid, item_code, barcode, item_name, short_name,
    categoryid, brandid, item_type, unitid, purchase_rate, average_rate,
    mrp, is_stock_item, is_purchase_item, is_sale_item,
    is_housekeeping_item, is_restaurant_item, is_bar_item, is_recipe_item,
    allow_negative_stock, gst_percent, hsn_sac_code, reorder_level,
    minimum_stock, maximum_stock, status, createdby, createdon
  )
  VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, NOW()
  )
  `,
  [
    hotelid,
    outletid,
    item_code,
    barcode || null,
    item_name,
    short_name || null,
    categoryid,
    brandid || null,
    item_type,
    unitid,
    purchase_rate,
    average_rate,
    mrp,
    is_stock_item ? 1 : 0,
    is_purchase_item ? 1 : 0,
    is_sale_item ? 1 : 0,
    is_housekeeping_item ? 1 : 0,
    is_restaurant_item ? 1 : 0,
    is_bar_item ? 1 : 0,
    is_recipe_item ? 1 : 0,
    allow_negative_stock ? 1 : 0,
    gst_percent,
    hsn_sac_code || null,
    reorder_level,
    minimum_stock,
    maximum_stock,
    status,
    createdby || null
  ]
);

    // --------------------------------------------------------
    // Get inserted product
    // --------------------------------------------------------
    const [product] = await connection.execute(
      `
      SELECT *
      FROM mst_product
      WHERE itemid = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product[0]
    });

  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};


// ============================================================
// GET ALL PRODUCTS
// ============================================================
exports.getProducts = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const {
      hotelid,
      outletid,
      status
    } = req.query;

    if (!hotelid || !outletid) {
      return res.status(400).json({
        success: false,
        message: "hotelid and outletid are required"
      });
    }

    let sql = `
      SELECT
        p.*,
        c.category_name,
        u.unit_name
      FROM mst_product p

      LEFT JOIN mst_product_category c
        ON c.categoryid = p.categoryid

      LEFT JOIN mstunitmaster u
        ON u.unitid = p.unitid

      WHERE p.hotelid = ?
        AND p.outletid = ?
    `;

    const params = [hotelid, outletid];

    if (status !== undefined) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY p.itemid DESC`;

    const [rows] = await connection.execute(sql, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};


// ============================================================
// GET SINGLE PRODUCT
// ============================================================
exports.getProductById = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { itemid } = req.params;
    const { hotelid, outletid } = req.query;

    if (!hotelid || !outletid) {
      return res.status(400).json({
        success: false,
        message: "hotelid and outletid are required"
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        p.*,
        c.category_name,
        u.unit_name
      FROM mst_product p

      LEFT JOIN mst_product_category c
        ON c.categoryid = p.categoryid

      LEFT JOIN mstunitmaster u
        ON u.unitid = p.unitid

      WHERE p.itemid = ?
        AND p.hotelid = ?
        AND p.outletid = ?
      LIMIT 1
      `,
      [itemid, hotelid, outletid]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};


// ============================================================
// GET PRODUCT CATEGORIES
// ============================================================
exports.getProductCategories = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { hotelid, outletid } = req.query;

    if (!hotelid || !outletid) {
      return res.status(400).json({
        success: false,
        message: "hotelid and outletid are required"
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        categoryid,
        hotelid,
        outletid,
        category_code,
        category_name,
        parent_categoryid,
        status
      FROM mst_product_category
      WHERE hotelid = ?
        AND outletid = ?
        AND status = 1
      ORDER BY category_name ASC
      `,
      [hotelid, outletid]
    );
    console.log("BRAND QUERY:", { hotelid, outletid });
console.log("BRAND ROWS:", rows);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GET PRODUCT CATEGORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product categories",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};

// ============================================================
// GET PRODUCT BRANDS
// ============================================================
exports.getProductBrands = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { hotelid, outletid } = req.query;

    if (!hotelid || !outletid) {
      return res.status(400).json({
        success: false,
        message: "hotelid and outletid are required"
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        brandid,
        hotelid,
        outletid,
        brand_code,
        brand_name,
        status
      FROM mst_product_brand
      WHERE hotelid = ?
        AND outletid = ?
        AND status = 1
      ORDER BY brand_name ASC
      `,
      [hotelid, outletid]
    );

  console.log("BRAND QUERY:", { hotelid, outletid });
console.log("BRAND ROWS:", rows);
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GET PRODUCT BRANDS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product brands",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};


// ============================================================
// UPDATE PRODUCT
// ============================================================
exports.updateProduct = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { itemid } = req.params;

    const {
      hotelid,
      outletid,
      item_code,
      barcode,
      item_name,
      short_name,
      categoryid,
      brandid,
      item_type,
      unitid,
      purchase_rate = 0,
      average_rate = 0,
      mrp = 0,
      is_stock_item = 1,
      is_purchase_item = 1,
      is_sale_item = 0,
      is_housekeeping_item = 0,
      is_restaurant_item = 0,
      is_bar_item = 0,
      is_recipe_item = 0,
      allow_negative_stock = 0,
      gst_percent = 0,
      hsn_sac_code,
      reorder_level = 0,
      minimum_stock = 0,
      maximum_stock = 0,
      status = 1,
      updatedby
    } = req.body;

    if (!hotelid || !outletid) {
      return res.status(400).json({
        success: false,
        message: "hotelid and outletid are required"
      });
    }

    if (!item_code || !item_name || !categoryid || !unitid) {
      return res.status(400).json({
        success: false,
        message: "Item code, item name, category and unit are required"
      });
    }

    // Check product exists
    const [existing] = await connection.execute(
      `
      SELECT itemid
      FROM mst_product
      WHERE itemid = ?
        AND hotelid = ?
        AND outletid = ?
      `,
      [itemid, hotelid, outletid]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Duplicate item code
    const [duplicateCode] = await connection.execute(
      `
      SELECT itemid
      FROM mst_product
      WHERE hotelid = ?
        AND outletid = ?
        AND item_code = ?
        AND itemid != ?
      LIMIT 1
      `,
      [hotelid, outletid, item_code, itemid]
    );

    if (duplicateCode.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Item code already exists"
      });
    }

    // Update
    await connection.execute(
      `
      UPDATE mst_product
      SET
        item_code = ?,
        barcode = ?,
        item_name = ?,
        short_name = ?,
        categoryid = ?,
        brandid = ?,
        item_type = ?,
        unitid = ?,
        purchase_rate = ?,
        average_rate = ?,
        mrp = ?,
        is_stock_item = ?,
        is_purchase_item = ?,
        is_sale_item = ?,
        is_housekeeping_item = ?,
        is_restaurant_item = ?,
        is_bar_item = ?,
        is_recipe_item = ?,
        allow_negative_stock = ?,
        gst_percent = ?,
        hsn_sac_code = ?,
        reorder_level = ?,
        minimum_stock = ?,
        maximum_stock = ?,
        status = ?,
        updatedby = ?,
        updatedon = NOW()
      WHERE itemid = ?
        AND hotelid = ?
        AND outletid = ?
      `,
      [
        item_code,
        barcode || null,
        item_name,
        short_name || null,
        categoryid,
        brandid || null,
        item_type,
        unitid,
        purchase_rate,
        average_rate,
        mrp,
        is_stock_item ? 1 : 0,
        is_purchase_item ? 1 : 0,
        is_sale_item ? 1 : 0,
        is_housekeeping_item ? 1 : 0,
        is_restaurant_item ? 1 : 0,
        is_bar_item ? 1 : 0,
        is_recipe_item ? 1 : 0,
        allow_negative_stock ? 1 : 0,
        gst_percent,
        hsn_sac_code || null,
        reorder_level,
        minimum_stock,
        maximum_stock,
        status,
        updatedby || null,
        itemid,
        hotelid,
        outletid
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully"
    });

  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};


// ============================================================
// DELETE / DEACTIVATE PRODUCT
// ============================================================
exports.deleteProduct = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { itemid } = req.params;
    const payload = req.body; // { hotelid, outletid, updatedby } or empty

    // Check if payload exists (soft delete) or not (hard delete)
    const isSoftDelete = payload && Object.keys(payload).length > 0;

    if (isSoftDelete) {
      // ---- SOFT DELETE ----
      const { hotelid, outletid, updatedby } = payload;

      if (!hotelid || !outletid) {
        return res.status(400).json({
          success: false,
          message: "hotelid and outletid are required for soft delete"
        });
      }

      const [result] = await connection.execute(
        `
        UPDATE mst_product
        SET
          status = 0,
          updatedby = ?,
          updatedon = NOW()
        WHERE itemid = ?
          AND hotelid = ?
          AND outletid = ?
        `,
        [
          updatedby || null,
          itemid,
          hotelid,
          outletid
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product deactivated successfully"
      });

    } else {
      // ---- HARD DELETE ----
      const [result] = await connection.execute(
        `DELETE FROM mst_product WHERE itemid = ?`,
        [itemid]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product permanently deleted"
      });
    }

  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });

  } finally {
    if (connection) connection.release();
  }
};