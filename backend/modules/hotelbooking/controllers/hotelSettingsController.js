// controllers/hotelSettingsController.js
const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotelid || req.user?.hotel_id || null;

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// Get UI settings for a hotel
exports.getUiSettings = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }
        if (!hotelId) {
            return res.status(400).json({ 
                success: false, 
                message: "Hotel ID not found" 
            });
        }

        const [settings] = await db.execute(
            `SELECT * FROM hotel_ui_settings WHERE hotelid = ?`,
            [hotelId]
        );

        if (settings.length === 0) {
            // Return default settings if none exist
            return res.json({
                success: true,
                message: "No settings found, using defaults",
                data: {
                    hotel_id: hotelId,
                    show_left_category: true,
                    show_room_text: true,
                    room_box_size: 2,
                    color_vacant: '#ffffff',
                    color_occupied: '#DFF5E1',
                    color_cleaning: '#FFF4CC',
                    color_reserved: '#D9F1FF',
                    color_maintenance: '#FFE0E0',
                    color_reservation: '#D9F1FF',
                    text_color_vacant: '#4B5563',
                    text_color_occupied: '#16A34A',
                    text_color_cleaning: '#D4A017',
                    text_color_reserved: '#0284C7',
                    text_color_maintenance: '#DC2626',
                    text_color_reservation: '#0284C7',
                    border_color_vacant: '#9CA3AF',
                    border_color_occupied: '#4ADE80',
                    border_color_cleaning: '#FACC15',
                    border_color_reserved: '#38BDF8',
                    border_color_maintenance: '#F87171',
                    border_color_reservation: '#38BDF8',
                    occupied_warning_bg: '#b96eff',
                    occupied_warning_text: '#ffffff',
                    occupied_expired_bg: '#E03F4F',
                    occupied_expired_text: '#ffffff',
                    dark_mode: false
                }
            });
        }

        const setting = settings[0];
        
        // Convert to frontend expected format
        const responseData = {
            hotel_id: setting.hotelid,
            show_left_category: setting.show_left_category === 1,
            show_room_text: setting.show_room_text === 1,
            room_box_size: setting.room_box_size,
            color_vacant: setting.color_vacant,
            color_occupied: setting.color_occupied,
            color_cleaning: setting.color_cleaning,
            color_reserved: setting.color_reserved,
            color_maintenance: setting.color_maintenance,
            color_reservation: setting.color_reservation,
            text_color_vacant: setting.text_color_vacant,
            text_color_occupied: setting.text_color_occupied,
            text_color_cleaning: setting.text_color_cleaning,
            text_color_reserved: setting.text_color_reserved,
            text_color_maintenance: setting.text_color_maintenance,
            text_color_reservation: setting.text_color_reservation,
            border_color_vacant: setting.border_color_vacant,
            border_color_occupied: setting.border_color_occupied,
            border_color_cleaning: setting.border_color_cleaning,
            border_color_reserved: setting.border_color_reserved,
            border_color_maintenance: setting.border_color_maintenance,
            border_color_reservation: setting.border_color_reservation,
            occupied_warning_bg: setting.occupied_warning_bg,
            occupied_warning_text: setting.occupied_warning_text,
            occupied_expired_bg: setting.occupied_expired_bg,
            occupied_expired_text: setting.occupied_expired_text,
            dark_mode: setting.dark_mode === 1,
            created_date: formatDate(setting.created_date),
            updated_date: formatDate(setting.updated_date)
        };

        res.json({
            success: true,
            message: "Settings fetched successfully",
            data: responseData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Database error", 
            error: error.message 
        });
    }
};

