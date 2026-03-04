const { pool } = require("../../utils/dbConnection");
const { uploadBufferToCloudinary } = require("../../middlewares/cloudinary");

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
          cp.proof_photo,
          cp.due_date,
          b.id AS booking_id,
          jsonb_agg(to_jsonb(c.*)) AS children,
          v.number_plate AS van_number,
          u.full_name AS driver_name
      FROM cash_payments cp
      JOIN bookings b ON b.id = cp.booking_id
      JOIN children c ON c.id = b.child_id
      LEFT JOIN vans v ON v.id = b.van_id
      LEFT JOIN users u ON u.id = v.driver_id
      WHERE cp.parent_id = $1
      GROUP BY cp.id, b.id, v.id, u.id
      ORDER BY cp.payment_date DESC
    `,
      [parent_id]
    );

    res.status(200).json({ payments: payments.rows });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

payNow = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const booking_id = req.params.booking_id;
    const parent_id = req.user.id;

    if (!req.files?.proof_photo?.[0]) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Payment proof required" });
    }

    const isBooking = await pool.query(
      `
      SELECT * FROM cash_payments WHERE booking_id = $1 AND parent_id = $2 AND payment_status = 'PENDING'
    `,
      [booking_id, parent_id]
    );

    if (!isBooking.rows.length) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Booking not exists" });
    }

    // Upload payment proof to Cloudinary
    let proof_photo = "";
    try {
      const result = await uploadBufferToCloudinary(
        req.files.proof_photo[0].buffer,
        req.files.proof_photo[0].originalname,
        "payments/proofs"
      );
      proof_photo = result.secure_url;
    } catch (uploadError) {
      await pool.query("ROLLBACK");
      console.error("Payment proof upload failed:", uploadError.message);
      return res.status(500).json({ message: "File upload failed", error: uploadError.message });
    }

    await pool.query(
      `
      UPDATE cash_payments
      SET proof_photo = $1, payment_status = 'PAID', payment_date = NOW() WHERE booking_id = $2
    `,
      [proof_photo, booking_id]
    );

    await pool.query("COMMIT");

    return res.status(200).json({ message: "Payment successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  } finally {
    await pool.query("END");
  }
};

module.exports = { getPaymentHistory, payNow };
