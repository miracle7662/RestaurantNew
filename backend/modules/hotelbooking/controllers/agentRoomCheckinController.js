// agentRoomCheckinController.js
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

/**
 * Safely converts a value to a number or null.
 * Prevents empty strings / undefined from being passed to DECIMAL columns.
 */
const toDecimalOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
};

/**
 * Safely converts a value to a valid DATE string (YYYY-MM-DD) or null.
 * Prevents empty strings from being inserted into MySQL DATE columns.
 */
const toDateOrNull = (value) => {
  if (!value || value === '') return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

/**
 * CREATE agent room checkin record
 * Called ONLY when a travel agent is selected during checkin.
 */
exports.createAgentRoomCheckin = async (req, res) => {
  try {
    const {
      checkin_id,
      reg_no,
      hotelid,
      guest_id,
      agent_id,
      agent_name,
      agent_code,
      commission_type,
      commission_value,
      commission_amount,
      agent_cgst_percent,
      agent_cgst_amount,
      agent_sgst_percent,
      agent_sgst_amount,
      agent_igst_percent,
      agent_igst_amount,
      agent_cess_percent,
      agent_cess_amount,
      agent_tds_percent,
      agent_tds_amount,
      agent_tcs_percent,
      agent_tcs_amount,
      agent_service_fee,
      agent_total_commission,
      agent_pay_to_hotel,
      room_id,
      room_number,
      room_category_id,
      converted_category_id,
      total_room_charges,
      total_extra_charges,
      grand_total_amount,
      payment_method,
      plan_name,
      booking_id,
      booking_date,
      status = 'active',
      is_billed = 0,
      is_dayend = 0,
      created_by_id
    } = req.body;

    const userId = created_by_id || getCurrentUserId(req);

    // ── Required field validation ──────────────────────────────────────────
    if (!checkin_id)  return res.status(400).json({ success: false, message: 'checkin_id is required' });
    if (!reg_no)      return res.status(400).json({ success: false, message: 'reg_no is required' });
    if (!hotelid)     return res.status(400).json({ success: false, message: 'hotelid is required' });
    if (!guest_id)    return res.status(400).json({ success: false, message: 'guest_id is required' });
    if (!room_id)     return res.status(400).json({ success: false, message: 'room_id is required' });
    if (!room_number) return res.status(400).json({ success: false, message: 'room_number is required' });

    // ── Sanitise commission_type ENUM ──────────────────────────────────────
    const safeCommissionType = commission_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';

    // ── Check for existing record (upsert logic) ───────────────────────────
    const [existing] = await db.query(
      `SELECT checkin_transaction_id FROM agent_room_checkin
       WHERE checkin_id = ? AND room_id = ?`,
      [checkin_id, room_id]
    );

    if (existing.length > 0) {
      // UPDATE in-place to avoid duplicate row
      const existingId = existing[0].checkin_transaction_id;

      await db.query(
        `UPDATE agent_room_checkin SET
          agent_id               = ?,
          agent_name             = ?,
          agent_code             = ?,
          commission_type        = ?,
          commission_value       = ?,
          commission_amount      = ?,
          agent_cgst_percent     = ?,
          agent_cgst_amount      = ?,
          agent_sgst_percent     = ?,
          agent_sgst_amount      = ?,
          agent_igst_percent     = ?,
          agent_igst_amount      = ?,
          agent_cess_percent     = ?,
          agent_cess_amount      = ?,
          agent_tds_percent      = ?,
          agent_tds_amount       = ?,
          agent_tcs_percent      = ?,
          agent_tcs_amount       = ?,
          agent_service_fee      = ?,
          agent_total_commission = ?,
          agent_pay_to_hotel     = ?,
          total_room_charges     = ?,
          total_extra_charges    = ?,
          grand_total_amount     = ?,
          payment_method         = ?,
          plan_name              = ?,
          booking_id             = ?,
          booking_date           = ?,
          status                 = ?,
          is_billed              = ?,
          is_dayend              = ?,
          updated_by_id          = ?,
          updated_date           = NOW()
        WHERE checkin_transaction_id = ?`,
        [
          agent_id              || null,
          agent_name            || null,
          agent_code            || null,
          safeCommissionType,
          toDecimalOrNull(commission_value),
          toDecimalOrNull(commission_amount),
          toDecimalOrNull(agent_cgst_percent),
          toDecimalOrNull(agent_cgst_amount),
          toDecimalOrNull(agent_sgst_percent),
          toDecimalOrNull(agent_sgst_amount),
          toDecimalOrNull(agent_igst_percent),
          toDecimalOrNull(agent_igst_amount),
          toDecimalOrNull(agent_cess_percent),
          toDecimalOrNull(agent_cess_amount),
          toDecimalOrNull(agent_tds_percent),
          toDecimalOrNull(agent_tds_amount),
          toDecimalOrNull(agent_tcs_percent),
          toDecimalOrNull(agent_tcs_amount),
          toDecimalOrNull(agent_service_fee),
          toDecimalOrNull(agent_total_commission),
          toDecimalOrNull(agent_pay_to_hotel),
          toDecimalOrNull(total_room_charges),
          toDecimalOrNull(total_extra_charges),
          toDecimalOrNull(grand_total_amount),
          payment_method        || null,
          plan_name             || 'EP',
          booking_id            || null,
          toDateOrNull(booking_date),
          status                || 'active',
          is_billed             ?? 0,
          is_dayend             ?? 0,
          userId,
          existingId,
        ]
      );

      const [updated] = await db.query(
        `SELECT * FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
        [existingId]
      );

      return res.status(200).json({
        success: true,
        message: 'Agent room checkin record updated (duplicate prevented)',
        data: updated[0],
      });
    }

    // ── INSERT new record ──────────────────────────────────────────────────
    // 41 columns, 40 bound params + NOW() inline = 41 values total
    const insertQuery = `
      INSERT INTO agent_room_checkin (
        checkin_id, reg_no, hotelid, guest_id,
        agent_id, agent_name, agent_code,
        commission_type, commission_value, commission_amount,
        agent_cgst_percent, agent_cgst_amount,
        agent_sgst_percent, agent_sgst_amount,
        agent_igst_percent, agent_igst_amount,
        agent_cess_percent, agent_cess_amount,
        agent_tds_percent,  agent_tds_amount,
        agent_tcs_percent,  agent_tcs_amount,
        agent_service_fee,
        agent_total_commission, agent_pay_to_hotel,
        room_id, room_number,
        room_category_id, converted_category_id,
        total_room_charges, total_extra_charges, grand_total_amount,
        payment_method, plan_name, booking_id, booking_date,
        status, is_billed, is_dayend,
        created_by_id, created_date
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, NOW()
      )
    `;

    // 40 bound params (created_date = NOW() is not a param)
    const insertValues = [
      // 1-4: core identifiers
      checkin_id, reg_no, hotelid, guest_id,
      // 5-7: agent info
      agent_id              || null,
      agent_name            || null,
      agent_code            || null,
      // 8-10: commission
      safeCommissionType,
      toDecimalOrNull(commission_value),
      toDecimalOrNull(commission_amount),
      // 11-12: CGST
      toDecimalOrNull(agent_cgst_percent),
      toDecimalOrNull(agent_cgst_amount),
      // 13-14: SGST
      toDecimalOrNull(agent_sgst_percent),
      toDecimalOrNull(agent_sgst_amount),
      // 15-16: IGST
      toDecimalOrNull(agent_igst_percent),
      toDecimalOrNull(agent_igst_amount),
      // 17-18: CESS
      toDecimalOrNull(agent_cess_percent),
      toDecimalOrNull(agent_cess_amount),
      // 19-20: TDS
      toDecimalOrNull(agent_tds_percent),
      toDecimalOrNull(agent_tds_amount),
      // 21-22: TCS
      toDecimalOrNull(agent_tcs_percent),
      toDecimalOrNull(agent_tcs_amount),
      // 23: service fee
      toDecimalOrNull(agent_service_fee),
      // 24-25: totals
      toDecimalOrNull(agent_total_commission),
      toDecimalOrNull(agent_pay_to_hotel),
      // 26-27: room identifiers
      room_id, room_number,
      // 28-29: category IDs
      room_category_id      || null,
      converted_category_id || null,
      // 30-32: charge totals
      toDecimalOrNull(total_room_charges),
      toDecimalOrNull(total_extra_charges),
      toDecimalOrNull(grand_total_amount),
      // 33-36: booking info
      payment_method        || null,
      plan_name             || 'EP',
      booking_id            || null,
      toDateOrNull(booking_date),        // DATE column — never pass empty string
      // 37-39: flags
      status                || 'active',
      is_billed             ?? 0,
      is_dayend             ?? 0,
      // 40: audit
      userId,
      // created_date = NOW() is inline above — total bound params: 40 ✓
    ];

    const [result] = await db.query(insertQuery, insertValues);

    const [created] = await db.query(
      `SELECT * FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
      [result.insertId]
    );

    return res.status(200).json({
      success: true,
      message: 'Agent room checkin record created successfully',
      data: created[0],
    });

  } catch (error) {
    console.error('Error creating agent room checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create agent room checkin record',
      error: error.message,
    });
  }
};

/**
 * GET agent room checkin records by checkin_id
 */
exports.getAgentRoomCheckinByCheckinId = async (req, res) => {
  try {
    const { checkin_id } = req.params;

    const [records] = await db.query(
      `SELECT * FROM agent_room_checkin
       WHERE checkin_id = ?
       ORDER BY checkin_transaction_id DESC`,
      [checkin_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Agent room checkin records fetched successfully',
      data: records,
    });

  } catch (error) {
    console.error('Error fetching agent room checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agent room checkin records',
      error: error.message,
    });
  }
};

