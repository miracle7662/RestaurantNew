const db = require('../config/db');

/* ═══════════════════════════════════════════════════════
   GET ALL KITCHEN SUB CATEGORY
═══════════════════════════════════════════════════════ */
exports.getKitchenSubCategory = (req, res) => {
    try {
        const KitchenSubCategory = db
            .prepare('SELECT * FROM mstkitchensubcategory')
            .all();

        res.status(200).json({
            success: true,
            message: "Kitchen Sub Categories fetched successfully",
            data: KitchenSubCategory,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch Kitchen Sub Categories",
            data: null,
            error: error.message
        });
    }
};


/* ═══════════════════════════════════════════════════════
   ADD KITCHEN SUB CATEGORY
═══════════════════════════════════════════════════════ */
exports.addKitchenSubCategory = (req, res) => {
    try {
        const {
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            status,
            created_by_id,
            created_date,
            hotelid,
            marketid
        } = req.body;

        const stmt = db.prepare(`
            INSERT INTO mstkitchensubcategory 
            (Kitchen_sub_category, kitchencategoryid, kitchenmaingroupid, status, created_by_id, created_date, hotelid, marketid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            status,
            created_by_id,
            created_date,
            hotelid,
            marketid
        );

        res.status(201).json({
            success: true,
            message: "Kitchen Sub Category created successfully",
            data: {
                kitchensubcategoryid: result.lastInsertRowid,
                Kitchen_sub_category,
                kitchencategoryid,
                kitchenmaingroupid,
                status,
                created_by_id,
                created_date,
                hotelid,
                marketid
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create Kitchen Sub Category",
            data: null,
            error: error.message
        });
    }
};


/* ═══════════════════════════════════════════════════════
   UPDATE KITCHEN SUB CATEGORY
═══════════════════════════════════════════════════════ */
exports.updateKitchenSubCategory = (req, res) => {
    try {
        const { id } = req.params;
        const {
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            updated_by_id,
            updated_date,
            status
        } = req.body;

        const stmt = db.prepare(`
            UPDATE mstkitchensubcategory 
            SET Kitchen_sub_category = ?, 
                kitchencategoryid = ?, 
                kitchenmaingroupid = ?, 
                updated_by_id = ?, 
                updated_date = ?, 
                status = ?
            WHERE kitchensubcategoryid = ?
        `);

        stmt.run(
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            updated_by_id,
            updated_date,
            status,
            id
        );

        res.status(200).json({
            success: true,
            message: "Kitchen Sub Category updated successfully",
            data: {
                kitchensubcategoryid: id,
                Kitchen_sub_category,
                kitchencategoryid,
                kitchenmaingroupid,
                updated_by_id,
                updated_date,
                status
            },
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update Kitchen Sub Category",
            data: null,
            error: error.message
        });
    }
};


/* ═══════════════════════════════════════════════════════
   DELETE KITCHEN SUB CATEGORY
═══════════════════════════════════════════════════════ */
exports.deleteKitchenSubCategory = (req, res) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare(
            'DELETE FROM mstkitchensubcategory WHERE kitchensubcategoryid = ?'
        );
        stmt.run(id);

        res.status(200).json({
            success: true,
            message: "Kitchen Sub Category deleted successfully",
            data: null,
            error: null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete Kitchen Sub Category",
            data: null,
            error: error.message
        });
    }
};