const db = require('../../../config/db');
const path = require('path');
const fs = require('fs');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Helper function to format date for MySQL DATE column (YYYY-MM-DD)
const formatDateOnly = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }
    const dateStr = String(dateValue);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

// Helper function to format datetime for MySQL DATETIME column
const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 19).replace('T', ' ');
    }
    const dateStr = String(dateValue);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper to get full URL for file
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

// ---------- Helper for Foreign Key Validation ----------
const validateForeignKeys = async (connection, { city_id, state_id, country_id, nationality_id, company_id, fragment_id, purpose_id, arrived_id, departure_id, guest_type_id, hotelid }) => {
    const validated = { city_id, state_id, country_id, nationality_id, company_id, fragment_id, purpose_id, arrived_id, departure_id, guest_type_id, hotelid };

    if (hotelid) {
        const [hotel] = await connection.execute(
            'SELECT hotelid FROM msthotelmasters WHERE hotelid = ?',
            [hotelid]
        );
        if (!hotel || hotel.length === 0) validated.hotelid = null;
    }

    if (purpose_id) {
        const [purpose] = await connection.execute(
            'SELECT purpose_id FROM purpose_master WHERE purpose_id = ? AND status = 1',
            [purpose_id]
        );
        if (!purpose || purpose.length === 0) validated.purpose_id = null;
    }

    if (arrived_id) {
        const [arrived] = await connection.execute(
            'SELECT arrived_id FROM arrived_master WHERE arrived_id = ? AND status = 1',
            [arrived_id]
        );
        if (!arrived || arrived.length === 0) validated.arrived_id = null;
    }

    if (departure_id) {
        const [departure] = await connection.execute(
            'SELECT departure_id FROM departure_master WHERE departure_id = ? AND status = 1',
            [departure_id]
        );
        if (!departure || departure.length === 0) validated.departure_id = null;
    }

    if (guest_type_id) {
        const [guestType] = await connection.execute(
            'SELECT guest_type_id FROM guest_type_master WHERE guest_type_id = ? AND status = 1',
            [guest_type_id]
        );
        if (!guestType || guestType.length === 0) validated.guest_type_id = null;
    }
    if (city_id) {
        const [city] = await connection.execute(
            'SELECT cityid FROM mstcitymaster WHERE cityid = ?',
            [city_id]
        );
        if (!city || city.length === 0) validated.city_id = null;
    }
    if (state_id) {
        const [state] = await connection.execute(
            'SELECT stateid FROM mststatemaster WHERE stateid = ?',
            [state_id]
        );
        if (!state || state.length === 0) validated.state_id = null;
    }
    if (country_id) {
        const [country] = await connection.execute(
            'SELECT countryid FROM mstcountrymaster WHERE countryid = ?',
            [country_id]
        );
        if (!country || country.length === 0) validated.country_id = null;
    }
    if (nationality_id) {
        const [nat] = await connection.execute(
            'SELECT nationality_id FROM nationalitymaster WHERE nationality_id = ?',
            [nationality_id]
        );
        if (!nat || nat.length === 0) validated.nationality_id = null;
    }
    if (company_id) {
        const [comp] = await connection.execute(
            'SELECT company_id FROM company_master WHERE company_id = ?',
            [company_id]
        );
        if (!comp || comp.length === 0) validated.company_id = null;
    }
    if (fragment_id) {
        const [frag] = await connection.execute(
            'SELECT fragment_id FROM fragmentmaster WHERE fragment_id = ?',
            [fragment_id]
        );
        if (!frag || frag.length === 0) validated.fragment_id = null;
    }

    return validated;
};

// Helper to get or create reference ID from name
const getOrCreateReferenceId = async (connection, tableName, idField, nameField, nameValue, additionalWhere = '') => {
    if (!nameValue) return null;
    
    const [existing] = await connection.execute(
        `SELECT ${idField} FROM ${tableName} WHERE ${nameField} = ? ${additionalWhere}`,
        [nameValue]
    );
    
    if (existing && existing.length > 0) {
        return existing[0][idField];
    }
    
    const [result] = await connection.execute(
        `INSERT INTO ${tableName} (${nameField}, status, created_date) VALUES (?, 1, NOW())`,
        [nameValue]
    );
    
    return result.insertId;
};

