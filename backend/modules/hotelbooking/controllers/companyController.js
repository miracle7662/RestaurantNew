const db = require('../../../config/db');

const getCurrentUserId = (req) => {
    return req.user?.id || null;
};

const getCurrentUserHotelId = (req) => {
    return req.user?.hotel_id || null;
};

const formatDateToMySQL = (dateValue) => {
    if (!dateValue) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    } catch {
        return null;
    }
};

const validateForeignKeys = async (connection, { state_id, city_id, country_id, hotelid }) => {
    const validated = { state_id, city_id, country_id, hotelid };
    
    if (hotelid) {
        const [hotel] = await connection.execute(
            'SELECT hotelid FROM msthotelmasters WHERE hotelid = ?',
            [hotelid]
        );
        if (!hotel || hotel.length === 0) {
            console.warn(`Invalid hotelid: ${hotelid}, throwing error`);
            throw new Error('Invalid Hotel ID');
        }
    }
    
    if (state_id) {
        const [state] = await connection.execute(
            'SELECT stateid FROM mststatemaster WHERE stateid = ?',
            [state_id]
        );
        if (!state || state.length === 0) {
            console.warn(`Invalid state_id: ${state_id}, setting to NULL`);
            validated.state_id = null;
        }
    }
    
    if (city_id) {
        const [city] = await connection.execute(
            'SELECT cityid FROM mstcitymaster WHERE cityid = ?',
            [city_id]
        );
        if (!city || city.length === 0) {
            console.warn(`Invalid city_id: ${city_id}, setting to NULL`);
            validated.city_id = null;
        }
    }
    
    if (country_id) {
        const [country] = await connection.execute(
            'SELECT countryid FROM mstcountrymaster WHERE countryid = ?',
            [country_id]
        );
        if (!country || country.length === 0) {
            console.warn(`Invalid country_id: ${country_id}, setting to NULL`);
            validated.country_id = null;
        }
    }
    
    return validated;
};

exports.getCompanies = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }
        if (!hotelId && req.body && req.body.hotelid) {
            hotelId = req.body.hotelid;
        }
        if (!hotelId) {
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const [companies] = await db.execute(`
            SELECT 
                c.*,
                ct.city_name,
                s.state_name,
                co.country_name
            FROM company_master c
            LEFT JOIN mstcitymaster ct ON ct.cityid = c.city_id
            LEFT JOIN mststatemaster s ON s.stateid = c.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = c.country_id
            WHERE c.hotelid = ?
            ORDER BY c.company_name ASC
        `, [hotelId]);

        res.json({
            success: true,
            message: "Data fetched successfully",
            data: companies
        });
    } catch (error) {
        console.error('Error in getCompanies:', error);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
};

exports.getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [companies] = await db.execute(`
            SELECT 
                c.*,
                ct.city_name,
                s.state_name,
                co.country_name
            FROM company_master c
            LEFT JOIN mstcitymaster ct ON ct.cityid = c.city_id
            LEFT JOIN mststatemaster s ON s.stateid = c.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = c.country_id
            WHERE c.company_id = ?
        `, [id]);

        if (!companies || companies.length === 0) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        res.json({
            success: true,
            message: "Data fetched successfully",
            data: companies[0]
        });
    } catch (error) {
        console.error('Error in getCompany:', error);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
};

