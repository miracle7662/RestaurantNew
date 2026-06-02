const db = require('../../../config/db');

// Helper (not really needed here but kept same)
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL PLANS
exports.getPlans = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM subscription_plan');

    const sanitizedData = rows.map(row => ({
      ...row,
      plan_amount: parseFloat(row.plan_amount) || 0
    }));

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: sanitizedData
    });

  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD PLAN
exports.addPlan = async (req, res) => {
  try {
    const {
      plan_name,
      plan_duration_months,
      plan_amount,
      max_hotels,
      max_users,
      is_active
    } = req.body;

    const created_date = new Date();

    const query = `
      INSERT INTO subscription_plan
      (plan_name, plan_duration_months, plan_amount, max_hotels, max_users, is_active, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      plan_name,
      plan_duration_months,
      plan_amount,
      max_hotels || 1,
      max_users || 5,
      is_active !== undefined ? is_active : 1,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Subscription plan added successfully",
      data: {
        plan_id: result.insertId,
        plan_name,
        plan_duration_months,
        plan_amount,
        max_hotels: max_hotels || 1,
        max_users: max_users || 5,
        is_active: is_active !== undefined ? is_active : 1,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add subscription plan",
      error: error.message
    });
  }
};

// ✅ UPDATE PLAN
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan_name,
      plan_duration_months,
      plan_amount,
      max_hotels,
      max_users,
      is_active
    } = req.body;

    const updated_date = new Date();

    const query = `
      UPDATE subscription_plan
      SET plan_name = ?,
          plan_duration_months = ?,
          plan_amount = ?,
          max_hotels = ?,
          max_users = ?,
          is_active = ?,
          updated_date = ?
      WHERE plan_id = ?
    `;

    const [result] = await db.execute(query, [
      plan_name,
      plan_duration_months,
      plan_amount,
      max_hotels,
      max_users,
      is_active,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: {
        plan_id: parseInt(id),
        plan_name,
        plan_duration_months,
        plan_amount,
        max_hotels,
        max_users,
        is_active,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription plan",
      error: error.message
    });
  }
};

// ✅ DELETE PLAN
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM subscription_plan WHERE plan_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
      data: { plan_id: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete subscription plan",
      error: error.message
    });
  }
};