// Helper to get ID from name (without creating)
const getReferenceIdFromName = async (connection, tableName, idField, nameField, nameValue, additionalWhere = '') => {
    if (!nameValue) return null;
    
    const [existing] = await connection.execute(
        `SELECT ${idField} FROM ${tableName} WHERE ${nameField} = ? ${additionalWhere}`,
        [nameValue]
    );
    
    return existing && existing.length > 0 ? existing[0][idField] : null;
};

// ---------- Guest CRUD ----------
exports.getGuest = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [guests] = await db.execute(`
            SELECT 
                g.*,
                f.name AS fragment_name,
                ct.city_name,
                s.state_name,
                co.country_name,
                n.nationality,
                comp.company_name,
                gt.guest_type_name,
                p.purpose_name,
                a.arrived_name,
                d.departure_name
            FROM guest_master g
            LEFT JOIN fragmentmaster f ON f.fragment_id = g.fragment_id
            LEFT JOIN mstcitymaster ct ON ct.cityid = g.city_id
            LEFT JOIN mststatemaster s ON s.stateid = g.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = g.country_id
            LEFT JOIN nationalitymaster n ON n.nationality_id = g.nationality_id
            LEFT JOIN company_master comp ON comp.company_id = g.company_id
            LEFT JOIN guest_type_master gt ON gt.guest_type_id = g.guest_type_id
            LEFT JOIN purpose_master p ON p.purpose_id = g.purpose_id
            LEFT JOIN arrived_master a ON a.arrived_id = g.arrived_id
            LEFT JOIN departure_master d ON d.departure_id = g.departure_id
            WHERE g.guest_id = ?
        `, [id]);

        if (!guests || guests.length === 0) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        const guest = guests[0];
        const [documents] = await db.execute(
            'SELECT * FROM guest_document WHERE guest_id = ?',
            [id]
        );
        
        guest.documents = documents.map(doc => ({
            ...doc,
            front_side_url: doc.front_side ? getFileUrl(req, doc.front_side) : null,
            back_side_url: doc.back_side ? getFileUrl(req, doc.back_side) : null,
            guest_photo_url: doc.guest_photo ? getFileUrl(req, doc.guest_photo) : null
        }));

        res.json({ success: true, data: guest });
    } catch (error) {
        console.error('Error in getGuest:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.getGuests = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const [guests] = await db.execute(`
            SELECT 
                g.*,
                f.name AS fragment_name,
                ct.city_name,
                s.state_name,
                co.country_name,
                n.nationality,
                comp.company_name,
                gt.guest_type_name,
                p.purpose_name,
                a.arrived_name,
                d.departure_name
            FROM guest_master g
            LEFT JOIN fragmentmaster f ON f.fragment_id = g.fragment_id
            LEFT JOIN mstcitymaster ct ON ct.cityid = g.city_id
            LEFT JOIN mststatemaster s ON s.stateid = g.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = g.country_id
            LEFT JOIN nationalitymaster n ON n.nationality_id = g.nationality_id
            LEFT JOIN company_master comp ON comp.company_id = g.company_id
            LEFT JOIN guest_type_master gt ON gt.guest_type_id = g.guest_type_id
            LEFT JOIN purpose_master p ON p.purpose_id = g.purpose_id
            LEFT JOIN arrived_master a ON a.arrived_id = g.arrived_id
            LEFT JOIN departure_master d ON d.departure_id = g.departure_id
            WHERE g.hotelid = ?
            ORDER BY g.name ASC
        `, [hotelId]);

        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error in getGuests:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.addGuest = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            fragment_id, name, organisation, address, city_id, state_id, country_id,
            occupation, post_held, phone, mobile, email, website,
            purpose_id, arrived_id, departure_id, purpose, arrived_from, departure_to,
            birthday, anniversary, gender,
            nationality_id, guest_type_id, guest_type, credit_allowed, company_id, discount_percent,
            hotelid, created_by_id, status
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const created_at = formatDateTime(new Date());

        if (!hotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }
        
        if (!name || !phone) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }

        const formattedBirthday = formatDateOnly(birthday);
        const formattedAnniversary = formatDateOnly(anniversary);

        let finalPurposeId = purpose_id || null;
        if (purpose && purpose.trim()) {
            finalPurposeId = await getOrCreateReferenceId(connection, 'purpose_master', 'purpose_id', 'purpose_name', purpose.trim().toUpperCase());
        }

        let finalArrivedId = arrived_id || null;
        if (arrived_from && arrived_from.trim()) {
            finalArrivedId = await getOrCreateReferenceId(connection, 'arrived_master', 'arrived_id', 'arrived_name', arrived_from.trim().toUpperCase());
        }

        let finalDepartureId = departure_id || null;
        if (departure_to && departure_to.trim()) {
            finalDepartureId = await getOrCreateReferenceId(connection, 'departure_master', 'departure_id', 'departure_name', departure_to.trim().toUpperCase());
        }

        let finalGuestTypeId = guest_type_id || null;
        if (guest_type && guest_type.trim()) {
            finalGuestTypeId = await getOrCreateReferenceId(connection, 'guest_type_master', 'guest_type_id', 'guest_type_name', guest_type.trim());
        }

        const validated = await validateForeignKeys(connection, {
            city_id, state_id, country_id, nationality_id, company_id, fragment_id, 
            purpose_id: finalPurposeId, arrived_id: finalArrivedId, departure_id: finalDepartureId, 
            guest_type_id: finalGuestTypeId, hotelid: hotelId
        });
        
        const {
            city_id: vCity, state_id: vState, country_id: vCountry,
            nationality_id: vNat, company_id: vComp, fragment_id: vFrag,
            purpose_id: vPurpose, arrived_id: vArrived, departure_id: vDeparture, 
            guest_type_id: vGuestType, hotelid: vHotel
        } = validated;

        if (!vHotel) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid Hotel ID' });
        }

        const finalPurposeName = purpose ? purpose.trim().toUpperCase() : null;
        const finalArrivedName = arrived_from ? arrived_from.trim().toUpperCase() : null;
        const finalDepartureName = departure_to ? departure_to.trim().toUpperCase() : null;
        const finalGuestTypeName = guest_type ? guest_type.trim() : null;

        const [result] = await connection.execute(`
            INSERT INTO guest_master (
                fragment_id, name, organisation, address, city_id, state_id, country_id,
                occupation, post_held, phone, mobile, email, website,
                purpose_id, purpose, arrived_id, arrived_from, departure_id, departure_to, guest_type_id, guest_type,
                birthday, anniversary, gender,
                nationality_id, credit_allowed, company_id, discount_percent,
                hotelid, created_by_id, created_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            vFrag, name, organisation || null, address || null,
            vCity, vState, vCountry,
            occupation || null, post_held || null, phone || null, mobile,
            email || null, website || null,
            vPurpose, finalPurposeName, vArrived, finalArrivedName, vDeparture, finalDepartureName, vGuestType, finalGuestTypeName,
            formattedBirthday, formattedAnniversary,
            gender || 'Male',
            vNat, credit_allowed ? 1 : 0, vComp,
            discount_percent !== undefined ? discount_percent : 0,
            vHotel, created_by_id || userId, created_at,
            status !== undefined ? status : 1
        ]);

        await connection.commit();

        const [newGuest] = await connection.execute(`
            SELECT 
                g.*,
                f.name AS fragment_name,
                ct.city_name,
                s.state_name,
                co.country_name,
                n.nationality,
                comp.company_name,
                gt.guest_type_name,
                p.purpose_name,
                a.arrived_name,
                d.departure_name
            FROM guest_master g
            LEFT JOIN fragmentmaster f ON f.fragment_id = g.fragment_id
            LEFT JOIN mstcitymaster ct ON ct.cityid = g.city_id
            LEFT JOIN mststatemaster s ON s.stateid = g.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = g.country_id
            LEFT JOIN nationalitymaster n ON n.nationality_id = g.nationality_id
            LEFT JOIN company_master comp ON comp.company_id = g.company_id
            LEFT JOIN guest_type_master gt ON gt.guest_type_id = g.guest_type_id
            LEFT JOIN purpose_master p ON p.purpose_id = g.purpose_id
            LEFT JOIN arrived_master a ON a.arrived_id = g.arrived_id
            LEFT JOIN departure_master d ON d.departure_id = g.departure_id
            WHERE g.guest_id = ?
        `, [result.insertId]);

        res.status(201).json({ success: true, data: newGuest[0] });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding guest:', error);
        res.status(500).json({ success: false, message: 'Failed to add guest', error: error.message });
    } finally {
        connection.release();
    }
};

