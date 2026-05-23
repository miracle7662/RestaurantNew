const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');
const upload = require('../config/multer');
const path = require('path');   // <-- add this
const fs = require('fs');       // <-- add this


const deleteOldLogo = (logoPath) => {
  if (logoPath) {
    // Remove leading slash if present
    const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
    // Construct full filesystem path: project_root/public/uploads/brands/...
    const fullPath = path.join(__dirname, '../public', cleanPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted old logo: ${fullPath}`);
    } else {
      console.log(`Logo file not found: ${fullPath}`);
    }
  }
};

exports.getHotelMasters = async (req, res) => {
    try {
        const { role_level, hotelid } = req.query;
       
        let query = `
           SELECT 
            H.hotelid, H.hotel_name, H.marketid, H.short_name, H.phone, H.email, 
            H.fssai_no, H.trn_gstno, H.panno, H.website, H.address, H.stateid, H.cityid,
            H.hoteltypeid, H.Masteruserid, H.status, H.created_by_id, H.created_date, 
            H.updated_by_id, H.updated_date, H.Logo, M.market_name, C.city_name 
            FROM msthotelmasters H  
            LEFT JOIN mstmarkets M ON M.marketid = H.marketid 
            LEFT JOIN mstcitymaster C ON C.cityid = H.cityid
        `;
        let params = [];

        if (role_level === 'hotel_admin' && hotelid) {
            query += ' WHERE H.hotelid = ?';
            params.push(hotelid);
        }

        const [msthotelmasters] = await db.query(query, params);

        res.json({
            success: true,
            data: msthotelmasters
        });

    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hotels",
            error: error.message
        });
    }
};


exports.getHotelMastersById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
            H.hotelid, H.hotel_name, H.marketid, H.short_name, H.phone, H.email, 
            H.fssai_no, H.trn_gstno, H.panno, H.website, H.address, H.stateid, H.cityid,
            H.hoteltypeid, H.Masteruserid, H.status, H.created_by_id, H.created_date, 
            H.updated_by_id, H.updated_date, H.Logo, M.market_name, C.city_name 
            FROM msthotelmasters H 
            LEFT JOIN mstmarkets M ON M.marketid = H.marketid
            LEFT JOIN mstcitymaster C ON C.cityid = H.cityid
            LEFT JOIN mststatemaster S ON S.stateid = H.stateid
            WHERE H.hotelid = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        res.json(rows[0]);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch hotel",
            error: error.message
        });
    }
};


exports.addHotelMasters = async (req, res) => {
    try {
        // Handle logo file if uploaded
        let logoPath = null;
        if (req.file) {
            // Store relative path (e.g., "/uploads/brands/filename.jpg")
            logoPath = `/uploads/brands/${req.file.filename}`;
        }

        const body = req.body;
        console.log('addHotelMasters payload:', body);
        console.log('Uploaded file:', req.file);

        const {
            hotel_name, marketid, short_name, phone, email,
            fssai_no, trn_gstno, panno, website, address,
            stateid, cityid, hoteltypeid, status,
            created_by_id, created_date, Masteruserid
        } = body;

        // Status validation & default
       const safeStatus = status != null ? parseInt(status) || 0 : 0;

if (safeStatus !== 0 && safeStatus !== 1) {
    return res.status(400).json({
        error: 'Status must be 0 (Active) or 1 (Inactive)'
    });
}

const safeCreatedBy = Array.isArray(created_by_id)
    ? parseInt(created_by_id[0]) || 1
    : parseInt(created_by_id) || 1;

const safeCreatedDate = formatMySQLDate(created_date);

        const [result] = await db.query(`
            INSERT INTO msthotelmasters 
            (hotel_name, marketid, short_name, phone, email, fssai_no, trn_gstno, panno,
             website, address, stateid, cityid, hoteltypeid, status, created_by_id, created_date, Masteruserid, Logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            hotel_name, marketid, short_name, phone, email,
            fssai_no, trn_gstno, panno, website, address,
            stateid, cityid, hoteltypeid, safeStatus,
            safeCreatedBy, safeCreatedDate, Masteruserid,
            logoPath   // <-- added Logo column value
        ]);

        console.log('Brand created with status:', safeStatus, 'ID:', result.insertId);

        res.json({
            success: true,
            id: result.insertId,
            Logo: logoPath,
            ...body,
            status: safeStatus,
            created_by_id: safeCreatedBy,
            created_date: safeCreatedDate
        });

    } catch (error) {
        console.error('addHotelMasters error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to add hotel",
            error: error.message
        });
    }
};

exports.updateHotelMasters = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        console.log('updateHotelMasters payload:', body);
        console.log('Uploaded file:', req.file);

        // Handle new logo if uploaded
        let newLogoPath = null;
        if (req.file) {
            newLogoPath = `/uploads/brands/${req.file.filename}`;
            
            // Fetch old logo to delete later
            const [oldRows] = await db.query('SELECT Logo FROM msthotelmasters WHERE hotelid = ?', [id]);
            if (oldRows.length > 0 && oldRows[0].Logo) {
                deleteOldLogo(oldRows[0].Logo);
            }
        }

        const {
            hotel_name, marketid, short_name, phone, email,
            fssai_no, trn_gstno, panno, website, address,
            stateid, cityid, hoteltypeid, Masteruserid,
            status, updated_by_id, updated_date
        } = body;

        const safeStatus = status != null ? parseInt(status) || 0 : 0;
        if (safeStatus !== 0 && safeStatus !== 1) {
            return res.status(400).json({ error: 'Status must be 0 (Active) or 1 (Inactive)' });
        }

       const safeUpdatedBy = Array.isArray(updated_by_id)
    ? parseInt(updated_by_id[0]) || 1
    : parseInt(updated_by_id) || 1;

const safeUpdatedDate = formatMySQLDate(updated_date);
        // Build dynamic SQL – update Logo only if a new file was uploaded
        let query = `
            UPDATE msthotelmasters 
            SET hotel_name = ?, marketid = ?, short_name = ?, phone = ?, email = ?, 
                fssai_no = ?, trn_gstno = ?, panno = ?, website = ?, address = ?, 
                stateid = ?, cityid = ?, hoteltypeid = ?, Masteruserid = ?, 
                status = ?, updated_by_id = ?, updated_date = ?
        `;
        let params = [
            hotel_name, marketid, short_name, phone, email,
            fssai_no, trn_gstno, panno, website, address,
            stateid, cityid, hoteltypeid, Masteruserid,
            safeStatus, safeUpdatedBy, safeUpdatedDate
        ];

        if (newLogoPath) {
            query += `, Logo = ?`;
            params.push(newLogoPath);
        }

        query += ` WHERE hotelid = ?`;
        params.push(id);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        console.log('Brand updated with status:', safeStatus, 'ID:', id);

        res.json({
            success: true,
            id,
            Logo: newLogoPath,  // may be null if no new logo
            ...body,
            status: safeStatus,
            updated_by_id: safeUpdatedBy,
            updated_date: safeUpdatedDate
        });

    } catch (error) {
        console.error('updateHotelMasters error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update hotel",
            error: error.message
        });
    }
};


exports.deleteHotelMasters = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM msthotelmasters WHERE hotelid = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.json({ message: 'Deleted successfully' });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete hotel",
            error: error.message
        });
    }
};