/**
 * GET agent room checkin records by guest_id
 */
exports.getAgentRoomCheckinByGuestId = async (req, res) => {
  try {
    const { guest_id } = req.params;

    const [records] = await db.query(
      `SELECT * FROM agent_room_checkin
       WHERE guest_id = ?
       ORDER BY created_date DESC`,
      [guest_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Agent room checkin records fetched successfully',
      data: records,
    });

  } catch (error) {
    console.error('Error fetching agent room checkin by guest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agent room checkin records',
      error: error.message,
    });
  }
};

/**
 * UPDATE agent room checkin record
 */
exports.updateAgentRoomCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Record ID is required for update' });
    }

    const [existing] = await db.query(
      `SELECT checkin_transaction_id FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent room checkin record not found' });
    }

    const allowedFields = [
      'agent_id', 'agent_name', 'agent_code',
      'commission_type', 'commission_value', 'commission_amount',
      'agent_cgst_percent', 'agent_cgst_amount',
      'agent_sgst_percent', 'agent_sgst_amount',
      'agent_igst_percent', 'agent_igst_amount',
      'agent_cess_percent', 'agent_cess_amount',
      'agent_tds_percent',  'agent_tds_amount',
      'agent_tcs_percent',  'agent_tcs_amount',
      'agent_service_fee',
      'agent_total_commission', 'agent_pay_to_hotel',
      'total_room_charges', 'total_extra_charges', 'grand_total_amount',
      'payment_method', 'plan_name', 'booking_id', 'booking_date',
      'status', 'is_billed', 'is_dayend',
    ];

    const decimalFields = new Set([
      'commission_value', 'commission_amount',
      'agent_cgst_percent', 'agent_cgst_amount',
      'agent_sgst_percent', 'agent_sgst_amount',
      'agent_igst_percent', 'agent_igst_amount',
      'agent_cess_percent', 'agent_cess_amount',
      'agent_tds_percent',  'agent_tds_amount',
      'agent_tcs_percent',  'agent_tcs_amount',
      'agent_service_fee',  'agent_total_commission', 'agent_pay_to_hotel',
      'total_room_charges', 'total_extra_charges',    'grand_total_amount',
    ]);

    const updates = [];
    const values  = [];

    allowedFields.forEach((field) => {
      if (updateData[field] === undefined) return;
      updates.push(`${field} = ?`);
      if (field === 'booking_date') {
        values.push(toDateOrNull(updateData[field]));
      } else if (field === 'commission_type') {
        values.push(updateData[field] === 'FIXED' ? 'FIXED' : 'PERCENTAGE');
      } else if (decimalFields.has(field)) {
        values.push(toDecimalOrNull(updateData[field]));
      } else {
        values.push(updateData[field] ?? null);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    updates.push('updated_by_id = ?');
    updates.push('updated_date = NOW()');
    values.push(userId);
    values.push(id); // WHERE clause

    const query = `
      UPDATE agent_room_checkin
      SET ${updates.join(', ')}
      WHERE checkin_transaction_id = ?
    `;
    await db.query(query, values);

    const [updated] = await db.query(
      `SELECT * FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Agent room checkin record updated successfully',
      data: updated[0],
    });

  } catch (error) {
    console.error('Error updating agent room checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update agent room checkin record',
      error: error.message,
    });
  }
};

/**
 * DELETE agent room checkin record
 */
exports.deleteAgentRoomCheckin = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      `SELECT checkin_transaction_id FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent room checkin record not found' });
    }

    await db.query(
      `DELETE FROM agent_room_checkin WHERE checkin_transaction_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Agent room checkin record deleted successfully',
      data: { checkin_transaction_id: parseInt(id) },
    });

  } catch (error) {
    console.error('Error deleting agent room checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete agent room checkin record',
      error: error.message,
    });
  }
};