exports.updateGuest = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            fragment_id, name, organisation, address, city_id, state_id, country_id,
            occupation, post_held, phone, mobile, email, website,
            purpose_id, arrived_id, departure_id, purpose, arrived_from, departure_to,
            birthday, anniversary, gender,
            nationality_id, guest_type_id, guest_type, credit_allowed, company_id, discount_percent,
            hotelid, updated_by_id, status
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const updated_at = formatDateTime(new Date());

        const formattedBirthday = birthday !== undefined ? formatDateOnly(birthday) : undefined;
        const formattedAnniversary = anniversary !== undefined ? formatDateOnly(anniversary) : undefined;

        const [existing] = await connection.execute(
            'SELECT * FROM guest_master WHERE guest_id = ?',
            [id]
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        if (!hotelId) hotelId = existing[0].hotelid;
        if (existing[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        let finalPurposeId = purpose_id;
        let finalPurposeName = purpose;
        if (purpose !== undefined) {
            if (purpose && purpose.trim()) {
                finalPurposeId = await getOrCreateReferenceId(connection, 'purpose_master', 'purpose_id', 'purpose_name', purpose.trim().toUpperCase());
                finalPurposeName = purpose.trim().toUpperCase();
            } else {
                finalPurposeId = null;
                finalPurposeName = null;
            }
        }

        let finalArrivedId = arrived_id;
        let finalArrivedName = arrived_from;
        if (arrived_from !== undefined) {
            if (arrived_from && arrived_from.trim()) {
                finalArrivedId = await getOrCreateReferenceId(connection, 'arrived_master', 'arrived_id', 'arrived_name', arrived_from.trim().toUpperCase());
                finalArrivedName = arrived_from.trim().toUpperCase();
            } else {
                finalArrivedId = null;
                finalArrivedName = null;
            }
        }

        let finalDepartureId = departure_id;
        let finalDepartureName = departure_to;
        if (departure_to !== undefined) {
            if (departure_to && departure_to.trim()) {
                finalDepartureId = await getOrCreateReferenceId(connection, 'departure_master', 'departure_id', 'departure_name', departure_to.trim().toUpperCase());
                finalDepartureName = departure_to.trim().toUpperCase();
            } else {
                finalDepartureId = null;
                finalDepartureName = null;
            }
        }

        let finalGuestTypeId = guest_type_id;
        let finalGuestTypeName = guest_type;
        if (guest_type !== undefined) {
            if (guest_type && guest_type.trim()) {
                finalGuestTypeId = await getOrCreateReferenceId(connection, 'guest_type_master', 'guest_type_id', 'guest_type_name', guest_type.trim());
                finalGuestTypeName = guest_type.trim();
            } else {
                finalGuestTypeId = null;
                finalGuestTypeName = null;
            }
        }

        const validated = await validateForeignKeys(connection, {
            city_id, state_id, country_id, nationality_id, company_id, fragment_id, 
            purpose_id: finalPurposeId, arrived_id: finalArrivedId, departure_id: finalDepartureId, 
            guest_type_id: finalGuestTypeId, hotelid: hotelId
        });
        
        const {
            city_id: vCity, state_id: vState, country_id: vCountry,
            nationality_id: vNat, company_id: vComp, fragment_id: vFrag,
            purpose_id: vPurpose, arrived_id: vArrived, departure_id: vDeparture,
            guest_type_id: vGuestType, hotelid: vHotel
        } = validated;

        const updates = [];
        const values = [];

        if (fragment_id !== undefined) { updates.push('fragment_id = ?'); values.push(vFrag); }
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (organisation !== undefined) { updates.push('organisation = ?'); values.push(organisation || null); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address || null); }
        if (city_id !== undefined) { updates.push('city_id = ?'); values.push(vCity); }
        if (state_id !== undefined) { updates.push('state_id = ?'); values.push(vState); }
        if (country_id !== undefined) { updates.push('country_id = ?'); values.push(vCountry); }
        if (occupation !== undefined) { updates.push('occupation = ?'); values.push(occupation || null); }
        if (post_held !== undefined) { updates.push('post_held = ?'); values.push(post_held || null); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
        if (mobile !== undefined) { updates.push('mobile = ?'); values.push(mobile); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
        if (website !== undefined) { updates.push('website = ?'); values.push(website || null); }
        if (purpose !== undefined || purpose_id !== undefined) { 
            updates.push('purpose_id = ?'); values.push(vPurpose);
            updates.push('purpose = ?'); values.push(finalPurposeName);
        }
        if (arrived_from !== undefined || arrived_id !== undefined) { 
            updates.push('arrived_id = ?'); values.push(vArrived);
            updates.push('arrived_from = ?'); values.push(finalArrivedName);
        }
        if (departure_to !== undefined || departure_id !== undefined) { 
            updates.push('departure_id = ?'); values.push(vDeparture);
            updates.push('departure_to = ?'); values.push(finalDepartureName);
        }
        if (birthday !== undefined) { updates.push('birthday = ?'); values.push(formattedBirthday); }
        if (anniversary !== undefined) { updates.push('anniversary = ?'); values.push(formattedAnniversary); }
        if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
        if (nationality_id !== undefined) { updates.push('nationality_id = ?'); values.push(vNat); }
        if (guest_type !== undefined || guest_type_id !== undefined) { 
            updates.push('guest_type_id = ?'); values.push(vGuestType);
            updates.push('guest_type = ?'); values.push(finalGuestTypeName);
        }
        if (credit_allowed !== undefined) { updates.push('credit_allowed = ?'); values.push(credit_allowed ? 1 : 0); }
        if (company_id !== undefined) { updates.push('company_id = ?'); values.push(vComp); }
        if (discount_percent !== undefined) { updates.push('discount_percent = ?'); values.push(discount_percent); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (vHotel !== undefined) { updates.push('hotelid = ?'); values.push(vHotel); }

        updates.push('updated_at = ?');
        values.push(updated_at);
        updates.push('updated_by_id = ?');
        values.push(updated_by_id || userId);

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const updateSql = `UPDATE guest_master SET ${updates.join(', ')} WHERE guest_id = ?`;
        await connection.execute(updateSql, values);

        await connection.commit();

        const [updated] = await connection.execute(`
            SELECT 
                g.*,
                f.name AS fragment_name,
                ct.city_name,
                s.state_name,
                co.country_name,
                n.nationality,
                comp.company_name,
                gt.guest_type_name,
                p.purpose_name,
                a.arrived_name,
                d.departure_name
            FROM guest_master g
            LEFT JOIN fragmentmaster f ON f.fragment_id = g.fragment_id
            LEFT JOIN mstcitymaster ct ON ct.cityid = g.city_id
            LEFT JOIN mststatemaster s ON s.stateid = g.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = g.country_id
            LEFT JOIN nationalitymaster n ON n.nationality_id = g.nationality_id
            LEFT JOIN company_master comp ON comp.company_id = g.company_id
            LEFT JOIN guest_type_master gt ON gt.guest_type_id = g.guest_type_id
            LEFT JOIN purpose_master p ON p.purpose_id = g.purpose_id
            LEFT JOIN arrived_master a ON a.arrived_id = g.arrived_id
            LEFT JOIN departure_master d ON d.departure_id = g.departure_id
            WHERE g.guest_id = ?
        `, [id]);

        res.json({ success: true, data: updated[0] });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating guest:', error);
        res.status(500).json({ success: false, message: 'Failed to update guest', error: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteGuest = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { hotelid } = req.body;
        let hotelId = hotelid || getCurrentUserHotelId(req);

        const [guest] = await connection.execute(
            'SELECT hotelid FROM guest_master WHERE guest_id = ?',
            [id]
        );
        
        if (!guest || guest.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        if (!hotelId) hotelId = guest[0].hotelid;
        if (guest[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const [documents] = await connection.execute(
            'SELECT front_side, back_side, guest_photo FROM guest_document WHERE guest_id = ?',
            [id]
        );
        
        for (const doc of documents) {
            if (doc.front_side) deleteFile(doc.front_side);
            if (doc.back_side) deleteFile(doc.back_side);
            if (doc.guest_photo) deleteFile(doc.guest_photo);
        }
        
        await connection.execute('DELETE FROM guest_document WHERE guest_id = ?', [id]);
        await connection.execute('DELETE FROM guest_master WHERE guest_id = ?', [id]);
        
        await connection.commit();
        res.json({ success: true, message: 'Guest deleted', data: { guest_id: parseInt(id) } });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting guest:', error);
        res.status(500).json({ success: false, message: 'Failed to delete guest', error: error.message });
    } finally {
        connection.release();
    }
};

// ---------- Guest Document CRUD with Multer ----------
exports.getDocuments = async (req, res) => {
    try {
        const { guestId } = req.params;
        const [documents] = await db.execute(`
            SELECT * FROM guest_document
            WHERE guest_id = ?
            ORDER BY document_id DESC
        `, [guestId]);
        
        const docsWithUrls = documents.map(doc => ({
            ...doc,
            front_side_url: doc.front_side ? getFileUrl(req, doc.front_side) : null,
            back_side_url: doc.back_side ? getFileUrl(req, doc.back_side) : null,
            guest_photo_url: doc.guest_photo ? getFileUrl(req, doc.guest_photo) : null,
            front_side: doc.front_side,
            back_side: doc.back_side,
            guest_photo: doc.guest_photo
        }));
        
        res.json({ success: true, data: docsWithUrls });
    } catch (error) {
        console.error('Error in getDocuments:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const { guestId, id } = req.params;
        const [doc] = await db.execute(
            'SELECT * FROM guest_document WHERE document_id = ? AND guest_id = ?',
            [id, guestId]
        );
        
        if (!doc || doc.length === 0) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        const docWithUrls = {
            ...doc[0],
            front_side_url: doc[0].front_side ? getFileUrl(req, doc[0].front_side) : null,
            back_side_url: doc[0].back_side ? getFileUrl(req, doc[0].back_side) : null,
            guest_photo_url: doc[0].guest_photo ? getFileUrl(req, doc[0].guest_photo) : null
        };
        
        res.json({ success: true, data: docWithUrls });
    } catch (error) {
        console.error('Error in getDocument:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.addDocument = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guestId } = req.params;
        const { document_type, document_no } = req.body;
        
        const frontFile = req.files?.front_side?.[0];
        const backFile = req.files?.back_side?.[0];
        
        const frontPath = frontFile ? frontFile.path.replace(/\\/g, '/') : null;
        const backPath = backFile ? backFile.path.replace(/\\/g, '/') : null;

        const [guest] = await connection.execute(
            'SELECT guest_id FROM guest_master WHERE guest_id = ?',
            [guestId]
        );
        
        if (!guest || guest.length === 0) {
            if (frontPath) deleteFile(frontPath);
            if (backPath) deleteFile(backPath);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        if (!document_type || !document_no) {
            if (frontPath) deleteFile(frontPath);
            if (backPath) deleteFile(backPath);
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Document type and number are required' });
        }

        const [result] = await connection.execute(`
            INSERT INTO guest_document (guest_id, document_type, document_no, front_side, back_side, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [guestId, document_type, document_no, frontPath, backPath]);

        await connection.commit();

        const [newDoc] = await connection.execute(
            'SELECT * FROM guest_document WHERE document_id = ?',
            [result.insertId]
        );
        
        const newDocWithUrls = {
            ...newDoc[0],
            front_side_url: newDoc[0].front_side ? getFileUrl(req, newDoc[0].front_side) : null,
            back_side_url: newDoc[0].back_side ? getFileUrl(req, newDoc[0].back_side) : null,
            guest_photo_url: newDoc[0].guest_photo ? getFileUrl(req, newDoc[0].guest_photo) : null
        };
        
        res.status(201).json({ success: true, data: newDocWithUrls });
    } catch (error) {
        if (req.files) {
            if (req.files.front_side) deleteFile(req.files.front_side[0].path);
            if (req.files.back_side) deleteFile(req.files.back_side[0].path);
        }
        await connection.rollback();
        console.error('Error adding document:', error);
        res.status(500).json({ success: false, message: 'Failed to add document', error: error.message });
    } finally {
        connection.release();
    }
};

exports.updateDocument = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guestId, id } = req.params;
        const { document_type, document_no } = req.body;
        
        const [existing] = await connection.execute(
            'SELECT * FROM guest_document WHERE document_id = ? AND guest_id = ?',
            [id, guestId]
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        const frontFile = req.files?.front_side?.[0];
        const backFile = req.files?.back_side?.[0];
        
        let frontPath = existing[0].front_side;
        let backPath = existing[0].back_side;
        
        if (frontFile) {
            if (existing[0].front_side) deleteFile(existing[0].front_side);
            frontPath = frontFile.path.replace(/\\/g, '/');
        }
        
        if (backFile) {
            if (existing[0].back_side) deleteFile(existing[0].back_side);
            backPath = backFile.path.replace(/\\/g, '/');
        }

        const updates = [];
        const values = [];

        if (document_type !== undefined) { updates.push('document_type = ?'); values.push(document_type); }
        if (document_no !== undefined) { updates.push('document_no = ?'); values.push(document_no); }
        if (frontFile) { updates.push('front_side = ?'); values.push(frontPath); }
        if (backFile) { updates.push('back_side = ?'); values.push(backPath); }

        updates.push('updated_at = NOW()');

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id, guestId);
        const updateSql = `UPDATE guest_document SET ${updates.join(', ')} WHERE document_id = ? AND guest_id = ?`;
        await connection.execute(updateSql, values);

        await connection.commit();

        const [updated] = await connection.execute(
            'SELECT * FROM guest_document WHERE document_id = ?',
            [id]
        );
        
        const updatedWithUrls = {
            ...updated[0],
            front_side_url: updated[0].front_side ? getFileUrl(req, updated[0].front_side) : null,
            back_side_url: updated[0].back_side ? getFileUrl(req, updated[0].back_side) : null,
            guest_photo_url: updated[0].guest_photo ? getFileUrl(req, updated[0].guest_photo) : null
        };
        
        res.json({ success: true, data: updatedWithUrls });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, message: 'Failed to update document', error: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteDocument = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guestId, id } = req.params;

        const [existing] = await connection.execute(
            'SELECT * FROM guest_document WHERE document_id = ? AND guest_id = ?',
            [id, guestId]
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        if (existing[0].front_side) deleteFile(existing[0].front_side);
        if (existing[0].back_side) deleteFile(existing[0].back_side);
        if (existing[0].guest_photo) deleteFile(existing[0].guest_photo);
        
        await connection.execute('DELETE FROM guest_document WHERE document_id = ? AND guest_id = ?', [id, guestId]);
        
        await connection.commit();
        res.json({ success: true, message: 'Document deleted', data: { document_id: parseInt(id) } });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
    } finally {
        connection.release();
    }
};

// ---------- Guest Photo Upload ----------
exports.uploadGuestPhoto = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guestId } = req.params;
        const photoFile = req.file;
        
        if (!photoFile) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No photo file provided' });
        }

        const photoPath = photoFile.path.replace(/\\/g, '/');

        const [guest] = await connection.execute(
            'SELECT guest_id FROM guest_master WHERE guest_id = ?',
            [guestId]
        );
        
        if (!guest || guest.length === 0) {
            deleteFile(photoPath);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        // Check if a guest photo document already exists
        const [existingPhoto] = await connection.execute(
            'SELECT document_id, guest_photo FROM guest_document WHERE guest_id = ? AND document_type = ?',
            [guestId, 'Guest Photo']
        );
        
        let result;
        if (existingPhoto && existingPhoto.length > 0) {
            // Update existing photo
            if (existingPhoto[0].guest_photo) {
                deleteFile(existingPhoto[0].guest_photo);
            }
            await connection.execute(
                'UPDATE guest_document SET guest_photo = ?, updated_at = NOW() WHERE document_id = ?',
                [photoPath, existingPhoto[0].document_id]
            );
            result = { insertId: existingPhoto[0].document_id };
        } else {
            // Create new photo document
            const [insertResult] = await connection.execute(`
                INSERT INTO guest_document (guest_id, document_type, document_no, guest_photo, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [guestId, 'Guest Photo', new Date().toISOString().slice(0, 19).replace(/:/g, '-'), photoPath]);
            result = insertResult;
        }

        await connection.commit();

        const [newDoc] = await connection.execute(
            'SELECT * FROM guest_document WHERE document_id = ?',
            [result.insertId]
        );
        
        const docWithUrl = {
            ...newDoc[0],
            guest_photo_url: newDoc[0].guest_photo ? getFileUrl(req, newDoc[0].guest_photo) : null
        };
        
        res.status(200).json({ success: true, data: docWithUrl, message: existingPhoto ? 'Photo updated successfully' : 'Photo uploaded successfully' });
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        await connection.rollback();
        console.error('Error uploading guest photo:', error);
        res.status(500).json({ success: false, message: 'Failed to upload guest photo', error: error.message });
    } finally {
        connection.release();
    }
};

// Get guest photo
exports.getGuestPhoto = async (req, res) => {
    try {
        const { guestId } = req.params;
        
        const [documents] = await db.execute(
            'SELECT guest_photo FROM guest_document WHERE guest_id = ? AND document_type = ?',
            [guestId, 'Guest Photo']
        );
        
        if (!documents || documents.length === 0 || !documents[0].guest_photo) {
            return res.status(404).json({ success: false, message: 'Photo not found' });
        }
        
        res.json({ 
            success: true, 
            data: { 
                guest_photo: documents[0].guest_photo,
                guest_photo_url: getFileUrl(req, documents[0].guest_photo)
            } 
        });
    } catch (error) {
        console.error('Error getting guest photo:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// Delete guest photo
exports.deleteGuestPhoto = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guestId } = req.params;

        const [existing] = await connection.execute(
            'SELECT document_id, guest_photo FROM guest_document WHERE guest_id = ? AND document_type = ?',
            [guestId, 'Guest Photo']
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Photo not found' });
        }
        
        if (existing[0].guest_photo) {
            deleteFile(existing[0].guest_photo);
        }
        
        await connection.execute(
            'DELETE FROM guest_document WHERE document_id = ?',
            [existing[0].document_id]
        );
        
        await connection.commit();
        res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting guest photo:', error);
        res.status(500).json({ success: false, message: 'Failed to delete photo', error: error.message });
    } finally {
        connection.release();
    }
};