exports.addCompany = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            company_name, establishment_date, address, state_id, city_id, country_id,
            mobile1, mobile2, gst_no, email, website,
            booking_contact_name, booking_contact_mobile, booking_contact_phone,
            corresponding_contact_name, corresponding_contact_mobile, corresponding_contact_phone,
            credit_limit, credit_allowed, company_info, have_discount, status,
            hotelid, created_by_id
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const formattedEstablishmentDate = formatDateToMySQL(establishment_date);

        if (!hotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Hotel ID not found" });
        }

        const validated = await validateForeignKeys(connection, { 
            state_id, 
            city_id, 
            country_id, 
            hotelid: hotelId 
        });
        
        const { state_id: validStateId, city_id: validCityId, country_id: validCountryId, hotelid: validHotelId } = validated;

        if (!validHotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Invalid Hotel ID" });
        }

        const [result] = await connection.execute(`
            INSERT INTO company_master (
                company_name, establishment_date, address, state_id, city_id, country_id,
                mobile1, mobile2, gst_no, email, website,
                booking_contact_name, booking_contact_mobile, booking_contact_phone,
                corresponding_contact_name, corresponding_contact_mobile, corresponding_contact_phone,
                credit_limit, credit_allowed, company_info, have_discount, status,
                hotelid, created_by_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            company_name,
            formattedEstablishmentDate,
            address || null,
            validStateId,
            validCityId,
            validCountryId,
            mobile1,
            mobile2 || null,
            gst_no || null,
            email || null,
            website || null,
            booking_contact_name || null,
            booking_contact_mobile || null,
            booking_contact_phone || null,
            corresponding_contact_name || null,
            corresponding_contact_mobile || null,
            corresponding_contact_phone || null,
            credit_limit || 0,
            credit_allowed !== undefined ? (credit_allowed ? 1 : 0) : 0,
            company_info || null,
            have_discount !== undefined ? (have_discount ? 1 : 0) : 0,
            status !== undefined ? status : 1,
            validHotelId,
            created_by_id || userId,
            created_at
        ]);

        await connection.commit();

        const [newCompany] = await connection.execute(`
            SELECT 
                c.*,
                ct.city_name,
                s.state_name,
                co.country_name
            FROM company_master c
            LEFT JOIN mstcitymaster ct ON ct.cityid = c.city_id
            LEFT JOIN mststatemaster s ON s.stateid = c.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = c.country_id
            WHERE c.company_id = ?
        `, [result.insertId]);

        res.status(200).json({
            success: true,
            message: "Company added successfully",
            data: newCompany[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding company:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add company", 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

exports.updateCompany = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            company_name, establishment_date, address, state_id, city_id, country_id,
            mobile1, mobile2, gst_no, email, website,
            booking_contact_name, booking_contact_mobile, booking_contact_phone,
            corresponding_contact_name, corresponding_contact_mobile, corresponding_contact_phone,
            credit_limit, credit_allowed, company_info, have_discount, status,
            hotelid, updated_by_id
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const formattedEstablishmentDate = formatDateToMySQL(establishment_date);

        const [existingCompany] = await connection.execute(
            'SELECT hotelid FROM company_master WHERE company_id = ?',
            [id]
        );
        
        if (!existingCompany || existingCompany.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        if (!hotelId) {
            hotelId = existingCompany[0].hotelid;
        }

        if (existingCompany[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const validated = await validateForeignKeys(connection, { 
            state_id, 
            city_id, 
            country_id, 
            hotelid: hotelId 
        });
        
        const { state_id: validStateId, city_id: validCityId, country_id: validCountryId, hotelid: validHotelId } = validated;

        const updateFields = [];
        const updateValues = [];

        if (company_name !== undefined) {
            updateFields.push('company_name = ?');
            updateValues.push(company_name);
        }
        if (establishment_date !== undefined) {
            updateFields.push('establishment_date = ?');
            updateValues.push(formattedEstablishmentDate);
        }
        if (address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(address || null);
        }
        if (state_id !== undefined) {
            updateFields.push('state_id = ?');
            updateValues.push(validStateId);
        }
        if (city_id !== undefined) {
            updateFields.push('city_id = ?');
            updateValues.push(validCityId);
        }
        if (country_id !== undefined) {
            updateFields.push('country_id = ?');
            updateValues.push(validCountryId);
        }
        if (mobile1 !== undefined) {
            updateFields.push('mobile1 = ?');
            updateValues.push(mobile1);
        }
        if (mobile2 !== undefined) {
            updateFields.push('mobile2 = ?');
            updateValues.push(mobile2 || null);
        }
        if (gst_no !== undefined) {
            updateFields.push('gst_no = ?');
            updateValues.push(gst_no || null);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email || null);
        }
        if (website !== undefined) {
            updateFields.push('website = ?');
            updateValues.push(website || null);
        }
        if (booking_contact_name !== undefined) {
            updateFields.push('booking_contact_name = ?');
            updateValues.push(booking_contact_name || null);
        }
        if (booking_contact_mobile !== undefined) {
            updateFields.push('booking_contact_mobile = ?');
            updateValues.push(booking_contact_mobile || null);
        }
        if (booking_contact_phone !== undefined) {
            updateFields.push('booking_contact_phone = ?');
            updateValues.push(booking_contact_phone || null);
        }
        if (corresponding_contact_name !== undefined) {
            updateFields.push('corresponding_contact_name = ?');
            updateValues.push(corresponding_contact_name || null);
        }
        if (corresponding_contact_mobile !== undefined) {
            updateFields.push('corresponding_contact_mobile = ?');
            updateValues.push(corresponding_contact_mobile || null);
        }
        if (corresponding_contact_phone !== undefined) {
            updateFields.push('corresponding_contact_phone = ?');
            updateValues.push(corresponding_contact_phone || null);
        }
        if (credit_limit !== undefined) {
            updateFields.push('credit_limit = ?');
            updateValues.push(credit_limit || 0);
        }
        if (credit_allowed !== undefined) {
            updateFields.push('credit_allowed = ?');
            updateValues.push(credit_allowed ? 1 : 0);
        }
        if (company_info !== undefined) {
            updateFields.push('company_info = ?');
            updateValues.push(company_info || null);
        }
        if (have_discount !== undefined) {
            updateFields.push('have_discount = ?');
            updateValues.push(have_discount ? 1 : 0);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (validHotelId !== undefined) {
            updateFields.push('hotelid = ?');
            updateValues.push(validHotelId);
        }

        updateFields.push('updated_at = ?');
        updateValues.push(updated_at);
        
        if (updated_by_id || userId) {
            updateFields.push('updated_by_id = ?');
            updateValues.push(updated_by_id || userId);
        }

        updateValues.push(id);

        const updateSql = `UPDATE company_master SET ${updateFields.join(', ')} WHERE company_id = ?`;
        const [result] = await connection.execute(updateSql, updateValues);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        await connection.commit();

        const [updatedCompany] = await connection.execute(`
            SELECT 
                c.*,
                ct.city_name,
                s.state_name,
                co.country_name
            FROM company_master c
            LEFT JOIN mstcitymaster ct ON ct.cityid = c.city_id
            LEFT JOIN mststatemaster s ON s.stateid = c.state_id
            LEFT JOIN mstcountrymaster co ON co.countryid = c.country_id
            WHERE c.company_id = ?
        `, [id]);

        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: updatedCompany[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating company:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update company", 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

exports.deleteCompany = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

       const { id } = req.params;
       let hotelId = req.body?.hotelid || getCurrentUserHotelId(req);

        const [existingCompany] = await connection.execute(
            'SELECT hotelid FROM company_master WHERE company_id = ?',
            [id]
        );
        
        if (!existingCompany || existingCompany.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        if (!hotelId) {
            hotelId = existingCompany[0].hotelid;
        }

        if (existingCompany[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const [result] = await connection.execute(
            'DELETE FROM company_master WHERE company_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        await connection.commit();

        res.status(200).json({ 
            success: true, 
            message: "Company deleted successfully", 
            data: { company_id: parseInt(id) } 
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting company:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete company", 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};