// Create or update UI settings
exports.saveUiSettings = async (req, res) => {
    try {
        const {
            show_left_category,
            show_room_text,
            room_box_size,
            color_vacant,
            color_occupied,
            color_cleaning,
            color_reserved,
            color_maintenance,
            color_reservation,
            text_color_vacant,
            text_color_occupied,
            text_color_cleaning,
            text_color_reserved,
            text_color_maintenance,
            text_color_reservation,
            border_color_vacant,
            border_color_occupied,
            border_color_cleaning,
            border_color_reserved,
            border_color_maintenance,
            border_color_reservation,
            occupied_warning_bg,
            occupied_warning_text,
            occupied_expired_bg,
            occupied_expired_text,
            dark_mode,
            hotel_id,
            hotelid
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || hotel_id || getCurrentUserHotelId(req);

        if (!hotelId) {
            return res.status(400).json({ 
                success: false, 
                message: "Hotel ID not found" 
            });
        }

        // Convert boolean to tinyint
        const showLeftCategoryVal = show_left_category !== undefined ? (show_left_category ? 1 : 0) : 1;
        const showRoomTextVal = show_room_text !== undefined ? (show_room_text ? 1 : 0) : 1;
        const darkModeVal = dark_mode !== undefined ? (dark_mode ? 1 : 0) : 0;

        // Check if settings already exist for this hotel
        const [existing] = await db.execute(
            'SELECT id FROM hotel_ui_settings WHERE hotelid = ?',
            [hotelId]
        );

        let message;

        if (existing.length > 0) {
            // Update existing settings
            await db.execute(`
                UPDATE hotel_ui_settings 
                SET show_left_category = ?,
                    show_room_text = ?,
                    room_box_size = ?,
                    color_vacant = ?,
                    color_occupied = ?,
                    color_cleaning = ?,
                    color_reserved = ?,
                    color_maintenance = ?,
                    color_reservation = ?,
                    text_color_vacant = ?,
                    text_color_occupied = ?,
                    text_color_cleaning = ?,
                    text_color_reserved = ?,
                    text_color_maintenance = ?,
                    text_color_reservation = ?,
                    border_color_vacant = ?,
                    border_color_occupied = ?,
                    border_color_cleaning = ?,
                    border_color_reserved = ?,
                    border_color_maintenance = ?,
                    border_color_reservation = ?,
                    occupied_warning_bg = ?,
                    occupied_warning_text = ?,
                    occupied_expired_bg = ?,
                    occupied_expired_text = ?,
                    dark_mode = ?,
                    updated_by_id = ?,
                    updated_date = NOW()
                WHERE hotelid = ?
            `, [
                showLeftCategoryVal,
                showRoomTextVal,
                room_box_size || 2,
                color_vacant || '#ffffff',
                color_occupied || '#DFF5E1',
                color_cleaning || '#FFF4CC',
                color_reserved || '#D9F1FF',
                color_maintenance || '#FFE0E0',
                color_reservation || '#D9F1FF',
                text_color_vacant || '#4B5563',
                text_color_occupied || '#16A34A',
                text_color_cleaning || '#D4A017',
                text_color_reserved || '#0284C7',
                text_color_maintenance || '#DC2626',
                text_color_reservation || '#0284C7',
                border_color_vacant || '#9CA3AF',
                border_color_occupied || '#4ADE80',
                border_color_cleaning || '#FACC15',
                border_color_reserved || '#38BDF8',
                border_color_maintenance || '#F87171',
                border_color_reservation || '#38BDF8',
                occupied_warning_bg || '#b96eff',
                occupied_warning_text || '#ffffff',
                occupied_expired_bg || '#E03F4F',
                occupied_expired_text || '#ffffff',
                darkModeVal,
                userId,
                hotelId
            ]);

            message = "Settings updated successfully";
        } else {
            // Create new settings
            await db.execute(`
                INSERT INTO hotel_ui_settings (
                    hotelid, show_left_category, show_room_text, room_box_size,
                    color_vacant, color_occupied, color_cleaning, color_reserved,
                    color_maintenance, color_reservation,
                    text_color_vacant, text_color_occupied, text_color_cleaning,
                    text_color_reserved, text_color_maintenance, text_color_reservation,
                    border_color_vacant, border_color_occupied, border_color_cleaning,
                    border_color_reserved, border_color_maintenance, border_color_reservation,
                    occupied_warning_bg, occupied_warning_text,
                    occupied_expired_bg, occupied_expired_text,
                    dark_mode, created_by_id, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                hotelId,
                showLeftCategoryVal,
                showRoomTextVal,
                room_box_size || 2,
                color_vacant || '#ffffff',
                color_occupied || '#DFF5E1',
                color_cleaning || '#FFF4CC',
                color_reserved || '#D9F1FF',
                color_maintenance || '#FFE0E0',
                color_reservation || '#D9F1FF',
                text_color_vacant || '#4B5563',
                text_color_occupied || '#16A34A',
                text_color_cleaning || '#D4A017',
                text_color_reserved || '#0284C7',
                text_color_maintenance || '#DC2626',
                text_color_reservation || '#0284C7',
                border_color_vacant || '#9CA3AF',
                border_color_occupied || '#4ADE80',
                border_color_cleaning || '#FACC15',
                border_color_reserved || '#38BDF8',
                border_color_maintenance || '#F87171',
                border_color_reservation || '#38BDF8',
                occupied_warning_bg || '#b96eff',
                occupied_warning_text || '#ffffff',
                occupied_expired_bg || '#E03F4F',
                occupied_expired_text || '#ffffff',
                darkModeVal,
                userId
            ]);

            message = "Settings created successfully";
        }

        // Fetch the saved settings to return
        const [savedSettings] = await db.execute(
            'SELECT * FROM hotel_ui_settings WHERE hotelid = ?',
            [hotelId]
        );

        const setting = savedSettings[0];
        
        const responseData = {
            hotel_id: setting.hotelid,
            show_left_category: setting.show_left_category === 1,
            show_room_text: setting.show_room_text === 1,
            room_box_size: setting.room_box_size,
            color_vacant: setting.color_vacant,
            color_occupied: setting.color_occupied,
            color_cleaning: setting.color_cleaning,
            color_reserved: setting.color_reserved,
            color_maintenance: setting.color_maintenance,
            color_reservation: setting.color_reservation,
            text_color_vacant: setting.text_color_vacant,
            text_color_occupied: setting.text_color_occupied,
            text_color_cleaning: setting.text_color_cleaning,
            text_color_reserved: setting.text_color_reserved,
            text_color_maintenance: setting.text_color_maintenance,
            text_color_reservation: setting.text_color_reservation,
            border_color_vacant: setting.border_color_vacant,
            border_color_occupied: setting.border_color_occupied,
            border_color_cleaning: setting.border_color_cleaning,
            border_color_reserved: setting.border_color_reserved,
            border_color_maintenance: setting.border_color_maintenance,
            border_color_reservation: setting.border_color_reservation,
            occupied_warning_bg: setting.occupied_warning_bg,
            occupied_warning_text: setting.occupied_warning_text,
            occupied_expired_bg: setting.occupied_expired_bg,
            occupied_expired_text: setting.occupied_expired_text,
            dark_mode: setting.dark_mode === 1,
            created_date: formatDate(setting.created_date),
            updated_date: formatDate(setting.updated_date)
        };

        res.status(200).json({
            success: true,
            message: message,
            data: responseData
        });
    } catch (error) {
        console.error("Error saving UI settings:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to save settings", 
            error: error.message 
        });
    }
};

// Reset UI settings to defaults for a hotel
exports.resetUiSettings = async (req, res) => {
    try {
        let hotelId = req.body.hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            return res.status(400).json({ 
                success: false, 
                message: "Hotel ID not found" 
            });
        }

        const defaultSettings = {
            show_left_category: 1,
            show_room_text: 1,
            room_box_size: 2,
            color_vacant: '#ffffff',
            color_occupied: '#DFF5E1',
            color_cleaning: '#FFF4CC',
            color_reserved: '#D9F1FF',
            color_maintenance: '#FFE0E0',
            color_reservation: '#D9F1FF',
            text_color_vacant: '#4B5563',
            text_color_occupied: '#16A34A',
            text_color_cleaning: '#D4A017',
            text_color_reserved: '#0284C7',
            text_color_maintenance: '#DC2626',
            text_color_reservation: '#0284C7',
            border_color_vacant: '#9CA3AF',
            border_color_occupied: '#4ADE80',
            border_color_cleaning: '#FACC15',
            border_color_reserved: '#38BDF8',
            border_color_maintenance: '#F87171',
            border_color_reservation: '#38BDF8',
            occupied_warning_bg: '#b96eff',
            occupied_warning_text: '#ffffff',
            occupied_expired_bg: '#E03F4F',
            occupied_expired_text: '#ffffff',
            dark_mode: 0
        };

        const userId = getCurrentUserId(req);

        const [result] = await db.execute(`
            UPDATE hotel_ui_settings 
            SET show_left_category = ?,
                show_room_text = ?,
                room_box_size = ?,
                color_vacant = ?,
                color_occupied = ?,
                color_cleaning = ?,
                color_reserved = ?,
                color_maintenance = ?,
                color_reservation = ?,
                text_color_vacant = ?,
                text_color_occupied = ?,
                text_color_cleaning = ?,
                text_color_reserved = ?,
                text_color_maintenance = ?,
                text_color_reservation = ?,
                border_color_vacant = ?,
                border_color_occupied = ?,
                border_color_cleaning = ?,
                border_color_reserved = ?,
                border_color_maintenance = ?,
                border_color_reservation = ?,
                occupied_warning_bg = ?,
                occupied_warning_text = ?,
                occupied_expired_bg = ?,
                occupied_expired_text = ?,
                dark_mode = ?,
                updated_by_id = ?,
                updated_date = NOW()
            WHERE hotelid = ?
        `, [
            defaultSettings.show_left_category,
            defaultSettings.show_room_text,
            defaultSettings.room_box_size,
            defaultSettings.color_vacant,
            defaultSettings.color_occupied,
            defaultSettings.color_cleaning,
            defaultSettings.color_reserved,
            defaultSettings.color_maintenance,
            defaultSettings.color_reservation,
            defaultSettings.text_color_vacant,
            defaultSettings.text_color_occupied,
            defaultSettings.text_color_cleaning,
            defaultSettings.text_color_reserved,
            defaultSettings.text_color_maintenance,
            defaultSettings.text_color_reservation,
            defaultSettings.border_color_vacant,
            defaultSettings.border_color_occupied,
            defaultSettings.border_color_cleaning,
            defaultSettings.border_color_reserved,
            defaultSettings.border_color_maintenance,
            defaultSettings.border_color_reservation,
            defaultSettings.occupied_warning_bg,
            defaultSettings.occupied_warning_text,
            defaultSettings.occupied_expired_bg,
            defaultSettings.occupied_expired_text,
            defaultSettings.dark_mode,
            userId,
            hotelId
        ]);

        if (result.affectedRows === 0) {
            // If no rows updated, create new settings
            await db.execute(`
                INSERT INTO hotel_ui_settings (
                    hotelid, show_left_category, show_room_text, room_box_size,
                    color_vacant, color_occupied, color_cleaning, color_reserved,
                    color_maintenance, color_reservation,
                    text_color_vacant, text_color_occupied, text_color_cleaning,
                    text_color_reserved, text_color_maintenance, text_color_reservation,
                    border_color_vacant, border_color_occupied, border_color_cleaning,
                    border_color_reserved, border_color_maintenance, border_color_reservation,
                    occupied_warning_bg, occupied_warning_text,
                    occupied_expired_bg, occupied_expired_text,
                    dark_mode, created_by_id, created_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                hotelId,
                defaultSettings.show_left_category,
                defaultSettings.show_room_text,
                defaultSettings.room_box_size,
                defaultSettings.color_vacant,
                defaultSettings.color_occupied,
                defaultSettings.color_cleaning,
                defaultSettings.color_reserved,
                defaultSettings.color_maintenance,
                defaultSettings.color_reservation,
                defaultSettings.text_color_vacant,
                defaultSettings.text_color_occupied,
                defaultSettings.text_color_cleaning,
                defaultSettings.text_color_reserved,
                defaultSettings.text_color_maintenance,
                defaultSettings.text_color_reservation,
                defaultSettings.border_color_vacant,
                defaultSettings.border_color_occupied,
                defaultSettings.border_color_cleaning,
                defaultSettings.border_color_reserved,
                defaultSettings.border_color_maintenance,
                defaultSettings.border_color_reservation,
                defaultSettings.occupied_warning_bg,
                defaultSettings.occupied_warning_text,
                defaultSettings.occupied_expired_bg,
                defaultSettings.occupied_expired_text,
                defaultSettings.dark_mode,
                userId
            ]);
        }

        // Fetch the reset settings
        const [resetSettings] = await db.execute(
            'SELECT * FROM hotel_ui_settings WHERE hotelid = ?',
            [hotelId]
        );

        const setting = resetSettings[0];
        
        const responseData = {
            hotel_id: setting.hotelid,
            show_left_category: setting.show_left_category === 1,
            show_room_text: setting.show_room_text === 1,
            room_box_size: setting.room_box_size,
            color_vacant: setting.color_vacant,
            color_occupied: setting.color_occupied,
            color_cleaning: setting.color_cleaning,
            color_reserved: setting.color_reserved,
            color_maintenance: setting.color_maintenance,
            color_reservation: setting.color_reservation,
            text_color_vacant: setting.text_color_vacant,
            text_color_occupied: setting.text_color_occupied,
            text_color_cleaning: setting.text_color_cleaning,
            text_color_reserved: setting.text_color_reserved,
            text_color_maintenance: setting.text_color_maintenance,
            text_color_reservation: setting.text_color_reservation,
            border_color_vacant: setting.border_color_vacant,
            border_color_occupied: setting.border_color_occupied,
            border_color_cleaning: setting.border_color_cleaning,
            border_color_reserved: setting.border_color_reserved,
            border_color_maintenance: setting.border_color_maintenance,
            border_color_reservation: setting.border_color_reservation,
            occupied_warning_bg: setting.occupied_warning_bg,
            occupied_warning_text: setting.occupied_warning_text,
            occupied_expired_bg: setting.occupied_expired_bg,
            occupied_expired_text: setting.occupied_expired_text,
            dark_mode: setting.dark_mode === 1,
            created_date: formatDate(setting.created_date),
            updated_date: formatDate(setting.updated_date)
        };

        res.json({
            success: true,
            message: "Settings reset to defaults successfully",
            data: responseData
        });
    } catch (error) {
        console.error("Error resetting UI settings:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to reset settings", 
            error: error.message 
        });
    }
};