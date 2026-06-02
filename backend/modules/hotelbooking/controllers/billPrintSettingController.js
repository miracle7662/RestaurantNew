// controllers/billPrintSettingController.js
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Get settings by hotel ID
exports.getByHotelId = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const userHotelId = getCurrentUserHotelId(req);
        const finalHotelId = hotelId || userHotelId;

        if (!finalHotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID is required' });
        }

        const [settings] = await db.execute(
            'SELECT * FROM bill_print_settings WHERE hotelid = ?',
            [finalHotelId]
        );

        if (settings.length === 0) {
            return res.json({
                success: true,
                message: 'No settings found, using defaults',
                data: getDefaultSettings(finalHotelId)
            });
        }

        res.json({
            success: true,
            message: 'Settings fetched successfully',
            data: settings[0]
        });
    } catch (error) {
        console.error('Error fetching bill print settings:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// Create new settings
exports.create = async (req, res) => {
    try {
        const { hotelid, ...settings } = req.body;
        const userId = getCurrentUserId(req);
        const hotelId = hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID is required' });
        }

        // Check if settings already exist
        const [existing] = await db.execute(
            'SELECT setting_id FROM bill_print_settings WHERE hotelid = ?',
            [hotelId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Settings already exist for this hotel. Use update instead.'
            });
        }

        // Build insert query with explicit column names
        const insertData = {
            hotelid: hotelId,
            created_by_id: userId,
            created_date: new Date(),
            show_top_header_section: 1,
            top_margin_when_header_hidden: 30,
            ...settings
        };

        const columns = Object.keys(insertData);
        const placeholders = columns.map(() => '?').join(',');
        const values = Object.values(insertData);

        const query = `INSERT INTO bill_print_settings (${columns.join(',')}) VALUES (${placeholders})`;
        
        const [result] = await db.execute(query, values);

        const [newSettings] = await db.execute(
            'SELECT * FROM bill_print_settings WHERE setting_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Bill print settings created successfully',
            data: newSettings[0]
        });
    } catch (error) {
        console.error('Error creating bill print settings:', error);
        res.status(500).json({ success: false, message: 'Failed to create settings', error: error.message });
    }
};

// Update settings by ID
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { hotelid, ...settings } = req.body;
        const userId = getCurrentUserId(req);

        // Build update query with explicit SET clauses
        const updateData = {
            ...settings,
            updated_by_id: userId,
            updated_date: new Date()
        };

        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(',');
        const values = [...Object.values(updateData), id];

        const query = `UPDATE bill_print_settings SET ${setClause} WHERE setting_id = ?`;
        
        const [result] = await db.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Settings not found' });
        }

        const [updatedSettings] = await db.execute(
            'SELECT * FROM bill_print_settings WHERE setting_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Bill print settings updated successfully',
            data: updatedSettings[0]
        });
    } catch (error) {
        console.error('Error updating bill print settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
    }
};

// Update settings by hotel ID (upsert)
exports.updateByHotelId = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const settings = req.body;
        const userId = getCurrentUserId(req);
        const finalHotelId = hotelId || getCurrentUserHotelId(req);

        if (!finalHotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID is required' });
        }

        // Remove id fields from settings if present
        const { setting_id, created_date, ...cleanSettings } = settings;

        // Check if settings exist
        const [existing] = await db.execute(
            'SELECT setting_id FROM bill_print_settings WHERE hotelid = ?',
            [finalHotelId]
        );

        let result;
        if (existing.length === 0) {
            // Create new - build explicit INSERT query
            const insertData = {
                hotelid: finalHotelId,
                created_by_id: userId,
                created_date: new Date(),
                show_top_header_section: 1,
                top_margin_when_header_hidden: 30,
                ...cleanSettings
            };
            
            const columns = Object.keys(insertData);
            const placeholders = columns.map(() => '?').join(',');
            const values = Object.values(insertData);
            
            const insertQuery = `INSERT INTO bill_print_settings (${columns.join(',')}) VALUES (${placeholders})`;
            [result] = await db.execute(insertQuery, values);
        } else {
            // Update existing - build explicit UPDATE query
            const updateData = {
                ...cleanSettings,
                updated_by_id: userId,
                updated_date: new Date()
            };
            
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(',');
            const values = [...Object.values(updateData), finalHotelId];
            
            const updateQuery = `UPDATE bill_print_settings SET ${setClause} WHERE hotelid = ?`;
            [result] = await db.execute(updateQuery, values);
        }

        const [updatedSettings] = await db.execute(
            'SELECT * FROM bill_print_settings WHERE hotelid = ?',
            [finalHotelId]
        );

        res.json({
            success: true,
            message: 'Bill print settings saved successfully',
            data: updatedSettings[0]
        });
    } catch (error) {
        console.error('Error saving bill print settings:', error);
        res.status(500).json({ success: false, message: 'Failed to save settings', error: error.message });
    }
};

// Get default settings
function getDefaultSettings(hotelId) {
    return {
        setting_id: null,
        hotelid: hotelId,
        show_top_header_section: 1,
        top_margin_when_header_hidden: 30,
        show_hotel_logo: 1,
        hotel_logo_position: 'left',
        show_hotel_name: 1,
        hotel_name_position: 'center',
        show_hotel_address: 1,
        hotel_address_position: 'left',
        show_hotel_contact: 1,
        hotel_contact_position: 'left',
        show_guest_details: 1,
        guest_details_position: 'left',
        show_guest_name: 1,
        show_guest_mobile: 1,
        show_guest_email: 1,
        show_guest_address: 1,
        show_guest_id_proof: 1,
        show_booking_details: 1,
        booking_details_position: 'right',
        show_checkin_date: 1,
        show_checkout_date: 1,
        show_nights: 1,
        show_room_type: 1,
        show_room_numbers: 1,
        show_guests_count: 1,
        show_tariff_plan: 1,
        show_bill_title: 1,
        bill_title_position: 'center',
        show_invoice_no: 1,
        show_invoice_date: 1,
        show_booking_id: 1,
        show_payment_status: 1,
        show_payment_mode: 1,
        table_font_size: 'normal',
        table_header_bg_color: '#1a2744',
        table_header_text_color: '#ffffff',
        show_row_numbers: 1,
        show_discount_column: 1,
        show_cgst_sgst_breakdown: 1,
        show_thankyou_message: 1,
        thankyou_message_text: 'Thank You!',
        show_footer_note: 1,
        footer_note_text: 'We look forward to welcoming you again.',
        show_gst_details: 1,
        show_company_pan: 1,
        show_fssai: 1,
        default_print_size: 'A4',
        paper_width_mm: 210,
        paper_height_mm: 297,
        margin_top_mm: 12,
        margin_bottom_mm: 12,
        margin_left_mm: 10,
        margin_right_mm: 10,
        custom_header_text: '',
        custom_footer_text: ''
    };
}

module.exports = exports;