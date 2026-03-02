const { pool } = require("../../utils/dbConnection");

driverApplications = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const r = await pool.query(
      `
      SELECT 
    U.id,
    U.full_name,
    U.email,
    U.phone,
    U.created_at,
    CASE WHEN DA.is_approved = false THEN 'PENDING' ELSE 'VERIFIED' END AS status,
    ARRAY_AGG(DISTINCT V.number_plate) AS vans,
    JSONB_AGG(DISTINCT DD) FILTER (WHERE DD.id IS NOT NULL) AS driver_documents
FROM users U
LEFT JOIN driver_approvals DA ON U.id = DA.driver_id
LEFT JOIN driver_documents DD ON U.id = DD.driver_id
LEFT JOIN vans V ON U.id = V.driver_id
WHERE U.role = 'DRIVER' 
  AND U.is_verified = true
GROUP BY U.id,DA.is_approved;
    `,
    );
    await pool.query("COMMIT");
    res.json(r.rows);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

verifyDriver = async (req, res) => {
  const { driver_id } = req.params;
  const { is_approved } = req.body;
  try {
    await pool.query("BEGIN");
    await pool.query(
      "UPDATE driver_approvals SET is_approved=$1 WHERE driver_id=$2",
      [is_approved, driver_id],
    );
    await pool.query(
      "UPDATE driver_documents SET is_verified=$1 WHERE driver_id=$2",
      [is_approved, driver_id],
    );
    await pool.query("COMMIT");
    res.json({ message: "Driver verified successfully" });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

module.exports = { driverApplications, verifyDriver };
