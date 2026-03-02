const { pool } = require("../../utils/dbConnection");

driverApplications = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const policeId = req.user.id;
    const { rows: police } = await pool.query(
      "SELECT * FROM users WHERE id=$1 AND role='POLICE'",
      [policeId],
    );
    if (police.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(403).json({ message: "Access denied" });
    }
    const r = await pool.query(
      `
      SELECT 
    U.id,
    U.full_name,
    U.email,
    U.phone,
    U.created_at,
    DA.approved_at AS approval_date,
    CASE 
        WHEN DA.is_approved = true THEN 'VERIFIED'
        WHEN DA.is_approved = false THEN 'REJECTED'
        ELSE 'PENDING'
        END AS status,
     ARRAY_AGG(DISTINCT V.number_plate) 
          FILTER (WHERE V.id IS NOT NULL) AS vans,
    JSONB_AGG(DISTINCT DD) FILTER (WHERE DD.id IS NOT NULL) AS driver_documents
    FROM users U
    LEFT JOIN driver_approvals DA ON U.id = DA.driver_id
    LEFT JOIN driver_documents DD ON U.id = DD.driver_id
    LEFT JOIN vans V ON U.id = V.driver_id
    WHERE U.role = 'DRIVER' 
      AND U.is_verified = true
    GROUP BY 
        U.id,
        U.full_name,
        U.email,
        U.phone,
        U.created_at,
        DA.is_approved,
        DA.approved_at;
    `,
    );
    await pool.query("COMMIT");
    const drivers = {
      drivers: r.rows,
      police: police[0],
    };
    res.json(drivers);
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
    res.json({
      message: `Driver ${is_approved ? "approved" : "rejected"} successfully`,
    });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

report = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const report = await pool.query(
      `
      SELECT COUNT(DD.driver_license) AS total_drivers_licensed,
      COUNT(DD.id_card) AS total_drivers_id_card, 
      COUNT(DD.vehicle_docs) AS total_drivers_vehicle_docs,
      COUNT(DD.vehicle_photo) AS total_drivers_vehicle_photo,
      COUNT(DD.number_plate) AS total_drivers_number_plate,
      COUNT(CASE WHEN DA.is_approved = true THEN 1 END) AS total_verified_drivers,
      COUNT(CASE WHEN DA.is_approved = false THEN 1 END) AS total_rejected_drivers
      from driver_documents DD
      JOIN driver_approvals DA ON DA.driver_id=DD.driver_id
      `,
    );
    await pool.query("COMMIT");
    res.json(report.rows[0]);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

module.exports = { driverApplications, verifyDriver, report };
