const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

// ---------- Get All Document Types ----------
exports.getDocumentTypes = async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM document_type_master';
        const params = [];

        if (status !== undefined) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY document_type_name ASC';

        const [documentTypes] = await db.execute(query, params);
        res.json({ success: true, data: documentTypes });
    } catch (error) {
        console.error('Error in getDocumentTypes:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ---------- Get Single Document Type ----------
exports.getDocumentType = async (req, res) => {
    try {
        const { id } = req.params;
        const [docType] = await db.execute(
            'SELECT * FROM document_type_master WHERE id = ?',
            [id]
        );

        if (!docType || docType.length === 0) {
            return res.status(404).json({ success: false, message: 'Document type not found' });
        }

        res.json({ success: true, data: docType[0] });
    } catch (error) {
        console.error('Error in getDocumentType:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ---------- Create Document Type ----------
exports.addDocumentType = async (req, res) => {
    try {
        const { document_type_name, has_front, has_back, status } = req.body;
        const userId = getCurrentUserId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!document_type_name) {
            return res.status(400).json({ success: false, message: 'Document type name is required' });
        }

        // Check for duplicate
        const [existing] = await db.execute(
            'SELECT id FROM document_type_master WHERE document_type_name = ?',
            [document_type_name]
        );
        
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Document type already exists' });
        }

        const [result] = await db.execute(`
            INSERT INTO document_type_master (document_type_name, has_front, has_back, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            document_type_name,
            has_front !== undefined ? (has_front ? 1 : 0) : 1,
            has_back !== undefined ? (has_back ? 1 : 0) : 0,
            status !== undefined ? status : 1,
            userId,
            created_date
        ]);

        const [newDocType] = await db.execute(
            'SELECT * FROM document_type_master WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, data: newDocType[0] });
    } catch (error) {
        console.error('Error adding document type:', error);
        res.status(500).json({ success: false, message: 'Failed to add document type', error: error.message });
    }
};

// ---------- Update Document Type ----------
exports.updateDocumentType = async (req, res) => {
    try {
        const { id } = req.params;
        const { document_type_name, has_front, has_back, status } = req.body;
        const userId = getCurrentUserId(req);
        const updated_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [existing] = await db.execute(
            'SELECT * FROM document_type_master WHERE id = ?',
            [id]
        );
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Document type not found' });
        }

        // Check for duplicate (excluding current record)
        if (document_type_name && document_type_name !== existing[0].document_type_name) {
            const [duplicate] = await db.execute(
                'SELECT id FROM document_type_master WHERE document_type_name = ? AND id != ?',
                [document_type_name, id]
            );
            if (duplicate && duplicate.length > 0) {
                return res.status(400).json({ success: false, message: 'Document type name already exists' });
            }
        }

        const updates = [];
        const values = [];

        if (document_type_name !== undefined) {
            updates.push('document_type_name = ?');
            values.push(document_type_name);
        }
        if (has_front !== undefined) {
            updates.push('has_front = ?');
            values.push(has_front ? 1 : 0);
        }
        if (has_back !== undefined) {
            updates.push('has_back = ?');
            values.push(has_back ? 1 : 0);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        updates.push('updated_by_id = ?');
        values.push(userId);
        updates.push('updated_date = ?');
        values.push(updated_date);

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const updateSql = `UPDATE document_type_master SET ${updates.join(', ')} WHERE id = ?`;
        await db.execute(updateSql, values);

        const [updated] = await db.execute(
            'SELECT * FROM document_type_master WHERE id = ?',
            [id]
        );
        
        res.json({ success: true, data: updated[0] });
    } catch (error) {
        console.error('Error updating document type:', error);
        res.status(500).json({ success: false, message: 'Failed to update document type', error: error.message });
    }
};

// ---------- Delete Document Type ----------
exports.deleteDocumentType = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM document_type_master WHERE id = ?',
            [id]
        );
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Document type not found' });
        }

        await db.execute('DELETE FROM document_type_master WHERE id = ?', [id]);
        res.json({ success: true, message: 'Document type deleted', data: { id: parseInt(id) } });
    } catch (error) {
        console.error('Error deleting document type:', error);
        res.status(500).json({ success: false, message: 'Failed to delete document type', error: error.message });
    }
};