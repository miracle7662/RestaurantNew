// controllers/bookedByContactsController.js
const db = require('../../../config/db');

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

exports.getBookedByContacts = async (req, res) => {
    try {
        const [contacts] = await db.execute(`
            SELECT bbc.*, 
                   c.country_name, s.state_name, ct.city_name
            FROM booked_by_contacts bbc
            LEFT JOIN mstcountrymaster c ON bbc.country_id = c.countryid
            LEFT JOIN mststatemaster s ON bbc.state_id = s.stateid
            LEFT JOIN mstcitymaster ct ON bbc.city_id = ct.cityid
            ORDER BY bbc.booked_by_id DESC
        `);
        
        const formattedContacts = contacts.map(contact => ({
            ...contact,
            created_at: formatDate(contact.created_at),
            updated_at: formatDate(contact.updated_at)
        }));
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: formattedContacts 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.getBookedByContactById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [contacts] = await db.execute(
            `SELECT * FROM booked_by_contacts WHERE booked_by_id = ?`,
            [id]
        );
        
        if (contacts.length === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }
        
        const contact = contacts[0];
        contact.created_at = formatDate(contact.created_at);
        contact.updated_at = formatDate(contact.updated_at);
        
        res.json({ 
            success: true, 
            message: "Data fetched successfully", 
            data: contact 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
};

exports.addBookedByContact = async (req, res) => {
    try {
        const { name, mobile1, mobile2, email, website, address, country_id, state_id, city_id } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const [result] = await db.execute(`
            INSERT INTO booked_by_contacts (name, mobile1, mobile2, email, website, address, country_id, state_id, city_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, mobile1 || null, mobile2 || null, email || null, website || null,
            address || null, country_id || null, state_id || null, city_id || null
        ]);

        res.status(201).json({
            success: true,
            message: "Contact added successfully",
            data: { booked_by_id: result.insertId, ...req.body }
        });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add contact", 
            error: error.message 
        });
    }
};

exports.updateBookedByContact = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const [existing] = await db.execute(
            'SELECT booked_by_id FROM booked_by_contacts WHERE booked_by_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        const allowedFields = ['name', 'mobile1', 'mobile2', 'email', 'website', 'address', 'country_id', 'state_id', 'city_id'];

        const updates = [];
        const values = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        values.push(id);
        const query = `UPDATE booked_by_contacts SET ${updates.join(', ')} WHERE booked_by_id = ?`;
        
        const [result] = await db.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Contact not found or no changes" });
        }

        res.json({ 
            success: true, 
            message: "Contact updated successfully", 
            data: { booked_by_id: parseInt(id), ...updateData } 
        });
    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update contact", 
            error: error.message 
        });
    }
};

exports.deleteBookedByContact = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute(
            'SELECT booked_by_id FROM booked_by_contacts WHERE booked_by_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        const [result] = await db.execute(
            'DELETE FROM booked_by_contacts WHERE booked_by_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        res.json({ 
            success: true, 
            message: "Contact deleted successfully", 
            data: { booked_by_id: parseInt(id) } 
        });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete contact", 
            error: error.message 
        });
    }
};