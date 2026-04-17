const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

/* ═══════════════════════════════════════════════════════
   GET ALL KITCHEN SUB CATEGORY
═══════════════════════════════════════════════════════ */
exports.getKitchenSubCategory = async (req, res) => {
    try {
        const [KitchenSubCategory] = await db.query(
            'SELECT * FROM mstkitchensubcategory'
        );

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
exports.addKitchenSubCategory = async (req, res) => {
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

        const [result] = await db.query(`
            INSERT INTO mstkitchensubcategory 
            (Kitchen_sub_category, kitchencategoryid, kitchenmaingroupid, status, created_by_id, created_date, hotelid, marketid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            status,
            created_by_id,
            formatMySQLDate(created_date),
            hotelid,
            marketid
        ]);

        res.status(201).json({
            success: true,
            message: "Kitchen Sub Category created successfully",
            data: {
                kitchensubcategoryid: result.insertId,
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
exports.updateKitchenSubCategory = async (req, res) => {
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

        const [result] = await db.query(`
            UPDATE mstkitchensubcategory 
            SET Kitchen_sub_category = ?, 
                kitchencategoryid = ?, 
                kitchenmaingroupid = ?, 
                updated_by_id = ?, 
                updated_date = ?, 
                status = ?
            WHERE kitchensubcategoryid = ?
        `, [
            Kitchen_sub_category,
            kitchencategoryid,
            kitchenmaingroupid,
            updated_by_id,
            formatMySQLDate(updated_date),
            status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Kitchen Sub Category not found",
                data: null
            });
        }

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
exports.deleteKitchenSubCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM mstkitchensubcategory WHERE kitchensubcategoryid = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Kitchen Sub Category not found",
                data: null
            });
        }

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