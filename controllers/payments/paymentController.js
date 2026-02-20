const { pool } = require("../../utils/dbConnection");

getPaymentHistory = async (req, res) => {
  try {
    const parent_id = req.user.id;

    const payments = await pool.query(
      `
      SELECT 
          cp.id,
          cp.amount,
          cp.payment_status,
          cp.payment_date,
          b.id AS booking_id,
          c.full_name AS child_name,
          v.number_plate AS van_number,
          u.full_name AS driver_name
      FROM cash_payments cp
      JOIN bookings b ON b.id = cp.booking_id
      JOIN children c ON c.id = b.child_id
      LEFT JOIN vans v ON v.id = b.van_id
      LEFT JOIN users u ON u.id = v.driver_id
      WHERE cp.parent_id = $1
      ORDER BY cp.payment_date DESC
    `,
      [parent_id]
    );

    res.status(200).json({ payments: payments.rows });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getPaymentHistory };
